import {
  getPendingRecords,
  updatePendingRecord,
  deletePendingRecord
} from './offlineQueue';

/**
 * IMPORTANTE:
 * Depois de publicar uma nova versão do Google Apps Script,
 * substitua esta URL pela URL /exec da implantação atual.
 */
export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzksqMvsiHt6Z14ET68ekbuhnkC86bUOqve-giL7yhD6W1pFVU67uUs0php4n29r-OX/exec';

let isSyncing = false;

export interface ScriptResponse {
  success: boolean;
  duplicate?: boolean;
  updated?: boolean;
  message?: string;
  id?: string;
  photoId?: string;
  photoUrl?: string;
  photoWarning?: string;
  rowNumber?: number;
  errorCode?: string;
}

interface SyncProgress {
  total: number;
  current: number;
  status: 'idle' | 'syncing' | 'completed' | 'failed_offline';
  lastError?: string;
}

interface ImagePayload {
  base64Data: string;
  mimeType: string;
  fileName: string;
}

export function getMovementPatternLabel(pattern: string): string {
  switch ((pattern || '').toString().toUpperCase().trim()) {
    case 'COM_DESLOCAMENTO':
    case 'ANDANDO':
      return 'Com deslocamento';

    case 'SEM_DESLOCAMENTO_ATIVO':
    case 'PARADO_ATIVO':
      return 'Sem deslocamento, mas ativos';

    case 'PARADO_INATIVO':
    case 'TOTALMENTE_PARADO':
      return 'Parado / inativo';

    case 'MOVIMENTO_NAO_IDENTIFICADO':
    case 'NAO_OBSERVADO':
      return 'Não foi possível identificar';

    default:
      return pattern || '';
  }
}

export function getActivityLabel(activity: string): string {
  switch ((activity || '').toString().toUpperCase().trim()) {
    case 'ALIMENTANDO':
      return 'Alimentando-se';
    case 'CAVANDO_TOCA':
      return 'Cavando / mexendo na toca';
    case 'LIMPANDO_QUELAS':
      return 'Limpando quelas ou patas';
    case 'INTERACAO':
      return 'Interação / briga';
    case 'COPULA':
      return 'Cópula';
    case 'FEMEA_OVIGERA':
      return 'Carregando ovos / fêmea ovígera';
    case 'MIGRACAO_REPRODUTIVA':
      return 'Migração reprodutiva';
    case 'MORTO':
      return 'Morto';
    case 'ATIVIDADE_NAO_IDENTIFICADA':
      return 'Não identificado';
    case 'OUTRO':
      return 'Outro';
    default:
      return activity || '';
  }
}

export function getStatusLabel(status: string): string {
  switch ((status || '').toString().toUpperCase().trim()) {
    case 'VIVO':
    case 'VIVO / ATIVO':
      return 'Vivo / Ativo';

    case 'ATROPELADO_VIVO':
    case 'FERIDO':
    case 'FERIDO / ATROPELADO VIVO':
    case 'ATROPELADO (MACHUCADO)':
      return 'Atropelado vivo';

    case 'ATROPELADO_MORTO':
    case 'ATROPELADO MORTO':
    case 'ATROPELADO (SEM VIDA)':
      return 'Atropelado morto';

    case 'MORTO':
      return 'Morto';

    default:
      return status || '';
  }
}

function getLocationSource(record: any): string {
  if (record.fonte_localizacao) return record.fonte_localizacao;
  if (record.location?.isFromPhoto) return 'EXIF_FOTO';
  if (record.location?.isFromDevice) return 'GPS_APARELHO';
  return record.location ? 'GPS_APARELHO' : '';
}

function getGpsAccuracy(record: any): number | string {
  if (record.precisao_gps_metros !== undefined && record.precisao_gps_metros !== null) {
    return record.precisao_gps_metros;
  }

  if (record.location?.accuracy !== undefined && record.location?.accuracy !== null) {
    return record.location.accuracy;
  }

  return '';
}

function getSafeRecordId(record: any): string {
  if (record.id) return String(record.id);
  if (record.localId) return String(record.localId);

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `local_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeCoordinate(value: unknown, fieldName: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .replace(/^'/, '')
      .replace(',', '.');

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  throw new Error(`${fieldName} inválida.`);
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    case 'image/jpg':
    case 'image/jpeg':
    default:
      return 'jpg';
  }
}

function extractImagePayload(record: any, recordId: string): ImagePayload {
  const source = record.base64Data || record.photoBase64 || record.photoUrl;

  if (!source || typeof source !== 'string') {
    throw new Error('A fotografia não foi encontrada no registro.');
  }

  let mimeType = record.mimeType || 'image/jpeg';
  let base64Data = source;

  const dataUrlMatch = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  }

  base64Data = base64Data.replace(/\s/g, '');

  if (!base64Data) {
    throw new Error('A fotografia está vazia ou em formato Base64 inválido.');
  }

  if (!mimeType.startsWith('image/')) {
    throw new Error('O tipo do arquivo enviado não é uma imagem.');
  }

  const extension = extensionFromMimeType(mimeType);
  const fileName = record.fileName || `Caranguejo_${recordId}.${extension}`;

  return {
    base64Data,
    mimeType,
    fileName
  };
}

function normalizeRecordPayload(record: any) {
  if (!record.location) {
    throw new Error('Localização inválida ou ausente.');
  }

  const safeId = getSafeRecordId(record);
  const image = extractImagePayload(record, safeId);

  const latitude = normalizeCoordinate(record.location.latitude, 'Latitude');
  const longitude = normalizeCoordinate(record.location.longitude, 'Longitude');

  const isDead = ['MORTO', 'ATROPELADO_MORTO'].includes(
    String(record.status || '').toUpperCase().trim()
  );

  const movementPattern = isDead ? '' : (record.movementPattern || '');
  const activity = isDead ? '' : (record.activity || '');

  const combinedBehavior = record.behavior || (
    movementPattern && activity
      ? `${movementPattern} | ${activity}`
      : movementPattern || activity || ''
  );

  const observationMode = record.observationMode || 'individual';
  const totalIndividuals = observationMode === 'group' ? (record.totalIndividuals || record.amount || 1) : 1;

  return {
    localId: safeId,
    id: safeId,

    timestamp: record.timestamp || '',
    timestampISO: record.timestampISO || new Date().toISOString(),

    location: {
      latitude,
      longitude,
      accuracy: record.location.accuracy ?? '',
      isFromPhoto: !!record.location.isFromPhoto,
      isFromDevice: !!record.location.isFromDevice
    },

    base64Data: image.base64Data,
    mimeType: image.mimeType,
    fileName: image.fileName,

    color: record.color || '',
    status: record.status || '',
    statusLabel: getStatusLabel(record.status || ''),
    eggVisibility: record.eggVisibility || '',
    
    island: record.island || 'Fernando de Noronha',

    observationMode,
    totalIndividuals,

    // Group Observation Fields
    maleCount: record.maleCount || 0,
    femaleCount: record.femaleCount || 0,
    sexUnknownCount: record.sexUnknownCount || 0,

    ovigerousFemaleCount: record.ovigerousFemaleCount || 0,
    nonOvigerousFemaleCount: record.nonOvigerousFemaleCount || 0,
    eggVisibilityUnknownCount: record.eggVisibilityUnknownCount || 0,

    smallCount: record.smallCount || 0,
    mediumCount: record.mediumCount || 0,
    largeCount: record.largeCount || 0,
    sizeUnknownCount: record.sizeUnknownCount || 0,

    aliveCount: record.aliveCount || 0,
    injuredRoadkillCount: record.injuredRoadkillCount || 0,
    deadRoadkillCount: record.deadRoadkillCount || 0,
    deadOtherCount: record.deadOtherCount || 0,
    statusUnknownCount: record.statusUnknownCount || 0,

    orangeCrabCount: record.orangeCrabCount || 0,
    yellowCrabCount: record.yellowCrabCount || 0,
    purpleCrabCount: record.purpleCrabCount || 0,
    otherColorCrabCount: record.otherColorCrabCount || 0,
    unknownColorCrabCount: record.unknownColorCrabCount || 0,

    movingCount: record.movingCount || 0,
    stationaryActiveCount: record.stationaryActiveCount || 0,
    totallyStillCount: record.totallyStillCount || 0,
    movementUnknownCount: record.movementUnknownCount || 0,

    feedingCount: record.feedingCount || 0,
    diggingCount: record.diggingCount || 0,
    groomingCount: record.groomingCount || 0,
    interactionCount: record.interactionCount || 0,
    copulationCount: record.copulationCount || 0,
    otherActivityCount: record.otherActivityCount || 0,
    activityUnknownCount: record.activityUnknownCount || 0,

    groupContext: record.groupContext || '',
    groupContextNotes: record.groupContextNotes || '',
    groupSummary: record.groupSummary || (observationMode === 'group' 
      ? `Total: ${totalIndividuals}; Machos: ${record.maleCount || 0}; Fêmeas: ${record.femaleCount || 0}; Sexo não identificado: ${record.sexUnknownCount || 0}; Ovígeras: ${record.ovigerousFemaleCount || 0}; Vivos: ${record.aliveCount || 0}; Atropelados mortos: ${record.deadRoadkillCount || 0}; Com deslocamento: ${record.movingCount || 0}; Alimentando-se: ${record.feedingCount || 0}; Contexto: ${record.groupContext || ''}` 
      : ''),

    // Keep individual amount/countType for compatibility mode
    amount: observationMode === 'group' ? totalIndividuals : 1,
    countType: record.countType || '',
    habitat: record.habitat || '',
    sex: record.sex || '',
    sizeClass: record.sizeClass || '',

    movementPattern,
    movementPatternLabel: movementPattern,
    activity,
    activityLabel: activity,
    behavior: combinedBehavior,
    behaviorLabel: combinedBehavior,

    collisionRisk: record.collisionRisk || '',
    weather: record.weather || '',
    notes: record.notes || '',

    dia_da_semana: record.dia_da_semana || '',
    periodo_do_dia: record.periodo_do_dia || '',
    fonte_localizacao: getLocationSource(record),
    precisao_gps_metros: getGpsAccuracy(record),

    moonPhase: record.moonPhase || '',
    moonAge: record.moonAge !== undefined && record.moonAge !== null
      ? record.moonAge
      : '',
    moonIllumination: record.moonIllumination !== undefined && record.moonIllumination !== null
      ? record.moonIllumination
      : '',

    userAgent: record.userAgent || (
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    )
  };
}

function parseServerResponse(text: string): ScriptResponse {
  try {
    return JSON.parse(text) as ScriptResponse;
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 240);
    throw new Error(
      `O servidor não devolveu JSON válido. Resposta recebida: ${preview || '(vazia)'}`
    );
  }
}

/**
 * Envia um registro e só conclui quando o Apps Script confirma success: true.
 */
export async function sendRecordToGoogleScript(record: any): Promise<ScriptResponse> {
  const payload = normalizeRecordPayload(record);

  const payloadLog = {
    ...payload,
    base64Data: payload.base64Data ? '[IMAGEM PRESENTE]' : '[SEM IMAGEM]'
  };
  console.log('[Payload Normalizado]', payloadLog);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });

    const text = await response.text();
    const result = parseServerResponse(text);

    if (!response.ok) {
      throw new Error(
        result.message || `Erro HTTP ${response.status} ao enviar o registro.`
      );
    }

    if (!result.success) {
      throw new Error(result.message || 'O Apps Script recusou o registro.');
    }

    if (!result.id) {
      throw new Error('O servidor confirmou o envio, mas não devolveu o ID do registro.');
    }

    return result;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao comunicar com o servidor.');
    }

    throw error instanceof Error
      ? error
      : new Error(String(error || 'Erro desconhecido no envio.'));
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Sincroniza registros pendentes.
 * Um item só é removido do IndexedDB após confirmação explícita success: true.
 */
export async function syncPendingRecords(
  onProgress?: (progress: SyncProgress) => void
): Promise<void> {
  if (isSyncing) {
    console.log('[Sync] Já existe uma sincronização em andamento.');
    return;
  }

  if (!navigator.onLine) {
    onProgress?.({
      total: 0,
      current: 0,
      status: 'failed_offline',
      lastError: 'Aparelho offline'
    });
    return;
  }

  isSyncing = true;

  try {
    const pendingList = await getPendingRecords();
    const total = pendingList.length;

    if (total === 0) {
      onProgress?.({ total: 0, current: 0, status: 'completed' });
      return;
    }

    onProgress?.({ total, current: 0, status: 'syncing' });

    let enviados = 0;

    for (const record of pendingList) {
      try {
        await updatePendingRecord(record.id, {
          syncStatus: 'sending',
          updatedAt: new Date().toISOString()
        });

        const result = await sendRecordToGoogleScript(record);

        if (!result.success) {
          throw new Error(result.message || 'Envio não confirmado pelo servidor.');
        }

        await deletePendingRecord(record.id);
        enviados += 1;

        onProgress?.({
          total,
          current: enviados,
          status: 'syncing'
        });
      } catch (error: any) {
        const message = error?.message || 'Erro de rede ou do servidor';

        await updatePendingRecord(record.id, {
          syncStatus: 'failed',
          retryCount: (record.retryCount || 0) + 1,
          lastError: message,
          updatedAt: new Date().toISOString()
        });

        onProgress?.({
          total,
          current: enviados,
          status: navigator.onLine ? 'idle' : 'failed_offline',
          lastError: `Falha no registro ${String(record.id).slice(0, 8)}: ${message}`
        });

        break;
      }
    }

    const remaining = await getPendingRecords();

    onProgress?.({
      total,
      current: total - remaining.length,
      status: remaining.length === 0 ? 'completed' : 'idle',
      lastError: remaining.length === 0
        ? undefined
        : 'Há registros pendentes que ainda não foram confirmados pelo servidor.'
    });
  } catch (error: any) {
    onProgress?.({
      total: 0,
      current: 0,
      status: navigator.onLine ? 'idle' : 'failed_offline',
      lastError: error?.message || 'Erro global na sincronização'
    });
  } finally {
    isSyncing = false;
  }
}
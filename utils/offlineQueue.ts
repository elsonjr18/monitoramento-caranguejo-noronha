import { CrabColor, CrabStatus, ObservationMode, GroupObservationData } from '../types';

export interface OfflineRecord extends Partial<GroupObservationData> {
  id: string;
  observationMode?: ObservationMode;
  island?: string;
  timestamp: string;
  timestampISO: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    isFromPhoto?: boolean;
    isFromDevice?: boolean;
  };
  photoBase64: string;
  color: CrabColor;
  status: CrabStatus;
  notes: string;
  userAgent: string;
  syncStatus: 'pending' | 'sending' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;

  // New scientific monitoring fields
  amount?: number;
  habitat?: string;
  behavior?: string;
  collisionRisk?: string;
  weather?: string;

  // Computed automatic analysis fields
  data?: string;
  hora?: string;
  ano?: number;
  mes?: number;
  dia?: number;
  dia_da_semana?: string;
  periodo_do_dia?: string;
  fonte_localizacao?: string;
  precisao_gps_metros?: number;
  moonPhase?: string;
  moonAge?: number;
  moonIllumination?: number;
}

const DB_NAME = 'crab-noronha-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending-records';

// Helper to open indexedDB with retry/fallback
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB não é suportado neste navegador.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Falha ao abrir o IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Save a new record
export async function savePendingRecord(record: Omit<OfflineRecord, 'syncStatus' | 'retryCount' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<OfflineRecord> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // uuid generation safe fallback
    const localId = record.id || (typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9));

    const nowIso = new Date().toISOString();
    const fullRecord: OfflineRecord = {
      ...record,
      id: localId,
      syncStatus: 'pending',
      retryCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const request = store.put(fullRecord);

    request.onsuccess = () => {
      resolve(fullRecord);
    };

    request.onerror = () => {
      reject(request.error || new Error('Falha ao salvar registro pendente.'));
    };
  });
}

// Get all stored pending/failed records
export async function getPendingRecords(): Promise<OfflineRecord[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by createdAt ascending (FIFO)
        const records = request.result as OfflineRecord[];
        records.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(records);
      };

      request.onerror = () => {
        reject(request.error || new Error('Falha ao buscar registros pendentes.'));
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Erro ao recuperar registros:', err);
    return [];
  }
}

// Delete record (upon successful synchronization)
export async function deletePendingRecord(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Falha ao excluir registro pendente.'));
    };
  });
}

// Update an existing record in queue
export async function updatePendingRecord(id: string, changes: Partial<OfflineRecord>): Promise<OfflineRecord> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const record = getRequest.result as OfflineRecord;
      if (!record) {
        reject(new Error(`Registro com ID ${id} não encontrado.`));
        return;
      }

      const updatedRecord: OfflineRecord = {
        ...record,
        ...changes,
        updatedAt: new Date().toISOString()
      };

      const putRequest = store.put(updatedRecord);

      putRequest.onsuccess = () => {
        resolve(updatedRecord);
      };

      putRequest.onerror = () => {
        reject(putRequest.error || new Error('Falha ao atualizar registro pendente.'));
      };
    };

    getRequest.onerror = () => {
      reject(getRequest.error || new Error('Falha ao buscar registro pendente.'));
    };
  });
}

// Clear all pending records (util for wiping synced/test data if needed)
export async function clearPendingRecords(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Falha ao limpar registros.'));
    };
  });
}

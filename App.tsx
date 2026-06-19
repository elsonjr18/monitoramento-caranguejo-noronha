import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PhotoInput from './components/PhotoInput';
import LocationInput from './components/LocationInput';
import { 
  CrabColor, 
  CrabStatus, 
  CrabMovementPattern, 
  CrabActivity, 
  GeoLocation, 
  ObservationData,
  EggVisibility,
  CrabSex,
  CrabSizeClass,
  CountType,
  LocationSource
} from './types';
import { 
  Calendar, Clock, FileText, CheckCircle, AlertTriangle, AlertCircle, Sparkles, Heart, ShieldAlert, ArrowRight, X, Loader2, Wifi, WifiOff, Database, RefreshCw, ChevronDown, ChevronUp, Info, Activity,
  Camera, MapPin, Search, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { savePendingRecord, getPendingRecords, OfflineRecord } from './utils/offlineQueue';
import { syncPendingRecords, sendRecordToGoogleScript, GOOGLE_SCRIPT_URL } from './utils/syncRecords';
import { getMoonData } from './utils/moonPhase';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'red'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'red';
    if (savedTheme && ['light', 'dark', 'red'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'red') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const isLight = theme === 'light';
  const isDark = theme === 'dark';
  const isRed = theme === 'red';

  const s = {
    bodyBg: isLight ? 'bg-[#f7f3e6]/40' : isDark ? 'bg-[#0f172a]' : 'bg-black',
    cardBg: isLight ? 'bg-white border-sand-200 shadow-sm' : isDark ? 'bg-slate-900 border-slate-800/80 shadow-md' : 'bg-black border-red-950/80',
    title: isLight ? 'text-slate-800' : isDark ? 'text-slate-100' : 'text-red-500',
    titleAlt: isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-500',
    textMain: isLight ? 'text-slate-700' : isDark ? 'text-slate-300' : 'text-red-450',
    textMuted: isLight ? 'text-slate-500' : isDark ? 'text-slate-400' : 'text-red-600',
    textLight: isLight ? 'text-slate-400' : isDark ? 'text-slate-500' : 'text-red-800',
    bgInput: isLight ? 'bg-white border-slate-200 text-slate-700' : isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-black border-red-950/60 text-red-500',
    innerBorder: isLight ? 'border-sand-100' : isDark ? 'border-slate-800/60' : 'border-red-950/40',
    
    // Alertas
    infoBox: isLight 
      ? 'bg-sky-50 border-sky-200 text-sky-800' 
      : isDark 
        ? 'bg-sky-950/30 border-sky-900/40 text-sky-300' 
        : 'bg-black border-red-950 text-red-500',
    warnBox: isLight 
      ? 'bg-amber-50 border-amber-200 text-amber-800' 
      : isDark 
        ? 'bg-amber-950/30 border-amber-900/40 text-amber-300' 
        : 'bg-black border-red-950 text-red-500', 
    successBox: isLight 
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
      : isDark 
        ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300' 
        : 'bg-black border-red-950 text-red-550',
        
    expandedSectionBg: isLight ? 'bg-slate-50/50' : isDark ? 'bg-slate-950/40' : 'bg-black',
  };

  const defaultObservationData: ObservationData = {
    observationMode: 'individual',
    island: 'Fernando de Noronha',
    timestamp: '',
    location: null,
    photoUrl: null,
    status: '',
    color: '',
    eggVisibility: '',
    amount: 1,
    countType: '',
    habitat: '',
    notes: '',
    sex: '',
    sizeClass: '',
    movementPattern: '',
    activity: '',
    collisionRisk: '',
    weather: '',

    // Group Observation Fields Defaults
    totalIndividuals: 2,
    maleCount: 0,
    femaleCount: 0,
    sexUnknownCount: 0,
    ovigerousFemaleCount: 0,
    nonOvigerousFemaleCount: 0,
    eggVisibilityUnknownCount: 0,
    smallCount: 0,
    mediumCount: 0,
    largeCount: 0,
    sizeUnknownCount: 0,
    aliveCount: 0,
    injuredRoadkillCount: 0,
    deadRoadkillCount: 0,
    deadOtherCount: 0,
    statusUnknownCount: 0,
    orangeCrabCount: 0,
    yellowCrabCount: 0,
    purpleCrabCount: 0,
    otherColorCrabCount: 0,
    unknownColorCrabCount: 0,
    movingCount: 0,
    stationaryActiveCount: 0,
    totallyStillCount: 0,
    movementUnknownCount: 0,
    feedingCount: 0,
    diggingCount: 0,
    groomingCount: 0,
    interactionCount: 0,
    copulationCount: 0,
    otherActivityCount: 0,
    activityUnknownCount: 0,
    groupContext: '',
    groupContextNotes: ''
  };

  const [formData, setFormData] = useState<ObservationData>(defaultObservationData);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [savedOffline, setSavedOffline] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<any>(null);
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [exifInfo, setExifInfo] = useState<{ success: boolean; message: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [showTechnicalData, setShowTechnicalData] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  const [offlineRecords, setOfflineRecords] = useState<OfflineRecord[]>([]);
  const [syncProgress, setSyncProgress] = useState<{
    total: number;
    current: number;
    status: 'idle' | 'syncing' | 'completed' | 'failed_offline';
    lastError?: string;
  }>({ total: 0, current: 0, status: 'idle' });

  const loadOfflineRecords = async () => {
    try {
      const records = await getPendingRecords();
      setOfflineRecords(records);
    } catch (err) {
      console.error('[App] Erro ao carregar fila:', err);
    }
  };

  const handleSyncProgress = (progress: typeof syncProgress) => {
    setSyncProgress(progress);
    loadOfflineRecords();
  };

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(now);
    setFormData(prev => ({ ...prev, timestamp: formatted }));

    loadOfflineRecords();

    const handleOnline = () => {
      setIsOnline(true);
      if (!isSending) syncPendingRecords(handleSyncProgress).then(loadOfflineRecords);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncPendingRecords(handleSyncProgress).then(loadOfflineRecords);
    }

    const syncInterval = setInterval(() => {
      if (navigator.onLine && !isSending) {
        syncPendingRecords(handleSyncProgress).then(loadOfflineRecords);
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoCapture = (url: string, exifData?: { latitude?: number; longitude?: number; timestamp?: string }) => {
    setFormData(prev => {
      const updated = { ...prev, photoUrl: url };
      
      if (exifData?.latitude !== undefined && exifData?.longitude !== undefined) {
        updated.location = {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          accuracy: 5,
          isFromPhoto: true
        };
        
        let msg = `Coordenadas lidas da foto com sucesso! (${exifData.latitude.toFixed(6)}°, ${exifData.longitude.toFixed(6)}°).`;
        if (exifData.timestamp) {
          updated.timestamp = exifData.timestamp;
          msg += ` O horário do avistamento foi ajustado para ${exifData.timestamp} (data de captura da foto).`;
        }
        setExifInfo({ success: true, message: msg });
      } else {
        setExifInfo({
          success: false,
          message: "Não encontramos dados de GPS gravados nesta imagem. Por favor, utilize o GPS atual do seu celular tocando em 'Obter Localização Atual' no formulário abaixo."
        });
      }
      return updated;
    });

    if (validationError?.includes("foto")) setValidationError(null);
  };

  const handleLocationCapture = (loc: GeoLocation) => {
    setFormData(prev => ({ ...prev, location: loc }));
    if (validationError?.includes("localização")) setValidationError(null);
  };

  // Status effects
  useEffect(() => {
    if (formData.status === CrabStatus.MORTO || formData.status === CrabStatus.ATROPELADO_MORTO) {
      if (formData.movementPattern !== '' || formData.activity !== '') {
        setFormData(prev => ({ ...prev, movementPattern: '', activity: '' }));
      }
    }
    
    // Regra de Consistência: Risco de atropelamento automático
    if (formData.status === CrabStatus.ATROPELADO_VIVO || formData.status === CrabStatus.ATROPELADO_MORTO) {
      if (formData.collisionRisk !== 'Sim') {
        setFormData(prev => ({ ...prev, collisionRisk: 'Sim' }));
      }
    }
  }, [formData.status]);

  // Regras Biológicas: Ovos visíveis -> Fêmea obrigatória
  useEffect(() => {
    if (formData.eggVisibility === EggVisibility.VISIBLE) {
      if (formData.sex !== CrabSex.FEMALE) {
        setFormData(prev => ({ ...prev, sex: CrabSex.FEMALE }));
      }
    }
  }, [formData.eggVisibility]);

  // Regras Biológicas: Totalmente Parado -> Limpar atividade
  useEffect(() => {
    if (formData.movementPattern === CrabMovementPattern.TOTALMENTE_PARADO) {
      if (formData.activity !== '') {
        setFormData(prev => ({ ...prev, activity: '' }));
      }
    }
  }, [formData.movementPattern]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isSending) return;
    
    if (!formData.island) {
      setValidationError("Selecione uma ilha válida para esta observação.");
      const el = document.getElementById('island-section');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }

    if (!formData.photoUrl) {
      setValidationError("A fotografia é obrigatória no registro básico.");
      const el = document.getElementById('photo-section');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    if (!formData.location) {
      setValidationError("A localização (GPS) é obrigatória.");
      const el = document.getElementById('location-section');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }
    if (!formData.habitat) {
      setValidationError("Por favor, informe onde você encontrou o caranguejo.");
      const el = document.getElementById('habitat-section');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }
    if (formData.observationMode === 'individual') {
      if (!formData.status) {
        setValidationError("Por favor, informe como você encontrou o caranguejo.");
        const el = document.getElementById('status-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
      if (!formData.color) {
        setValidationError("Por favor, selecione a cor predominante no registro básico.");
        const el = document.getElementById('color-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
      if (!formData.eggVisibility) {
        setValidationError("Saber se havia ovos visíveis é obrigatório.");
        const el = document.getElementById('eggVisibility-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
    } else {
      // Validations for group mode
      const totalInGrp = formData.totalIndividuals || 2;
      const sumStatus = getDimSum(statusFields);
      const sumColor = getDimSum(colorFields);
      const sumEggs = getDimSum(eggFields);

      if (sumStatus < 1) {
        setValidationError("Informe a condição de pelo menos um indivíduo do grupo.");
        const el = document.getElementById('status-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
      if (sumStatus > totalInGrp) {
        setValidationError(`A soma das condições vitais (${sumStatus}) não pode ultrapassar o total de ${totalInGrp} indivíduos.`);
        const el = document.getElementById('status-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }

      if (sumColor < 1) {
        setValidationError("Informe a cor de pelo menos um indivíduo do grupo ou marque 'cor não identificada'.");
        const el = document.getElementById('color-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
      if (sumColor > totalInGrp) {
        setValidationError(`A soma das cores (${sumColor}) não pode ultrapassar o total de ${totalInGrp} indivíduos.`);
        const el = document.getElementById('color-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }

      if (sumEggs < 1) {
        setValidationError("Informe se havia ovos visíveis em pelo menos um indivíduo ou marque 'não foi possível observar'.");
        const el = document.getElementById('eggVisibility-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
      if (sumEggs > totalInGrp) {
        setValidationError(`A soma dos indivíduos classificados quanto ao ovo (${sumEggs}) não pode ultrapassar o total de ${totalInGrp} indivíduos.`);
        const el = document.getElementById('eggVisibility-section');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
    }

    if (!formData.photoUrl.startsWith('data:image/')) {
      setValidationError("Erro ao processar a foto. Remova e tire novamente.");
      const el = document.getElementById('photo-section');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }

    if (formData.sex === CrabSex.MALE && formData.eggVisibility === EggVisibility.VISIBLE) {
      setValidationError("Atenção: Ovos visíveis indicam uma fêmea. Revise o campo de Sexo sugerido como 'Macho'.");
      const el = document.getElementById('sex-section');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }

    setValidationError(null);
    setConnectionError(null);

    const now = new Date();
    let dateToAnalyze = now;
    if (formData.timestamp) {
      const parts = formData.timestamp.split(' ');
      if (parts.length === 2) {
        const dateParts = parts[0].split('/');
        const timeParts = parts[1].split(':');
        if (dateParts.length === 3 && timeParts.length === 2) {
          const parsed = new Date(
            parseInt(dateParts[2], 10),
            parseInt(dateParts[1], 10) - 1,
            parseInt(dateParts[0], 10),
            parseInt(timeParts[0], 10),
            parseInt(timeParts[1], 10)
          );
          if (!isNaN(parsed.getTime())) dateToAnalyze = parsed;
        }
      }
    }

    const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    
    const h = dateToAnalyze.getHours();
    let computedPeriodo = "Madrugada";
    if (h >= 6 && h < 12) computedPeriodo = "Manhã";
    else if (h >= 12 && h < 18) computedPeriodo = "Tarde";
    else if (h >= 18 && h < 24) computedPeriodo = "Noite";

    const computedFonte = formData.location.isFromPhoto ? LocationSource.EXIF_FOTO : LocationSource.GPS_APARELHO;
    
    const localUUID = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    const moonData = getMoonData(dateToAnalyze);

    const combinedBehavior = (formData.movementPattern && formData.activity) 
      ? `${formData.movementPattern} | ${formData.activity}` 
      : (formData.movementPattern || formData.activity || '');

    const payload = {
      ...formData,
      id: localUUID,
      timestampISO: dateToAnalyze.toISOString(),
      location: {
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        accuracy: formData.location.accuracy || 0,
        isFromPhoto: !!formData.location.isFromPhoto,
        isFromDevice: !!formData.location.isFromDevice
      },
      photoBase64: formData.photoUrl,
      amount: formData.observationMode === 'group' ? formData.totalIndividuals : 1,
      totalIndividuals: formData.observationMode === 'group' ? formData.totalIndividuals : 1,
      behavior: combinedBehavior,
      userAgent: navigator.userAgent,
      dia_da_semana: diasSemana[dateToAnalyze.getDay()],
      periodo_do_dia: computedPeriodo,
      fonte_localizacao: computedFonte,
      moonPhase: moonData.moonPhase,
      moonAge: moonData.moonAge,
      moonIllumination: moonData.moonIllumination
    };
    
    const payloadLog = { ...payload };
    if (payloadLog.photoBase64 && payloadLog.photoBase64.length > 50) {
       payloadLog.photoBase64 = '[IMAGEM PRESENTE]';
    } else {
       payloadLog.photoBase64 = '[SEM IMAGEM]';
    }
    console.log('[Payload]', payloadLog);

    setIsSending(true);

    if (!isOnline) {
      try {
        const saved = await savePendingRecord(payload);
        setSubmittedPayload(saved);
        setSavedOffline(true);
        setShowSuccessModal(true);
        loadOfflineRecords();
      } catch (err: any) {
        setConnectionError("Falha crítica ao salvar offline: " + (err.message || err));
      } finally {
        setIsSending(false);
      }
      return;
    }

    try {
      await sendRecordToGoogleScript(payload);
      setSubmittedPayload(payload);
      setSavedOffline(false);
      setShowSuccessModal(true);
      setValidationError(null);
      setConnectionError(null);
    } catch (err: any) {
      try {
        const saved = await savePendingRecord(payload);
        setSubmittedPayload(saved);
        setSavedOffline(true);
        setShowSuccessModal(true);
        loadOfflineRecords();
      } catch (dbErr: any) {
        setConnectionError("Erro ao enviar e não foi possível salvar offline: " + (dbErr.message || dbErr));
      }
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    let formatted = '';
    try {
      formatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
    } catch (e) {
      const now = new Date();
      formatted = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    }

    setFormData({
      ...defaultObservationData,
      timestamp: formatted
    });
    setExifInfo(null);
    setValidationError(null);
    setConnectionError(null);
    setShowSuccessModal(false);
    setSubmittedPayload(null);
    setShowTechnicalData(false);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.warn('Scroll to top failed gracefully:', e);
    }
  };

  const sexFields: (keyof ObservationData)[] = ['maleCount', 'femaleCount', 'sexUnknownCount'];
  const eggFields: (keyof ObservationData)[] = ['ovigerousFemaleCount', 'nonOvigerousFemaleCount', 'eggVisibilityUnknownCount'];
  const sizeFields: (keyof ObservationData)[] = ['smallCount', 'mediumCount', 'largeCount', 'sizeUnknownCount'];
  const statusFields: (keyof ObservationData)[] = ['aliveCount', 'injuredRoadkillCount', 'deadRoadkillCount', 'deadOtherCount', 'statusUnknownCount'];
  const colorFields: (keyof ObservationData)[] = ['orangeCrabCount', 'yellowCrabCount', 'purpleCrabCount', 'otherColorCrabCount', 'unknownColorCrabCount'];
  const moveFields: (keyof ObservationData)[] = ['movingCount', 'stationaryActiveCount', 'totallyStillCount', 'movementUnknownCount'];
  const actFields: (keyof ObservationData)[] = ['feedingCount', 'diggingCount', 'groomingCount', 'interactionCount', 'copulationCount', 'otherActivityCount', 'activityUnknownCount'];

  const getDimSum = (fields: (keyof ObservationData)[]) => fields.reduce((sum, f) => sum + (formData[f] as number || 0), 0);

  const technicalFieldsCount = [
    formData.sex,
    formData.sizeClass,
    formData.movementPattern,
    formData.activity,
    formData.collisionRisk,
    formData.weather
  ].filter(val => val !== '').length;

  const isOvigerous = formData.eggVisibility === EggVisibility.VISIBLE;
  const isFullyStopped = formData.movementPattern === CrabMovementPattern.TOTALMENTE_PARADO;
  const isCrabRunOver = formData.status === CrabStatus.ATROPELADO_VIVO || formData.status === CrabStatus.ATROPELADO_MORTO;

  // Barra de progresso inteligente
  let progressPercent = 0;
  let completedCount = 0;
  let totalRequiredCount = 6;
  if (formData.observationMode === 'group') {
    const totalInGrp = formData.totalIndividuals || 2;
    const requiredChecks = [
      !!formData.island,
      !!formData.photoUrl,
      !!formData.location,
      !!formData.habitat,
      totalInGrp >= 2,
      getDimSum(statusFields) >= 1,
      getDimSum(colorFields) >= 1,
      getDimSum(eggFields) >= 1
    ];
    completedCount = requiredChecks.filter(Boolean).length;
    totalRequiredCount = requiredChecks.length;
    progressPercent = Math.round((completedCount / totalRequiredCount) * 100);
  } else {
    const requiredFields = [
      formData.island,
      formData.photoUrl,
      formData.location,
      formData.habitat,
      formData.status,
      formData.color,
      formData.eggVisibility
    ];
    completedCount = requiredFields.filter(val => !!val).length;
    totalRequiredCount = requiredFields.length;
    progressPercent = Math.round((completedCount / totalRequiredCount) * 100);
  }

  const renderRadioOption = (name: string, value: string, currentValue: string, label: string | React.ReactNode, desc?: string | React.ReactNode, disabled?: boolean) => {
    const isSelected = currentValue === value;
    
    let btnStyle = '';
    if (isSelected) {
      btnStyle = isLight 
        ? 'border-orange-500 bg-orange-50/80 shadow-md text-orange-950 scale-[1.01]' 
        : isDark 
          ? 'border-orange-500 bg-orange-950/30 shadow-md text-orange-100 scale-[1.01]' 
          : 'border-red-650 bg-red-950/45 text-red-400 font-bold scale-[1.01]';
    } else {
      btnStyle = isLight 
        ? 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/50 text-slate-705' 
        : isDark 
          ? 'border-slate-850 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 text-slate-300' 
          : 'border-red-950 bg-black hover:border-red-900 hover:bg-red-950/10 text-red-600';
    }

    return (
      <button
        key={value}
        type="button"
        onClick={() => { 
          if (!disabled) {
            setFormData(p => ({ ...p, [name]: value }));
            if (navigator.vibrate) navigator.vibrate(50);
          }
        }}
        disabled={disabled}
        className={`
          w-full p-4 sm:p-5 rounded-2xl border-2 text-left flex items-start gap-4 transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/30
          ${btnStyle}
          ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        `}
        aria-pressed={isSelected}
      >
        <div className={`mt-0.5 flex-shrink-0 transition-colors ${isSelected ? (isRed ? 'text-red-500' : 'text-orange-500') : (isRed ? 'text-red-950' : 'text-slate-300')}`}>
          {isSelected ? <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" /> : <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 ${isRed ? 'border-red-950' : 'border-slate-300'}`} />}
        </div>
        <div>
          <span className={`text-base sm:text-lg font-bold tracking-tight ${isSelected ? (isLight ? 'text-orange-955' : isDark ? 'text-orange-100' : 'text-red-400') : (isLight ? 'text-slate-700' : isDark ? 'text-slate-300' : 'text-red-500')}`}>{label}</span>
          {desc && <p className={`text-sm sm:text-[15px] leading-relaxed mt-1 ${isSelected ? (isLight ? 'text-orange-850/80' : isDark ? 'text-orange-200/80' : 'text-red-500/80') : (isLight ? 'text-slate-505' : isDark ? 'text-slate-400' : 'text-red-600')}`}>{desc}</p>}
        </div>
      </button>
    );
  };

  const StepDivider = ({ step, title, desc }: { step: string, title: string, desc?: string }) => (
    <div className="pt-8 pb-3">
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-2 shrink-0 ${
          isLight 
            ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm' 
            : isDark 
              ? 'bg-orange-950/40 text-orange-400 border-orange-900/50 shadow-sm' 
              : 'bg-black text-red-500 border-red-950 shadow-sm'
        }`}>
          {step}
        </div>
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${s.title}`}>{title}</h2>
          {desc && <p className={`text-sm sm:text-[15px] font-medium mt-1.5 ${s.textMuted}`}>{desc}</p>}
        </div>
      </div>
    </div>
  );

  const maxIndividuals = formData.totalIndividuals || formData.amount || 2;
  const isCrabRunOverGrp = formData.observationMode === 'group' && ((formData.injuredRoadkillCount as number || 0) > 0 || (formData.deadRoadkillCount as number || 0) > 0);

  // Auto-update collisionRisk when group involves run over crabs
  useEffect(() => {
    if (isCrabRunOverGrp && formData.collisionRisk !== 'Sim') {
      setFormData(prev => ({ ...prev, collisionRisk: 'Sim' }));
    }
  }, [isCrabRunOverGrp, formData.collisionRisk]);

  const renderGroupCounter = (field: keyof ObservationData, name: string, maxAllowable: number) => {
    const val = formData[field] as number || 0;
    return (
      <div className={`flex items-center justify-between border-b pb-3 mb-3 last:border-0 last:pb-0 last:mb-0 ${isLight ? 'border-slate-100' : isDark ? 'border-slate-800' : 'border-red-950/50'}`}>
        <span className={`text-[13px] font-semibold leading-tight pr-2 w-3/5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{name}</span>
        <div className="flex items-center gap-1.5 w-2/5 justify-end">
          <button type="button" onClick={() => {
            setFormData(p => ({ ...p, [field]: Math.max(0, val - 1) }));
            if (navigator.vibrate) navigator.vibrate(20);
          }} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : isDark ? 'bg-slate-900 bg-opacity-50 text-slate-200' : 'bg-red-950/30 text-red-500'}`}>-</button>
          
          <input type="number" min="0" max={maxAllowable} value={val || ''} onChange={e => {
            const v = Math.min(Math.max(0, parseInt(e.target.value) || 0), maxAllowable);
            setFormData(p => ({ ...p, [field]: v }));
          }} className={`w-11 h-9 text-center font-bold text-[15px] rounded-lg outline-none ${isLight ? 'bg-slate-50' : isDark ? 'bg-slate-900 bg-opacity-30' : 'bg-transparent text-red-500 border border-red-950/50'}`} placeholder="0" />

          <button type="button" disabled={val >= maxAllowable} onClick={() => {
            setFormData(p => ({ ...p, [field]: Math.min(maxAllowable, val + 1) }));
            if (navigator.vibrate) navigator.vibrate(20);
          }} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : isDark ? 'bg-slate-900 bg-opacity-50 text-slate-200' : 'bg-red-950/30 text-red-500'} disabled:opacity-30 disabled:cursor-not-allowed`}>+</button>
        </div>
      </div>
    );
  };

  const getMaxForField = (field: keyof ObservationData, fields: (keyof ObservationData)[]) => {
    return (formData[field] as number || 0) + (maxIndividuals - getDimSum(fields));
  };

  // Handle auto-correction for ovigerous -> females
  useEffect(() => {
    if (formData.observationMode === 'group') {
      const females = formData.femaleCount as number || 0;
      const ovigerous = formData.ovigerousFemaleCount as number || 0;
      if (ovigerous > females) {
        setFormData(p => ({ ...p, femaleCount: ovigerous }));
      }
    }
  }, [formData.ovigerousFemaleCount, formData.observationMode, formData.femaleCount]);

  const renderGroupDetails = () => (
    <div className={`p-4 sm:p-5 space-y-6 ${s.expandedSectionBg}`}>
      <p className={`text-[13px] font-medium leading-relaxed border p-4 rounded-xl shadow-sm ${isLight ? 'bg-white border-slate-200 text-slate-600' : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-black border-red-950/80 text-red-500'}`}>
        <strong className={isLight ? 'text-slate-800' : isDark ? 'text-slate-100' : 'text-red-400'}>Mais informações sobre o grupo observado</strong><br />
        Informe apenas as características que conseguiu observar. Não é necessário identificar todos os indivíduos.
      </p>

      {/* Sex Dimension */}
      <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-black border-red-950/50'}`}>
        <h4 className={`font-bold text-sm mb-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Sexo dos indivíduos</h4>
        {renderGroupCounter('maleCount', 'Machos', getMaxForField('maleCount', sexFields))}
        {renderGroupCounter('femaleCount', 'Fêmeas', getMaxForField('femaleCount', sexFields))}
        {renderGroupCounter('sexUnknownCount', 'Não identificado', getMaxForField('sexUnknownCount', sexFields))}
        {getDimSum(sexFields) < maxIndividuals && <p className={`text-[11px] mt-2 ${s.textLight}`}>Alguns indivíduos não foram classificados.</p>}
        {getDimSum(sexFields) === maxIndividuals && maxIndividuals > 0 && <p className={`text-[11px] mt-2 font-semibold ${isLight ? 'text-emerald-600' : 'text-emerald-500'}`}>Todos foram classificados.</p>}
      </div>

      {/* Size Dimension */}
      <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-black border-red-950/50'}`}>
        <h4 className={`font-bold text-sm mb-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Classes de tamanho</h4>
        {renderGroupCounter('smallCount', 'Pequenos (até 5cm)', getMaxForField('smallCount', sizeFields))}
        {renderGroupCounter('mediumCount', 'Médios (5cm a 10cm)', getMaxForField('mediumCount', sizeFields))}
        {renderGroupCounter('largeCount', 'Grandes (+10cm)', getMaxForField('largeCount', sizeFields))}
        {renderGroupCounter('sizeUnknownCount', 'Não estimado', getMaxForField('sizeUnknownCount', sizeFields))}
      </div>

      {/* Collision Risk */}
      <div className="space-y-2.5">
        <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Havia risco de atropelamento no local?</h4>
        <div className="grid grid-cols-3 gap-2">
          {['Sim', 'Não', 'Não foi possível avaliar'].map(risk => {
            const isDisabledGrp = isCrabRunOverGrp && risk !== 'Sim';
            return (
              <button key={risk} type="button" disabled={isDisabledGrp} onClick={() => setFormData(p => ({ ...p, collisionRisk: risk }))} className={`py-3 px-2 rounded-xl border-2 text-xs font-bold text-center transition-colors ${formData.collisionRisk === risk ? (isRed ? 'bg-red-950/50 border-red-500 text-red-400' : 'bg-orange-500 border-orange-500 text-white') : isDisabledGrp ? (isLight ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-60 cursor-not-allowed' : isDark ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed' : 'bg-black border-red-950/50 text-red-900 opacity-60 cursor-not-allowed') : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-350' : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-755' : 'bg-black border-red-950 text-red-600 hover:border-red-900')}`}>
                {risk}
              </button>
            );
          })}
        </div>
        {isCrabRunOverGrp && (
          <p className={`text-[12px] font-semibold mt-2 flex items-start gap-1.5 p-3 rounded-xl shadow-sm ${s.warnBox}`}>
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>Registro indica indivíduos atropelados, risco marcado como Sim.</span>
          </p>
        )}
      </div>

      {/* Movement Dimension */}
      <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-black border-red-950/50'}`}>
        <h4 className={`font-bold text-sm mb-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Movimento dos indivíduos</h4>
        {renderGroupCounter('movingCount', 'Com deslocamento', getMaxForField('movingCount', moveFields))}
        {renderGroupCounter('stationaryActiveCount', 'Sem deslocamento, mas ativos', getMaxForField('stationaryActiveCount', moveFields))}
        {renderGroupCounter('totallyStillCount', 'Totalmente parados', getMaxForField('totallyStillCount', moveFields))}
        {renderGroupCounter('movementUnknownCount', 'Não observado', getMaxForField('movementUnknownCount', moveFields))}
      </div>

      {/* Activity Dimension */}
      <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-black border-red-950/50'}`}>
        <h4 className={`font-bold text-sm mb-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Atividade principal</h4>
        {renderGroupCounter('feedingCount', 'Alimentando-se', getMaxForField('feedingCount', actFields))}
        {renderGroupCounter('diggingCount', 'Cavando/tocas', getMaxForField('diggingCount', actFields))}
        {renderGroupCounter('interactionCount', 'Interação/briga', getMaxForField('interactionCount', actFields))}
        {renderGroupCounter('copulationCount', 'Cópula', getMaxForField('copulationCount', actFields))}
        {renderGroupCounter('otherActivityCount', 'Outra', getMaxForField('otherActivityCount', actFields))}
        {renderGroupCounter('activityUnknownCount', 'Não identificada', getMaxForField('activityUnknownCount', actFields))}
      </div>

      {/* Group Context Dimension */}
      <div className="space-y-2.5">
        <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Contexto coletivo (Evento)</h4>
        <select 
          value={formData.groupContext} 
          onChange={e => setFormData(p => ({ ...p, groupContext: e.target.value }))}
          className={`w-full text-[15px] font-semibold p-4 border-2 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 rounded-xl transition-all ${s.bgInput}`}
        >
          <option value="">Selecione o contexto principal</option>
          <option value="Observação comum">Observação comum</option>
          <option value="Agrupamento sem deslocamento">Agrupamento sem deslocamento</option>
          <option value="Andada ou migração reprodutiva">Andada ou migração reprodutiva</option>
          <option value="Concentração em tocas">Concentração próximo a tocas</option>
          <option value="Concentração em risco atropelamento">Concentração em área de risco</option>
          <option value="Outro">Outro contexto</option>
          <option value="Não determinado">Não foi possível determinar</option>
        </select>
        {formData.groupContext === 'Outro' && (
          <input type="text" placeholder="Especifique o contexto" value={formData.groupContextNotes} onChange={e => setFormData(p => ({ ...p, groupContextNotes: e.target.value }))} className={`w-full p-4 mt-2 border-2 rounded-xl text-sm font-semibold outline-none ${s.bgInput}`} />
        )}
      </div>

      {/* Tempo */}
      <div className="space-y-2.5">
        <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Como estava o tempo?</h4>
        <div className="space-y-2">
          {['Sem chuva ou seco', 'Chuva fraca ou garoa', 'Chuva forte', 'Tinha acabado de chover', 'Não foi possível informar'].map(w => renderRadioOption('weather', w, formData.weather, w))}
        </div>
      </div>
      
      {/* Resumo do grupo */}
      <div className={`p-4 rounded-xl border-dashed border-2 mt-4 text-xs font-medium space-y-1 ${isLight ? 'bg-orange-50/50 border-orange-200 text-orange-900' : isDark ? 'bg-orange-950/20 border-orange-900/50 text-orange-200' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
        <p className="font-bold uppercase tracking-wider mb-1 opacity-70">Resumo da Avaliação: {maxIndividuals} Indivíduos</p>
        {getDimSum(sexFields) > 0 && <p>&bull; {getDimSum(sexFields)} sexados ({formData.femaleCount||0} fêmeas)</p>}
        {getDimSum(sizeFields) > 0 && <p>&bull; {getDimSum(sizeFields)} de classificados por tamanho</p>}
        {getDimSum(statusFields) > 0 && <p>&bull; {getDimSum(statusFields)} avaliados (estado vital) com {((formData.injuredRoadkillCount as number || 0)+(formData.deadRoadkillCount as number || 0))} vítimas</p>}
        {getDimSum(colorFields) > 0 && <p>&bull; {getDimSum(colorFields)} classificados por cor</p>}
        {getDimSum(eggFields) > 0 && <p>&bull; {getDimSum(eggFields)} analisados quanto a ovos</p>}
        {getDimSum(moveFields) > 0 && <p>&bull; {getDimSum(moveFields)} analisados em mobilidade</p>}
        {getDimSum(actFields) > 0 && <p>&bull; {getDimSum(actFields)} reportados com atividades específicas</p>}
        {formData.groupContext && <p>&bull; Contexto: {formData.groupContext}</p>}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-28 font-sans transition-all duration-300 ${s.bodyBg} ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-500'}`}>
      <Header theme={theme} onThemeChange={handleThemeChange} />

      {/* Cabeçalho Inteligente de GPS */}
      <div className={`px-4 py-2.5 border-b text-xs flex justify-between items-center shadow-sm transition-colors ${
        formData.location
          ? (isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : isDark ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' : 'bg-[#020000] border-red-950 text-red-500')
          : (isLight ? 'bg-sky-50 border-sky-100 text-sky-800' : isDark ? 'bg-sky-950/30 border-sky-900/40 text-sky-400' : 'bg-black border-red-950 text-red-400')
      }`}>
        <div className="flex items-center justify-between font-bold max-w-md md:max-w-lg mx-auto w-full">
          {formData.location ? (
            <>
              <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" /> <span>Localização obtida</span></div>
              <span className={`font-medium ${isLight ? 'text-emerald-600' : isDark ? 'text-emerald-500/80' : 'text-red-700'}`}>
                Precisão: {Math.round(formData.location.accuracy || 0)}m
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Compass className="h-4 w-4 shrink-0 animate-pulse" /> <span>Procurando localização (GPS em 2º plano)...</span>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-md md:max-w-lg mx-auto px-4 py-5 space-y-5">
        
        {/* Alerts & Context */}
        <AnimatePresence>
          {validationError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900">Atenção</h4>
                <p className="text-xs text-rose-700 font-medium">{validationError}</p>
              </div>
              <button type="button" onClick={() => setValidationError(null)} className="text-rose-400 p-1"><X className="h-4 w-4" /></button>
            </motion.div>
          )}
          {connectionError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900">Erro</h4>
                <p className="text-xs text-rose-700 font-medium">{connectionError}</p>
              </div>
              <button type="button" onClick={() => setConnectionError(null)} className="text-rose-400 p-1"><X className="h-4 w-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`rounded-2xl p-4 border transition-all duration-300 ${s.cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${offlineRecords.length > 0 ? 'bg-amber-100/50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {syncProgress.status === 'syncing' ? <Loader2 className="h-5 w-5 animate-spin text-orange-600" /> : <Database className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide">Status de Envio</h4>
                <p className="text-[11px] font-medium mt-0.5">
                  {syncProgress.status === 'syncing' ? (
                    <span className="text-orange-600 animate-pulse font-bold">Enviando ({syncProgress.current}/{syncProgress.total})...</span>
                  ) : offlineRecords.length > 0 ? (
                    isOnline ? <span className="text-amber-700 font-bold">Aguardando envio ao banco</span> : <span className="text-amber-700 font-bold">Sem rede. Salvo no celular.</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">Tudo em dia</span>
                  )}
                </p>
              </div>
            </div>
            {offlineRecords.length > 0 && isOnline && (
              <button 
                type="button" 
                onClick={() => { if (!isSending) syncPendingRecords(handleSyncProgress).then(loadOfflineRecords); }}
                disabled={syncProgress.status === 'syncing' || isSending}
                className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${syncProgress.status === 'syncing' ? 'animate-spin' : ''}`} /> Sincronizar
              </button>
            )}
          </div>
        </div>

        {/* Lembrete / Mensagem de Impacto */}
        <p className={`text-xs text-center font-medium px-4 leading-relaxed ${s.textMuted}`}>
          Cada registro ajuda a entender melhor o comportamento do Caranguejo-Amarelo (Johngarthia lagostoma) e contribui para a sua conservação.
        </p>

        {/* Barra de Progresso Inteligente */}
        <div className={`p-4.5 rounded-2xl border transition-all duration-300 ${s.cardBg} space-y-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-[13px] font-extrabold ${s.title}`}>
              {progressPercent === 100 ? (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0" /> Registro pronto para envio!
                </span>
              ) : (
                <span>Progresso do Registro Básico ({completedCount}/{totalRequiredCount} obrigatórios)</span>
              )}
            </span>
            <span className={`text-xs font-bold ${s.textMuted}`}>{progressPercent}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : isDark ? 'bg-slate-950' : 'bg-red-950/20'}`}>
            <div 
              style={{ width: `${progressPercent}%` }} 
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100 
                  ? 'bg-emerald-500' 
                  : progressPercent >= 60 
                    ? 'bg-orange-500' 
                    : 'bg-sky-500'
              }`}
            ></div>
          </div>
          
          {progressPercent === 100 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className={`p-3.5 rounded-xl border text-xs font-semibold leading-relaxed space-y-1.5 ${s.successBox}`}
            >
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <span>Você já preencheu todas as informações obrigatórias.</span>
              </p>
              <p className="opacity-95 font-medium leading-relaxed">
                Se você observou características adicionais, pode informar mais detalhes abaixo para apoiar ainda mais a pesquisa ecológica.
              </p>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-5">

            <div id="island-section" className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ${s.cardBg} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${isLight ? 'bg-orange-100 text-orange-600' : isDark ? 'bg-orange-950 text-orange-400' : 'bg-red-950/30 text-red-500'}`}>
                  <MapPin className="h-5 w-5" />
                </div>
                <span className={`font-extrabold tracking-tight text-sm ${s.titleAlt}`}>
                  📍 Ilha da observação
                </span>
              </div>
              <div className="w-full sm:w-60">
                <select
                  value={formData.island}
                  onChange={(e) => setFormData(p => ({ ...p, island: e.target.value as import('./types').ObservationIsland }))}
                  className={`w-full py-2 px-3 rounded-xl border-2 font-bold text-xs appearance-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all ${s.bgInput}`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isLight ? '%2364748b' : '%2394a3b8'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.2em 1.2em'
                  }}
                >
                  <option value="Fernando de Noronha">Fernando de Noronha</option>
                  <option value="Atol das Rocas">Atol das Rocas</option>
                  <option value="Ilha da Trindade">Ilha da Trindade</option>
                  <option value="Ilha de Ascensão">Ilha de Ascensão</option>
                </select>
              </div>
            </div>
            
            <StepDivider step="1" title="Fotografia" desc="Registre uma imagem limpa e nítida." />
            
            <div id="photo-section" className="space-y-3">
              <PhotoInput photoUrl={formData.photoUrl} onPhotoCapture={handlePhotoCapture} theme={theme} />
              
              <AnimatePresence>
                {exifInfo && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${exifInfo.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-relaxed">{exifInfo.message}</span>
                    <button type="button" onClick={() => setExifInfo(null)} className="shrink-0 pt-0.5 opacity-60"><X className="h-4 w-4"/></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <StepDivider step="2" title="Localização" desc="Onde ocorreu o avistamento?" />

            <div id="location-section" className="space-y-3">
              <LocationInput location={formData.location} onLocationCapture={handleLocationCapture} theme={theme} />
              
              {formData.location?.accuracy !== undefined && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold leading-relaxed transition-all duration-300 ${
                  formData.location.accuracy <= 5 
                    ? isLight 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                      : isDark 
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                        : 'bg-black border-red-950 text-red-500'
                    : formData.location.accuracy <= 10 
                      ? isLight 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                        : isDark 
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                          : 'bg-black border-red-950 text-red-500'
                      : formData.location.accuracy <= 20 
                        ? isLight 
                          ? 'bg-amber-50/75 border-amber-200 text-amber-800' 
                          : isDark 
                            ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' 
                            : 'bg-black border-red-950 text-red-500'
                        : isLight 
                          ? 'bg-rose-50/70 border-rose-200 text-rose-800' 
                          : isDark 
                            ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' 
                            : 'bg-black border-red-950 text-red-500'
                }`}>
                  <div className={`flex items-center justify-between mb-1.5 pb-1.5 border-b ${isLight ? 'border-black/5' : isDark ? 'border-white/5' : 'border-red-950/40'}`}>
                    <span>Precisão GPS:</span>
                    <span className="font-bold">
                      {formData.location.accuracy <= 5 ? "3 m ✅ Excelente" :
                       formData.location.accuracy <= 10 ? "8 m ✅ Boa" :
                       formData.location.accuracy <= 20 ? "15 m ⚠️ Regular" :
                       "35 m ❌ Baixa"}
                    </span>
                  </div>
                  {formData.location.accuracy > 20 && (
                    <p className={`text-[11px] font-medium leading-relaxed ${isLight ? 'text-slate-600' : isDark ? 'text-slate-400' : 'text-red-650'}`}>
                      A precisão do GPS está baixa, mas você pode enviar o registro normalmente. Sua localização pode ficar mais precisa se você aguardar alguns segundos.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* MODO DE OBSERVAÇÃO (Este registro representa) - Colocado antes de Onde Encontrou */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-all duration-300 ${s.cardBg}`}>
              <div className="space-y-4">
                <div className={`flex items-center gap-3 pb-3 border-b ${s.innerBorder}`}>
                  <div className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-indigo-100 text-indigo-700' : isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-red-950/30 text-red-500'}`}>
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className={`font-extrabold tracking-tight text-lg ${s.titleAlt}`}>Este registro representa:</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(p => ({ ...p, observationMode: 'individual', amount: 1, countType: '' as CountType }));
                      if (navigator.vibrate) navigator.vibrate(50);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                      formData.observationMode === 'individual' 
                        ? (isLight ? 'border-orange-500 bg-orange-50/80 text-orange-800 shadow-md shadow-orange-500/10' : isDark ? 'border-orange-500 bg-orange-950/40 text-orange-300 shadow-lg shadow-orange-900/20' : 'border-red-500 bg-red-950/40 text-red-500') 
                        : (isLight ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 shadow-sm' : isDark ? 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700' : 'border-red-955 bg-black text-red-900 focus:outline-none')
                    }`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full ${formData.observationMode === 'individual' ? 'bg-white shadow-sm' : 'bg-transparent text-slate-400'}`}>
                      <span className="text-2xl sm:text-3xl">🦀</span>
                    </div>
                    <span className="font-extrabold text-[15px] sm:text-base leading-tight">Um<br/>indivíduo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(p => ({ ...p, observationMode: 'group', totalIndividuals: Math.max(2, p.totalIndividuals || 2) }));
                      if (navigator.vibrate) navigator.vibrate(50);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                      formData.observationMode === 'group' 
                        ? (isLight ? 'border-blue-500 bg-blue-50/80 text-blue-800 shadow-md shadow-blue-500/10' : isDark ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-lg shadow-blue-900/20' : 'border-red-500 bg-red-950/40 text-red-500') 
                        : (isLight ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 shadow-sm' : isDark ? 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700' : 'border-red-955 bg-black text-red-900 focus:outline-none')
                    }`}
                  >
                    <div className={`w-14 h-12 flex items-center justify-center rounded-full ${formData.observationMode === 'group' ? 'bg-white shadow-sm' : 'bg-transparent text-slate-400'}`}>
                      <span className="text-2xl sm:text-3xl">🦀🦀</span>
                    </div>
                    <span className="font-extrabold text-[15px] sm:text-base leading-tight">Vários<br/>indivíduos</span>
                  </button>
                </div>

                {formData.observationMode === 'group' && (
                  <div className="flex flex-col gap-4 mt-2 mb-4">
                    <div className="space-y-1">
                      <h4 className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Quantos caranguejos foram observados no total?</h4>
                    </div>
                    <div className="flex items-center gap-3 h-14">
                      <button type="button" onClick={() => {
                        setFormData(p => ({ ...p, totalIndividuals: Math.max(2, (p.totalIndividuals || 2) - 1) }));
                        if (navigator.vibrate) navigator.vibrate(30);
                      }} className={`p-3 h-full rounded-xl font-bold w-14 text-center text-xl transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : isDark ? 'bg-slate-950 hover:bg-slate-900 text-slate-200' : 'bg-red-950/30 hover:bg-red-950/50 text-red-500'}`}>-</button>
                      <input 
                        type="number" 
                        min="2" 
                        value={formData.totalIndividuals || ''} 
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setFormData(p => ({ ...p, totalIndividuals: isNaN(val) ? 2 : Math.max(2, val) }))
                        }}
                        className={`border-2 p-3 h-full focus:ring outline-none w-28 text-center font-black text-xl rounded-xl transition-all ${s.bgInput} ${isLight ? 'focus:ring-orange-200 border-slate-200' : isDark ? 'focus:ring-orange-900 border-slate-750' : 'focus:ring-red-950 border-red-950'}`} 
                      />
                      <button type="button" onClick={() => {
                        setFormData(p => ({ ...p, totalIndividuals: (p.totalIndividuals || 2) + 1 }));
                        if (navigator.vibrate) navigator.vibrate(30);
                      }} className={`p-3 h-full rounded-xl font-bold w-14 text-center text-xl transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : isDark ? 'bg-slate-950 hover:bg-slate-900 text-slate-200' : 'bg-red-950/30 hover:bg-red-950/50 text-red-500'}`}>+</button>
                    </div>
                    <select 
                      value={formData.countType} 
                      onChange={e => setFormData(p => ({ ...p, countType: e.target.value as CountType }))}
                      className={`w-full text-base font-semibold p-4 border-2 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 rounded-xl transition-all h-14 ${s.bgInput}`}
                    >
                      <option value="">Forma de contagem (Opcional)</option>
                      {Object.values(CountType).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div id="habitat-section" className={`p-5 rounded-2xl border space-y-3.5 transition-all duration-300 ${s.cardBg}`}>
              <div className={`flex items-center gap-2.5 pb-3 border-b ${s.innerBorder}`}>
                <div className={`p-1.5 rounded-lg shrink-0 ${isLight ? 'bg-emerald-100 text-emerald-800' : isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950/30 text-red-500'}`}>
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className={`font-extrabold tracking-tight text-base ${s.titleAlt}`}>Local da observação *</h3>
              </div>
              <p className={`text-[13px] leading-normal ${s.textMuted}`}>
                Selecione o ambiente onde ocorreu o avistamento.
              </p>
              <select 
                value={formData.habitat} 
                onChange={e => {
                  setFormData(p => ({ ...p, habitat: e.target.value }));
                  if (validationError?.includes("encontrou") || validationError?.includes("ambiente") || validationError?.includes("local")) {
                    setValidationError(null);
                  }
                }}
                className={`w-full text-sm font-semibold p-4 border-2 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 rounded-xl transition-all ${s.bgInput}`}
              >
                <option value="">Selecione o ambiente da observação</option>
                <option value="Estrada ou rua">Estrada ou rua</option>
                <option value="Trilha">Trilha</option>
                <option value="Vegetação ou mata">Vegetação ou mata</option>
                <option value="Área urbana ou próxima a construções">Área urbana ou próxima a construções</option>
                <option value="Praia ou areia">Praia ou areia</option>
                <option value="Costão rochoso ou pedras">Costão rochoso ou pedras</option>
                <option value="Outro local">Outro local</option>
                <option value="Não consegui identificar">Não consegui identificar</option>
              </select>
            </div>

            <StepDivider step="3" title={formData.observationMode === 'group' ? 'Características observadas' : 'Características observadas'} desc="Principais informações do registro." />

            <div id="status-section" className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all duration-300 ${s.cardBg}`}>
              <div className={`flex items-center gap-3 pb-3 border-b ${s.innerBorder}`}>
                <div className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-orange-100 text-orange-600' : isDark ? 'bg-orange-950 text-orange-400' : 'bg-red-950/30 text-red-500'}`}>
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className={`font-extrabold tracking-tight text-lg ${s.titleAlt}`}>
                  {formData.observationMode === 'group' ? 'Qual era a condição dos indivíduos observados?' : 'Como você encontrou o caranguejo?'}
                </h3>
              </div>
              
              {formData.observationMode === 'group' ? (
                <div className="space-y-4">
                  <p className={`text-sm ${s.textMuted}`}>Informe a condição vital dos indivíduos do grupo. A soma não pode ultrapassar o total de {maxIndividuals} indivíduos.</p>
                  <div className="space-y-1">
                    {renderGroupCounter('aliveCount', 'Vivos e ativos', getMaxForField('aliveCount', statusFields))}
                    {renderGroupCounter('injuredRoadkillCount', 'Atropelados vivos', getMaxForField('injuredRoadkillCount', statusFields))}
                    {renderGroupCounter('deadRoadkillCount', 'Atropelados mortos', getMaxForField('deadRoadkillCount', statusFields))}
                    {renderGroupCounter('deadOtherCount', 'Mortos (outra causa)', getMaxForField('deadOtherCount', statusFields))}
                    {renderGroupCounter('statusUnknownCount', 'Estado não identificado', getMaxForField('statusUnknownCount', statusFields))}
                  </div>
                  {getDimSum(statusFields) < maxIndividuals && <p className={`text-[11px] ${s.textLight}`}>Alguns indivíduos não foram classificados quanto à condição vital.</p>}
                  {getDimSum(statusFields) === maxIndividuals && maxIndividuals > 0 && <p className={`text-[11px] font-semibold text-emerald-500`}>Todos os {maxIndividuals} indivíduos foram classificados.</p>}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {Object.values(CrabStatus).map(status => renderRadioOption('status', status, formData.status, status))}
                </div>
              )}
            </div>

            <div id="color-section" className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all duration-300 ${s.cardBg}`}>
              <div className={`flex items-center gap-3 pb-3 border-b ${s.innerBorder}`}>
                <div className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-amber-100 text-amber-750' : isDark ? 'bg-amber-950 text-amber-400' : 'bg-red-950/30 text-red-500'}`}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className={`font-extrabold tracking-tight text-lg ${s.titleAlt}`}>
                    {formData.observationMode === 'group' ? 'Cores observadas' : 'Cor predominante'}
                  </h3>
                </div>
              </div>

              {formData.observationMode === 'group' ? (
                <div className="space-y-4">
                  <p className={`text-sm ${s.textMuted}`}>Indique a cor dos indivíduos do grupo. A soma não pode ultrapassar o total de {maxIndividuals} indivíduos.</p>
                  <div className="space-y-1">
                    {renderGroupCounter('orangeCrabCount', 'Laranja ou avermelhado', getMaxForField('orangeCrabCount', colorFields))}
                    {renderGroupCounter('yellowCrabCount', 'Amarelo', getMaxForField('yellowCrabCount', colorFields))}
                    {renderGroupCounter('purpleCrabCount', 'Roxo ou escuro', getMaxForField('purpleCrabCount', colorFields))}
                    {renderGroupCounter('otherColorCrabCount', 'Outra cor', getMaxForField('otherColorCrabCount', colorFields))}
                    {renderGroupCounter('unknownColorCrabCount', 'Cor não identificada', getMaxForField('unknownColorCrabCount', colorFields))}
                  </div>
                  {getDimSum(colorFields) < maxIndividuals && <p className={`text-[11px] ${s.textLight}`}>Alguns indivíduos não foram classificados quanto à cor.</p>}
                  {getDimSum(colorFields) === maxIndividuals && maxIndividuals > 0 && <p className={`text-[11px] font-semibold text-emerald-500`}>Todos os {maxIndividuals} indivíduos foram classificados.</p>}
                </div>
              ) : (
                <>
                  <p className={`text-sm sm:text-[15px] leading-relaxed ${s.textMuted}`}>Escolha a cor que mais se aproximava da aparência do caranguejo.</p>
                  <div className="space-y-2.5">
                    {Object.values(CrabColor).map(color => renderRadioOption('color', color, formData.color, color))}
                  </div>
                </>
              )}
            </div>

            <div id="eggVisibility-section" className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all duration-300 ${s.cardBg}`}>
              <div className={`flex items-center gap-3 pb-3 border-b ${s.innerBorder}`}>
                <div className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-sky-100 text-sky-700' : isDark ? 'bg-sky-950 text-sky-450' : 'bg-red-950/30 text-red-500'}`}>
                  <Search className="h-6 w-6" />
                </div>
                <h3 className={`font-extrabold tracking-tight text-lg ${s.titleAlt}`}>
                  {formData.observationMode === 'group' ? 'Quantos indivíduos apresentavam ovos visíveis?' : 'Havia ovos visíveis sob o abdômen?'}
                </h3>
              </div>

              {formData.observationMode === 'group' ? (
                <div className="space-y-4">
                  <p className={`text-sm ${s.textMuted}`}>Selecione quantos indivíduos possuíam ovos visíveis sob o abdômen. A soma não pode ultrapassar o total de {maxIndividuals} indivíduos.</p>
                  <div className="space-y-1">
                    {renderGroupCounter('ovigerousFemaleCount', 'Com ovos visíveis', getMaxForField('ovigerousFemaleCount', eggFields))}
                    {renderGroupCounter('nonOvigerousFemaleCount', 'Sem ovos visíveis', getMaxForField('nonOvigerousFemaleCount', eggFields))}
                    {renderGroupCounter('eggVisibilityUnknownCount', 'Não foi possível observar', getMaxForField('eggVisibilityUnknownCount', eggFields))}
                  </div>
                  {getDimSum(eggFields) < maxIndividuals && <p className={`text-[11px] ${s.textLight}`}>Alguns indivíduos não foram classificados quanto aos ovos.</p>}
                  {getDimSum(eggFields) === maxIndividuals && maxIndividuals > 0 && <p className={`text-[11px] font-semibold text-emerald-500`}>Todos os {maxIndividuals} indivíduos foram classificados.</p>}
                </div>
              ) : (
                <>
                  <p className={`text-sm sm:text-[15px] leading-relaxed ${s.textMuted}`}>Os ovos ficam presos na parte inferior do corpo da fêmea. Responda somente se foi observar, sem tocar ou perturbar o caranguejo.</p>
                  <div className="space-y-2.5">
                    {Object.values(EggVisibility).map(egg => renderRadioOption('eggVisibility', egg, formData.eggVisibility, egg))}
                  </div>
                </>
              )}
            </div>

            <StepDivider step="4" title="Informações Adicionais" desc="Conte mais sobre o avistamento." />

            <div className={`p-5 rounded-2xl border space-y-3.5 transition-all duration-300 ${s.cardBg}`}>
              <div className={`flex items-center gap-2.5 pb-3 border-b ${s.innerBorder}`}>
                <div className={`p-1.5 rounded-lg shrink-0 ${isLight ? 'bg-slate-100 text-slate-600' : isDark ? 'bg-slate-950 text-slate-450' : 'bg-red-950/30 text-red-500'}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className={`font-extrabold tracking-tight text-base ${s.titleAlt}`}>Quer contar mais alguma coisa?</h3>
              </div>
              <p className={`text-[13px] leading-normal ${s.textMuted}`}>Você pode informar se havia muitos carros, cães, animais feridos, ou outra situação importante.</p>
              <textarea 
                value={formData.notes} 
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                rows={3} 
                className={`w-full border-2 rounded-xl p-4 focus:outline-none focus:ring-4 text-sm font-medium transition-all ${s.bgInput} ${isLight ? 'focus:border-orange-500 focus:ring-orange-500/10 border-slate-200' : isDark ? 'focus:border-orange-500 focus:ring-orange-500/10 border-slate-750' : 'focus:border-red-650 focus:ring-red-950/25 border-red-950'}`} 
                placeholder="Detalhes adicionais (opcional)..."
              />
            </div>
          </div>

          {/* Destaque Visual Opcional para dados técnicos */}
          <div className={`rounded-2xl border overflow-hidden p-1 transition-all duration-300 ${
            progressPercent === 100 
              ? isLight 
                ? 'ring-4 ring-orange-500/15 border-orange-400 bg-orange-50/5 shadow-md' 
                : isDark 
                  ? 'ring-4 ring-orange-100/10 border-orange-500/50 bg-orange-950/10 shadow-md' 
                  : 'ring-4 ring-red-650/30 border-red-600 bg-red-950/10'
              : s.cardBg
          }`}>
            <button 
              type="button" 
              onClick={() => setShowTechnicalData(!showTechnicalData)}
              className={`w-full p-5 flex items-center justify-between text-left focus:outline-none transition-colors ${
                isLight ? 'hover:bg-slate-50 focus:bg-slate-50' : isDark ? 'hover:bg-slate-800/50 focus:bg-slate-800/50' : 'hover:bg-red-950/10 focus:bg-red-950/10'
              }`}
              aria-expanded={showTechnicalData}
            >
              <div>
                <h3 className={`font-extrabold text-[15px] flex items-center gap-2 ${s.titleAlt}`}>
                  <span className="text-lg">🦀</span>
                  {formData.observationMode === 'group' ? 'Mais informações sobre o grupo observado' : 'Mais informações sobre o caranguejo'}
                </h3>
                <p className={`text-xs font-medium mt-1 ${s.textMuted}`}>Essas informações ajudam a pesquisa, mas são opcionais.</p>
                {technicalFieldsCount > 0 && (
                  <span className="text-xs font-bold text-orange-600 block mt-1.5 tracking-tight">
                    {technicalFieldsCount === 1 ? '1 informação preenchida' : `${technicalFieldsCount} informações preenchidas`}
                  </span>
                )}
              </div>
              {showTechnicalData ? <ChevronUp className="h-6 w-6 text-slate-400 shrink-0" /> : <ChevronDown className="h-6 w-6 text-slate-400 shrink-0" />}
            </button>
            <AnimatePresence initial={false}>
              {showTechnicalData && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className={`overflow-hidden border-t ${s.innerBorder}`}>
                  {formData.observationMode === 'group' ? renderGroupDetails() : (
                    <div className={`p-5 sm:p-6 space-y-7 ${s.expandedSectionBg}`}>
                      
                      <p className={`text-[13px] font-medium leading-relaxed border p-4 rounded-xl shadow-sm ${
                        isLight ? 'bg-white border-slate-200 text-slate-600' : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-black border-red-950/80 text-red-500'
                      }`}>
                        <strong className={isLight ? 'text-slate-800' : isDark ? 'text-slate-100' : 'text-red-400'}>Se você conseguiu observar melhor o(s) caranguejo(s), essas informações adicionais auxiliam muito a pesquisa.</strong><br />
                        Preencha somente o que tiver segurança.
                      </p>
                    
                    {/* Alerta de Quantidade > 1 */}
                    {(formData.amount as number) > 1 && (
                      <p className={`text-xs font-semibold p-3.5 rounded-xl border leading-relaxed ${s.warnBox}`}>
                        Essas características podem variar entre os indivíduos observados. Preencha apenas se tiver segurança na informação.
                      </p>
                    )}

                    <div id="sex-section" className="space-y-2.5">
                      <div className="flex flex-col gap-0.5">
                        <h4 className={`font-bold text-sm ${isLight ? 'text-slate-850' : 'text-slate-200'}`}>
                          {formData.observationMode === 'group' ? 'Sexo predominante (opcional)' : 'Você conseguiu identificar o sexo?'}
                        </h4>
                        {formData.observationMode === 'individual' && <span className={`text-[11px] font-semibold ${s.textLight}`}>Opcional</span>}
                      </div>
                      <div className="space-y-2">
                        {Object.values(CrabSex).map(sex => renderRadioOption('sex', sex, formData.sex, sex, undefined, isOvigerous))}
                      </div>
                      {isOvigerous && (
                        <p className={`text-xs font-semibold mt-2.5 flex items-center gap-1.5 border p-3 rounded-xl shadow-sm ${s.warnBox}`}>
                          <Info className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                          <span>Indivíduos com ovos são sempre fêmeas.</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formData.observationMode === 'group' ? 'Tamanho predominante' : 'Tamanho estimado'}
                      </h4>
                      <p className={`text-xs font-medium ${s.textLight}`}>Referência visual baseada na largura da carapaça.</p>
                      <div className="space-y-2">
                        {renderRadioOption('sizeClass', CrabSizeClass.SMALL, formData.sizeClass, 
                          <span className="flex items-center gap-2">Pequeno <div className="w-5 h-3 bg-current rounded-full opacity-60"></div></span>, 
                          'Até cerca de 5 cm de largura da carapaça.'
                        )}
                        {renderRadioOption('sizeClass', CrabSizeClass.MEDIUM, formData.sizeClass, 
                          <span className="flex items-center gap-2">Médio <div className="w-8 h-4.5 bg-current rounded-full opacity-70"></div></span>, 
                          'Entre 5 cm e 10 cm de largura da carapaça.'
                        )}
                        {renderRadioOption('sizeClass', CrabSizeClass.LARGE, formData.sizeClass, 
                          <span className="flex items-center gap-2">Grande <div className="w-12 h-6 bg-current rounded-full opacity-80"></div></span>, 
                          'Acima de 10 cm, como o tamanho de um punho fechado ou maior.'
                        )}
                        {renderRadioOption('sizeClass', CrabSizeClass.NOT_ESTIMATED, formData.sizeClass, 
                          'Não foi possível estimar',
                          'Desconhecido'
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formData.observationMode === 'group' ? 'Como os indivíduos estavam se movimentando?' : 'Como o animal estava se movimentando?'}
                      </h4>
                      <p className={`text-[11px] ${s.textMuted}`}>Padrão predominantemente observado.</p>
                      
                      {formData.status === CrabStatus.MORTO || formData.status === CrabStatus.ATROPELADO_MORTO ? (
                        <p className={`text-xs font-medium p-3 rounded-xl ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-950/60 text-slate-400'}`}>Como registro foi sem vida, este campo não se aplica.</p>
                      ) : (
                        <div className="space-y-2">
                          {renderRadioOption('movementPattern', CrabMovementPattern.ANDANDO, formData.movementPattern, 'Andando', 'Deslocando-se pelo ambiente.')}
                          {renderRadioOption('movementPattern', CrabMovementPattern.PARADO_ATIVO, formData.movementPattern, formData.observationMode === 'group' ? 'Sem deslocamento, mas ativos' : 'Sem deslocamento, mas ativo', formData.observationMode === 'group' ? 'A maioria permanecia no mesmo local realizando alguma atividade (alimentação, escavação, interação, etc).' : 'Permanecendo no mesmo local, porém realizando alguma atividade observável, como alimentação, limpeza, escavação ou interação.')}
                          {renderRadioOption('movementPattern', CrabMovementPattern.TOTALMENTE_PARADO, formData.movementPattern, formData.observationMode === 'group' ? 'Totalmente parados' : 'Totalmente parado', formData.observationMode === 'group' ? 'Indivíduos sem movimentação aparente, imobilizados durante a observação.' : 'Sem movimentação aparente, permanecendo completamente imóvel durante a observação.')}
                          {renderRadioOption('movementPattern', CrabMovementPattern.NAO_OBSERVADO, formData.movementPattern, 'Não consegui observar', 'O avistamento foi rápido, distante ou sem visibilidade suficiente.')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formData.observationMode === 'group' ? 'O que estavam fazendo principalmente?' : 'O que o animal estava fazendo principalmente?'}
                      </h4>
                      <p className={`text-xs font-medium ${s.textLight}`}>Escolha a atividade principal observada.</p>
                      
                      {formData.status === CrabStatus.MORTO || formData.status === CrabStatus.ATROPELADO_MORTO ? (
                        <p className={`text-xs font-medium p-3 rounded-xl ${isLight ? 'bg-slate-100 text-slate-550' : 'bg-slate-950/60 text-slate-400'}`}>Não se aplica a indivíduos sem vida.</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.values(CrabActivity).map(act => renderRadioOption('activity', act, formData.activity, act, undefined, isFullyStopped))}
                        </div>
                      )}
                      {isFullyStopped && (
                        <p className={`text-xs font-semibold mt-2.5 flex items-center gap-1.5 border p-3 rounded-xl shadow-sm ${s.warnBox}`}>
                          <Info className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                          <span>Atividades não se aplicam a indivíduos totalmente parados.</span>
                        </p>
                      )}
                      {formData.activity === CrabActivity.ANDADA && formData.observationMode === 'individual' && (
                        <div className="text-[11px] font-bold text-amber-800 bg-amber-100 p-2 rounded-lg leading-relaxed">A andada geralmente envolve vários caranguejos. Confirme se havia deslocamento coletivo no local.</div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formData.observationMode === 'group' ? 'O grupo estava em área com risco de atropelamento?' : 'O caranguejo estava em área com risco de atropelamento?'}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['Sim', 'Não', 'Não foi possível avaliar'].map(risk => {
                          const isDisabled = isCrabRunOver && risk !== 'Sim';
                          return (
                            <button 
                              key={risk} 
                              type="button" 
                              disabled={isDisabled}
                              onClick={() => setFormData(p => ({ ...p, collisionRisk: risk }))} 
                              className={`py-3 px-2 rounded-xl border-2 text-xs font-bold text-center transition-colors ${
                                formData.collisionRisk === risk 
                                  ? isRed ? 'bg-red-950/50 border-red-500 text-red-400' : 'bg-orange-500 border-orange-500 text-white' 
                                  : isDisabled
                                    ? isLight ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-60 cursor-not-allowed' : isDark ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed' : 'bg-black border-red-950/50 text-red-900 opacity-60 cursor-not-allowed'
                                    : isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-350' : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-755' : 'bg-black border-red-950 text-red-600 hover:border-red-900'
                              }`}
                            >
                              {risk}
                            </button>
                          );
                        })}
                      </div>
                      
                      {isCrabRunOver && (
                        <p className={`text-[12px] font-semibold mt-2 flex items-start gap-1.5 p-3 rounded-xl shadow-sm ${s.warnBox}`}>
                          <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                          <span>Como o animal foi registrado atropelado, o risco de atropelamento neste local foi marcado automaticamente como Sim.</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Como estava o tempo?</h4>
                      <div className="space-y-2">
                        {['Sem chuva ou seco', 'Chuva fraca ou garoa', 'Chuva forte', 'Tinha acabado de chover', 'Não foi possível informar'].map(w => renderRadioOption('weather', w, formData.weather, w))}
                      </div>
                    </div>

                  </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2">
            <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-black border-red-950'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wide flex items-center justify-between ${s.title}`}>
                Resumo do Registro 
                <span className={`px-2 py-0.5 rounded text-[10px] ${progressPercent === 100 ? (isLight ? 'bg-emerald-100 text-emerald-800' : isDark ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-black text-red-500 border border-red-950') : 'bg-slate-200 text-slate-600'}`}>{progressPercent}% Concluído</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Foto</span>
                  <span className={`font-semibold ${formData.photoUrl ? 'text-emerald-500' : s.textLight}`}>{formData.photoUrl ? '✓ Anexada' : 'Faltando'}</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>GPS</span>
                  <span className={`font-semibold ${formData.location ? 'text-emerald-500' : s.textLight}`}>{formData.location ? '✓ Capturado' : 'Faltando'}</span>
                </div>
                <div className="flex flex-col col-span-2 sm:col-span-1 border-t sm:border-0 pt-2 sm:pt-0">
                  <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Ambiente</span>
                  <span className={`font-semibold truncate ${formData.habitat ? s.titleAlt : s.textLight}`}>{formData.habitat || 'Faltando'}</span>
                </div>
                {formData.observationMode === 'group' ? (
                  <>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Total Indivíduos</span>
                      <span className={`font-semibold truncate ${s.titleAlt}`}>{formData.totalIndividuals || 2}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Condição Vital</span>
                      <span className={`font-semibold truncate ${getDimSum(statusFields) === (formData.totalIndividuals || 2) ? 'text-emerald-500' : s.textLight}`}>
                        {getDimSum(statusFields) === (formData.totalIndividuals || 2) ? '✓ Completo' : `${getDimSum(statusFields)} de ${formData.totalIndividuals || 2}`}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Cores</span>
                      <span className={`font-semibold truncate ${getDimSum(colorFields) === (formData.totalIndividuals || 2) ? 'text-emerald-500' : s.textLight}`}>
                        {getDimSum(colorFields) === (formData.totalIndividuals || 2) ? '✓ Completo' : `${getDimSum(colorFields)} de ${formData.totalIndividuals || 2}`}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Ovos</span>
                      <span className={`font-semibold truncate ${getDimSum(eggFields) === (formData.totalIndividuals || 2) ? 'text-emerald-400' : s.textLight}`}>
                        {getDimSum(eggFields) === (formData.totalIndividuals || 2) ? '✓ Completo' : `${getDimSum(eggFields)} de ${formData.totalIndividuals || 2}`}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Condição</span>
                      <span className={`font-semibold truncate ${formData.status ? s.titleAlt : s.textLight}`}>{formData.status || 'Faltando'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Qtd</span>
                      <span className={`font-semibold truncate ${s.titleAlt}`}>1</span>
                    </div>
                    {formData.color && (
                      <div className="flex flex-col col-span-2">
                        <span className={`text-[10px] uppercase font-bold ${s.textMuted}`}>Cor</span>
                        <span className={`font-semibold truncate ${s.titleAlt}`}>{formData.color}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 pb-4">
            <button
              type="submit"
              disabled={isSending}
              className={`w-full py-6 px-6 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:ring-4 focus:ring-orange-500/50 outline-none flex items-center justify-center gap-3 text-xl font-black ${isSending ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-200 shadow-none' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-orange-500/40 border border-orange-400/50'}`}
            >
              {isSending ? (
                <><Loader2 className="animate-spin h-7 w-7" /><span>Processando...</span></>
              ) : (
                <><CheckCircle className="h-7 w-7" /><span>Enviar Registro</span></>
              )}
            </button>
            <p className={`text-xs text-center font-medium mt-4 px-4 ${s.textLight}`}>
              Revise as informações antes de enviar. O envio pode levar alguns segundos dependendo da sua conexão.
            </p>
          </div>
        </form>

        {/* Informações "Sobre o Aplicativo", Desenvolvedor, e Instituições Parceiras */}
        <div className={`p-1 rounded-2xl border transition-all duration-300 ${s.cardBg}`}>
          <button 
            type="button" 
            onClick={() => setShowAbout(!showAbout)}
            className={`w-full flex items-center justify-between p-5 text-left focus:outline-none transition-colors ${
              isLight ? 'hover:bg-slate-50' : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-red-950/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-amber-50 text-amber-700' : isDark ? 'bg-amber-950 text-amber-400' : 'bg-red-950/30 text-red-500'}`}>
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`font-extrabold tracking-tight text-[15px] ${s.titleAlt}`}>Sobre este Aplicativo</h3>
                <p className={`text-[11px] font-medium mt-0.5 ${s.textMuted}`}>Ciência Cidadã em Ilhas Oceânicas</p>
              </div>
            </div>
            {showAbout ? (
              <ChevronUp className="h-5 w-5 text-slate-450 shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-450 shrink-0" />
            )}
          </button>

          <motion.div 
            initial={false}
            animate={{ height: showAbout ? 'auto' : 0 }}
            className="overflow-hidden"
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className={`p-5 pt-0 border-t space-y-4 ${s.innerBorder}`}>
              <div className={`space-y-3 text-[13px] leading-relaxed font-medium ${s.textMain}`}>
                <p>
                  Iniciativa de <strong>Ciência Cidadã</strong> para o monitoramento participativo do <strong>Caranguejo-Amarelo (<em>Johngarthia lagostoma</em>)</strong> em ilhas oceânicas.
                </p>
                <p>
                  Sua contribuição com fotos e localização (GPS) é fundamental para mapear rotas migratórias, períodos de reprodução e riscos ecológicos.
                </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-[#f7f3e6]/40 border-sand-200/50' : isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-black border-red-950'
              }`}>
                <h4 className={`text-[10px] font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5 ${s.textLight}`}>
                  <Heart className="h-3 w-3 text-orange-500 fill-orange-500/20 animate-pulse shrink-0" /> Desenvolvimento
                </h4>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`font-extrabold text-[13px] ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>Elson Júnior</p>
                    <p className={`text-[11px] font-medium ${s.textMuted}`}>Desenvolvedor</p>
                    <p className={`text-[10px] font-mono mt-0.5 ${s.textLight}`}>elsonjr18@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Instituições Parceiras no Rodapé */}
        <div className="space-y-4 pb-4 pt-2">
          <h4 className={`text-[10px] font-extrabold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5 text-center ${s.textMuted}`}>
            <Sparkles className="h-3 w-3 text-yellow-600" /> Instituições Parceiras
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className={`shadow-sm border p-2.5 rounded-xl flex items-center gap-3 transition-colors ${s.cardBg}`}>
              <div className="min-w-[40px] w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shrink-0 bg-white">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/0/0f/ICMBio_Logo.png" 
                  alt="ICMBio" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <p className={`font-extrabold text-[13px] leading-tight truncate ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>ICMBio</p>
                <p className={`text-[10px] font-medium truncate ${s.textMuted}`}>Preservação Ambiental</p>
              </div>
            </div>

            <div className={`shadow-sm border p-2.5 rounded-xl flex items-center gap-3 transition-colors ${s.cardBg}`}>
              <div className="min-w-[40px] w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shrink-0 bg-white">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/79/Ufsb_logo.jpg" 
                  alt="UFSB" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <p className={`font-extrabold text-[13px] leading-tight truncate ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>UFSB</p>
                <p className={`text-[10px] font-medium truncate ${s.textMuted}`}>Universidade Federal</p>
              </div>
            </div>

            <div className={`shadow-sm border p-2.5 rounded-xl flex items-center gap-3 transition-colors ${s.cardBg}`}>
              <div className="min-w-[40px] w-10 h-10 flex flex-col items-center justify-center shrink-0 bg-white p-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80" className="w-full h-full object-contain">
                  <g fill="#231F20" fontFamily="sans-serif">
                    <text x="5" y="45" fontSize="24" fontWeight="600" letterSpacing="-0.5px">Edinburgh Napier</text>
                    <text x="96" y="62" fontSize="11" fontWeight="400" letterSpacing="0.5px">UNIVERSITY</text>
                  </g>
                  <polygon points="185,25 215,35 185,55" fill="#E60028" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className={`font-extrabold text-[13px] leading-tight truncate ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>Edinburgh</p>
                <p className={`text-[10px] font-medium truncate ${s.textMuted}`}>Napier University</p>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showSuccessModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/40 backdrop-blur-sm p-4">
              <motion.div initial={{ y: '100%', scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
                isLight ? 'bg-white' : isDark ? 'bg-slate-900' : 'bg-black text-red-500 border border-red-955'
              }`}>
                
                <div className={`p-5 text-white text-center pb-5 relative shrink-0 ${savedOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                  <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                  <div className="relative w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-inner">
                    {savedOffline ? <WifiOff className="h-7 w-7 text-white drop-shadow-md" /> : <CheckCircle className="h-7 w-7 text-white drop-shadow-md" />}
                  </div>
                  <h2 className="relative text-xl sm:text-2xl font-black tracking-tight leading-tight">{savedOffline ? 'Salvo Offline!' : '🎉 Obrigado por contribuir!'}</h2>
                  <p className="relative text-white/95 text-[12px] sm:text-[13px] mt-2 font-medium leading-normal max-w-[320px] mx-auto px-1">
                    {savedOffline 
                      ? 'Registro guardado localmente. Será enviado logo que tiver rede. Sua contribuição é fundamental.' 
                      : 'Seu registro foi enviado com sucesso para o projeto de monitoramento do Caranguejo-Amarelo.'}
                  </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto w-full relative">
                  <div className={`absolute top-0 inset-x-0 h-4 z-10 ${isLight ? 'bg-gradient-to-b from-white' : isDark ? 'bg-gradient-to-b from-slate-900' : 'bg-gradient-to-b from-black'}`}></div>
                  <div className="p-6 flex-1 space-y-4">
                    <h4 className={`text-xs font-extrabold uppercase tracking-widest font-mono ${s.textMuted}`}>O que você registrou:</h4>
                    
                    <div className="space-y-3.5 text-sm">
                      {(submittedPayload?.photoBase64 || submittedPayload?.photoUrl) && (
                        <div className={`relative rounded-xl overflow-hidden aspect-video border shadow-sm ${
                          isLight ? 'border-slate-100' : isDark ? 'border-slate-800' : 'border-red-950'
                        }`}>
                          <img src={submittedPayload.photoBase64 || submittedPayload.photoUrl} alt="Enviado" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      {submittedPayload?.observationMode === 'group' ? (
                        <div className={`rounded-2xl p-4.5 border flex flex-col space-y-4 ${
                          isLight ? 'bg-orange-50/40 border-orange-100' : isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-black border-red-950'
                        }`}>
                          <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-orange-200/50">
                            <span className="text-xs uppercase font-extrabold text-orange-600 tracking-wider">REGISTRO COLETIVO</span>
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-black text-sm">
                              Total observado: {submittedPayload.totalIndividuals || 2}
                            </span>
                          </div>

                          {/* Estado geral section if any are non-zero */}
                          {((submittedPayload.aliveCount || 0) > 0 || 
                            (submittedPayload.injuredRoadkillCount || 0) > 0 || 
                            (submittedPayload.deadRoadkillCount || 0) > 0 || 
                            (submittedPayload.deadOtherCount || 0) > 0 ||
                            (submittedPayload.statusUnknownCount || 0) > 0 
                          ) && (
                            <div className="space-y-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${s.textMuted}`}>Estado Geral</span>
                              <ul className={`text-xs space-y-1 pl-1 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-250'}`}>
                                {(submittedPayload.aliveCount || 0) > 0 && (
                                  <li className="flex items-center gap-1.5">• {submittedPayload.aliveCount} vivo{(submittedPayload.aliveCount > 1 ? 's' : '')}</li>
                                )}
                                {(submittedPayload.injuredRoadkillCount || 0) > 0 && (
                                  <li className="flex items-center gap-1.5 text-amber-500">• {submittedPayload.injuredRoadkillCount} atropelado{(submittedPayload.injuredRoadkillCount > 1 ? 's' : '')} vivo{(submittedPayload.injuredRoadkillCount > 1 ? 's' : '')}</li>
                                )}
                                {(submittedPayload.deadRoadkillCount || 0) > 0 && (
                                  <li className="flex items-center gap-1.5 text-rose-500">• {submittedPayload.deadRoadkillCount} atropelado{(submittedPayload.deadRoadkillCount > 1 ? 's' : '')} morto{(submittedPayload.deadRoadkillCount > 1 ? 's' : '')}</li>
                                )}
                                {(submittedPayload.deadOtherCount || 0) > 0 && (
                                  <li className="flex items-center gap-1.5 text-red-400">• {submittedPayload.deadOtherCount} morto{(submittedPayload.deadOtherCount > 1 ? 's' : '')} sem atropelamento</li>
                                )}
                                {(submittedPayload.statusUnknownCount || 0) > 0 && (
                                  <li className="flex items-center gap-1.5 opacity-60">• {submittedPayload.statusUnknownCount} estado não identificado</li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Ovos section */}
                          {(submittedPayload.ovigerousFemaleCount || 0) > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${s.textMuted}`}>Ovos</span>
                              <ul className={`text-xs space-y-1 pl-1 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-250'}`}>
                                <li className="flex items-center gap-1.5 text-emerald-600 font-bold">• {submittedPayload.ovigerousFemaleCount} fêmea{(submittedPayload.ovigerousFemaleCount > 1 ? 's' : '')} ovígera{(submittedPayload.ovigerousFemaleCount > 1 ? 's' : '')}</li>
                              </ul>
                            </div>
                          )}

                          {/* Contexto section */}
                          {submittedPayload.groupContext && (
                            <div className="space-y-1 pt-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${s.textMuted}`}>Contexto</span>
                              <ul className={`text-xs space-y-1 pl-1 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-250'}`}>
                                <li className="flex items-start gap-1.5">• {submittedPayload.groupContext}</li>
                              </ul>
                            </div>
                          )}

                          {/* Ambiente section */}
                          {submittedPayload.habitat && (
                            <div className="space-y-1 pt-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${s.textMuted}`}>Ambiente</span>
                              <ul className={`text-xs space-y-1 pl-1 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-250'}`}>
                                <li className="flex items-center gap-1.5 text-emerald-500 font-bold">• {submittedPayload.habitat}</li>
                              </ul>
                            </div>
                          )}

                          {/* Lunar phase list */}
                          {submittedPayload.moonPhase && (
                            <div className="space-y-1 pt-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${s.textMuted}`}>Fase Lunar</span>
                              <div className="pt-0.5">
                                <span className={`inline-flex items-center gap-1.5 font-bold border px-2.5 py-1 rounded-[10px] shadow-sm text-xs ${
                                  isLight ? 'text-slate-900 border-slate-200 bg-white' : isDark ? 'text-slate-100 border-slate-800 bg-slate-950' : 'text-red-450 border-red-950 bg-black'
                                }`}>
                                  🌙 {submittedPayload.moonPhase}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* GPS section e Ilha */}
                          {submittedPayload.location && (
                            <div className={`flex flex-col gap-2 pt-2 border-t font-semibold ${isLight ? 'border-orange-100' : 'border-slate-800/50'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Ilha</span>
                                <span className={`text-[11px] px-2 py-0.5 rounded border font-bold ${
                                  isLight ? 'bg-white border-slate-200 text-slate-700' : isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-black border-red-950 text-red-400'
                                }`}>
                                  {submittedPayload.island}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>GPS Guardado</span>
                                <span className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold tracking-tight ${
                                  isLight ? 'bg-white border-slate-200 text-slate-600' : isDark ? 'bg-slate-950 border-slate-850 text-slate-400' : 'bg-black border-red-950 text-red-500'
                                }`}>
                                  {submittedPayload.location.latitude.toString().replace('.', ',')}, {submittedPayload.location.longitude.toString().replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`rounded-xl p-3.5 border flex flex-col space-y-2 ${
                          isLight ? 'bg-slate-50 border-slate-100' : isDark ? 'bg-slate-950/50 border-slate-850' : 'bg-[#050000] border-red-950'
                        }`}>
                          {submittedPayload?.island && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Ilha</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-400'}`}>{submittedPayload.island}</span></div>
                          )}
                          {submittedPayload?.status && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Estado</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-400'}`}>{submittedPayload.status}</span></div>
                          )}
                          {submittedPayload?.color && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Cor</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-400'}`}>{submittedPayload.color}</span></div>
                          )}
                          {submittedPayload?.eggVisibility && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Ovos Visíveis</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-400'}`}>{submittedPayload.eggVisibility}</span></div>
                          )}
                          {submittedPayload?.amount !== undefined && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Qtd</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-450'}`}>{submittedPayload.amount}</span></div>
                          )}
                          {submittedPayload?.habitat && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Ambiente</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-450'}`}>{submittedPayload.habitat}</span></div>
                          )}
                          {submittedPayload?.sex && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Sexo</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-455'}`}>{submittedPayload.sex}</span></div>
                          )}
                          {submittedPayload?.movementPattern && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Movimento</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-101' : 'text-red-455'}`}>{submittedPayload.movementPattern}</span></div>
                          )}
                          {submittedPayload?.activity && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Atividade</span><span className={`font-bold ${isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-455'}`}>{submittedPayload.activity}</span></div>
                          )}
                          {submittedPayload?.moonPhase && (
                            <div className={`flex justify-between font-semibold ${isLight ? 'border-b border-slate-100 pb-1.5' : 'border-b border-slate-800/20 pb-1.5'}`}><span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>Fase Lunar</span><span className={`font-bold border px-1.5 py-0.5 rounded shadow-sm text-[10px] flex items-center gap-1 ${
                              isLight ? 'text-slate-900 border-slate-200 bg-white' : isDark ? 'text-slate-100 border-slate-800 bg-slate-950' : 'text-red-450 border-red-950 bg-black'
                            }`}>🌙 {submittedPayload.moonPhase}</span></div>
                          )}
                          {submittedPayload?.location && (
                            <div className={`flex justify-between items-center pt-1 mt-1 ${isLight ? 'border-t border-slate-200/60' : 'border-t border-slate-800/65'}`}>
                              <span className={`${s.textMuted} font-bold uppercase tracking-wider text-[10px]`}>GPS Guardado</span>
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold tracking-tight ${
                                isLight ? 'bg-white border-slate-200 text-slate-600' : isDark ? 'bg-slate-950 border-slate-850 text-slate-400' : 'bg-black border-red-950 text-red-500'
                              }`}>
                                {submittedPayload.location.latitude.toString().replace('.', ',')}, {submittedPayload.location.longitude.toString().replace('.', ',')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`absolute bottom-0 inset-x-0 h-4 ${isLight ? 'bg-gradient-to-t from-white' : isDark ? 'bg-gradient-to-t from-slate-900' : 'bg-gradient-to-t from-black'}`}></div>
                </div>

                <div className={`p-5 flex flex-col sm:flex-row gap-3 border-t shrink-0 ${
                  isLight ? 'bg-slate-50 border-slate-100' : isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#020000] border-red-955'
                }`}>
                  <button type="button" onClick={() => { resetForm(); try { window.close(); } catch(e){} }} className={`w-full sm:w-1/3 text-sm font-bold py-3.5 px-4 rounded-xl border-2 transition-transform hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center gap-2 ${
                    isLight ? 'bg-white border-slate-200 text-slate-700' : isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-black border-red-950 text-red-500'
                  }`}>
                    Fechar
                  </button>
                  <button type="button" onClick={resetForm} className="w-full sm:w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 text-center text-sm flex items-center justify-center gap-2">
                    <span>Novo Registro</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default App;

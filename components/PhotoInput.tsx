import React, { useRef } from 'react';
import { Camera, RefreshCw, Image, Check } from 'lucide-react';
import exifr from 'exifr';
import { resizeImage } from '../utils/imageCompressor';

interface PhotoInputProps {
  photoUrl: string | null;
  onPhotoCapture: (
    url: string,
    exifData?: { latitude?: number; longitude?: number; timestamp?: string }
  ) => void;
  theme?: 'light' | 'dark' | 'red';
}

const PhotoInput: React.FC<PhotoInputProps> = ({ photoUrl, onPhotoCapture, theme = 'light' }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'light';
  const isDark = theme === 'dark';
  const isRed = theme === 'red';

  const cardBgStyle = isLight 
    ? 'bg-white border-sand-200' 
    : isDark 
      ? 'bg-slate-900 border-slate-800 text-slate-200' 
      : 'bg-black border-red-950 text-red-500';

  const titleStyle = isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-500';
  
  const btnInativeBgStyle = isLight 
    ? 'from-sand-50/80 to-sand-100/30 hover:from-sand-100 hover:to-sand-100/60 border-sand-400/80 text-slate-800' 
    : isDark 
      ? 'from-slate-950/50 to-slate-900/30 hover:from-slate-900 hover:to-slate-900/60 border-slate-800 text-slate-350' 
      : 'from-black to-black/90 hover:from-red-950/10 hover:to-red-950/20 border-red-950/80 text-red-500';

  const btnMutedTextStyle = isLight ? 'text-slate-505/90' : isDark ? 'text-slate-450' : 'text-red-700';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      let exLatitude: number | undefined;
      let exLongitude: number | undefined;
      let exTimestamp: string | undefined;

      try {
        const gps = await exifr.gps(file);
        if (gps && typeof gps.latitude === 'number' && !isNaN(gps.latitude) && typeof gps.longitude === 'number' && !isNaN(gps.longitude)) {
          exLatitude = gps.latitude;
          exLongitude = gps.longitude;
        }

        const parsed = await exifr.parse(file, ['DateTimeOriginal']);
        if (parsed && parsed.DateTimeOriginal) {
          const dt = new Date(parsed.DateTimeOriginal);
          if (!isNaN(dt.getTime())) {
            exTimestamp = new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short'
            }).format(dt);
          }
        }
      } catch (err) {
        console.warn('[EXIF] Erro ao extrair dados EXIF da imagem:', err);
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          try {
            const compressed = await resizeImage(reader.result, 1280, 0.8);
            onPhotoCapture(compressed, {
              latitude: exLatitude,
              longitude: exLongitude,
              timestamp: exTimestamp
            });
          } catch (e) {
            console.error('[PhotoInput] Erro ao comprimir imagem:', e);
            onPhotoCapture(reader.result, {
              latitude: exLatitude,
              longitude: exLongitude,
              timestamp: exTimestamp
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
    galleryInputRef.current?.click();
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${cardBgStyle}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-base flex items-center ${titleStyle}`}>
          <span className={`p-1.5 rounded-lg mr-2.5 shrink-0 ${isLight ? 'bg-orange-100 text-orange-600' : isDark ? 'bg-orange-950 text-orange-400' : 'bg-red-950/30 text-red-500'}`}>
            <Camera className="h-5 w-5" />
          </span>
          Foto do Caranguejo
        </h3>
        
        {photoUrl && (
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider ${
            isLight ? 'bg-emerald-100 text-emerald-800' : isDark ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-black text-red-500 border border-red-950'
          }`}>
            <Check className="h-3 w-3 stroke-[3]" /> Tem foto!
          </span>
        )}
      </div>
      
      {/* Hidden input for direct camera capture */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleFileChange}
      />

      {/* Hidden input for photo gallery picker */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={galleryInputRef}
        onChange={handleFileChange}
      />

      <div className="space-y-4">
        {photoUrl ? (
          <div className={`relative group rounded-xl overflow-hidden aspect-video shadow-md border bg-slate-900 ${isLight ? 'border-sand-300/60' : isDark ? 'border-slate-800' : 'border-red-950'}`}>
            <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Retake badge overlay on image footer */}
            <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-sm">
              <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
              <span>Pronto para enviar</span>
            </div>

            {/* Quick action buttons to substitute image using either capture/gallery */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button 
                onClick={triggerCamera}
                type="button"
                className="bg-orange-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-orange-500 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Tirar nova foto com câmera"
              >
                <Camera className="h-4 w-4" />
                <span>Câmera</span>
              </button>
              <button 
                onClick={triggerGallery}
                type="button"
                className="bg-slate-800 text-white p-2.5 rounded-xl shadow-lg hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold border border-white/10"
                title="Escolher nova foto da galeria"
              >
                <Image className="h-4 w-4" />
                <span>Galeria</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {/* Option 1: Native Camera Capture */}
            <button
              type="button"
              onClick={triggerCamera}
              className={`h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-gradient-to-b transition-all duration-205 active:scale-[0.98] outline-none group ${btnInativeBgStyle}`}
            >
              <div className="bg-orange-500 shadow-md p-3.5 rounded-full mb-2.5 transition-transform duration-300 group-hover:scale-105">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <span className={`font-bold text-sm tracking-tight text-center px-1 ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>Tirar Foto</span>
              <span className={`text-[10px] mt-1 font-medium text-center px-2 ${btnMutedTextStyle}`}>Câmera em tempo real</span>
            </button>

            {/* Option 2: Photo Gallery Upload */}
            <button
              type="button"
              onClick={triggerGallery}
              className={`h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-gradient-to-b transition-all duration-205 active:scale-[0.98] outline-none group ${btnInativeBgStyle}`}
            >
              <div className="bg-slate-700 shadow-md p-3.5 rounded-full mb-2.5 transition-transform duration-300 group-hover:scale-105">
                <Image className="h-6 w-6 text-white" />
              </div>
              <span className={`font-bold text-sm tracking-tight text-center px-1 ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>Escolher da Galeria</span>
              <span className={`text-[10px] mt-1 font-medium text-center px-2 ${btnMutedTextStyle}`}>Fotos salvas no celular</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoInput;

import React, { useState } from 'react';
import { GeoLocation } from '../types';
import { MapPin, Compass, Loader2, Check, AlertCircle } from 'lucide-react';

interface LocationInputProps {
  location: GeoLocation | null;
  onLocationCapture: (loc: GeoLocation) => void;
  theme?: 'light' | 'dark' | 'red';
}

const LocationInput: React.FC<LocationInputProps> = ({ location, onLocationCapture, theme = 'light' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLight = theme === 'light';
  const isDark = theme === 'dark';
  const isRed = theme === 'red';

  const cardBgStyle = isLight 
    ? 'bg-white border-sand-200' 
    : isDark 
      ? 'bg-slate-900 border-slate-800 text-slate-200' 
      : 'bg-black border-red-950 text-red-500';

  const titleStyle = isLight ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-red-500';
  const textStyle = isLight ? 'text-slate-705' : isDark ? 'text-slate-300' : 'text-red-400';
  const textMutedStyle = isLight ? 'text-slate-400' : isDark ? 'text-slate-500' : 'text-red-700';

  const btnBgStyle = loading 
    ? isLight 
      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
      : isDark 
        ? 'bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-800' 
        : 'bg-[#020000] text-red-900 cursor-not-allowed border border-red-950'
    : location 
      ? isLight 
        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
        : isDark
          ? 'bg-slate-950 text-slate-300 hover:bg-slate-900 border border-slate-800'
          : 'bg-black text-red-500 hover:bg-red-950/20 border border-red-950'
      : isLight 
        ? 'bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98]'
        : isDark
          ? 'bg-sky-750 text-white hover:bg-sky-700 active:scale-[0.98] border border-sky-900'
          : 'bg-red-950/40 text-red-500 hover:bg-red-900/40 active:scale-[0.98] border border-red-650';

  const innerCardStyle = isLight 
    ? 'bg-gradient-to-br from-slate-50 to-sand-50/20 border-sand-200/80' 
    : isDark 
      ? 'bg-slate-950/40 border-slate-800' 
      : 'bg-black border-red-950/80';

  const gpsBadgeStyle = isLight 
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' 
    : isDark 
      ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
      : 'bg-black text-red-500 border-red-950';

  const liveBadgeStyle = isLight 
    ? 'bg-sky-50 text-sky-800 border-sky-200/60' 
    : isDark 
      ? 'bg-sky-950/20 text-sky-400 border-sky-900/30' 
      : 'bg-black text-red-500 border-red-950';

  const gridItemStyle = isLight 
    ? 'bg-white border-sand-100' 
    : isDark 
      ? 'bg-slate-900/80 border-slate-800' 
      : 'bg-black border-red-950';

  const captureLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada por este dispositivo.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationCapture({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isFromDevice: true
        });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Erro ao obter localização. Toque para tentar novamente e verifique as permissões de GPS.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${cardBgStyle}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-base flex items-center ${titleStyle}`}>
          <span className={`p-1.5 rounded-lg mr-2.5 shrink-0 ${isLight ? 'bg-sky-100 text-sky-600' : isDark ? 'bg-sky-950 text-sky-400' : 'bg-red-950/30 text-red-500'}`}>
            <MapPin className="h-5 w-5" />
          </span>
          Onde você está? (GPS)
        </h3>
        
        {location && (
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider ${
            isLight ? 'bg-emerald-100 text-emerald-800' : isDark ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-black text-red-500 border border-red-950'
          }`}>
            <Check className="h-3 w-3 stroke-[3]" /> GPS Capturado
          </span>
        )}
      </div>

      <div className="flex flex-col space-y-3.5">
        <button
          type="button"
          onClick={captureLocation}
          disabled={loading}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 ${btnBgStyle}`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-1" />
              <span>Acessando GPS do aparelho...</span>
            </>
          ) : (
            <>
              <Compass className={`h-5 w-5 ${location ? 'text-sky-500' : isLight ? 'text-white' : 'text-red-500'}`} />
              <span>{location ? 'Atualizar Localização' : 'Obter Localização Atual'}</span>
            </>
          )}
        </button>

        {error && (
          <div className={`text-xs p-3.5 rounded-xl border flex items-start gap-2 animate-pulse ${
            isLight ? 'bg-red-50 text-red-700 border-red-105' : 'bg-red-950/20 text-red-400 border-red-950'
          }`}>
            <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {location && (
          <div className={`p-4 rounded-xl border mt-2 flex flex-col ${innerCardStyle}`}>
            {location.isFromPhoto ? (
              <div className={`mb-2.5 border text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 self-start shadow-sm ${gpsBadgeStyle}`}>
                <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                <span>📍 Coordenada lida dos metadados da FOTO (EXIF)</span>
              </div>
            ) : (
              <div className={`mb-2.5 border text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 self-start shadow-sm ${liveBadgeStyle}`}>
                <Compass className="h-3.5 w-3.5 text-sky-550" />
                <span>📱 Localização em tempo real via GPS do aparelho</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <div className={`p-2.5 rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${gridItemStyle}`}>
                <span className={`block text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${textMutedStyle}`}>Latitude</span>
                <span className={`font-mono text-sm font-bold ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>{location.latitude.toFixed(6)}°</span>
              </div>
              <div className={`p-2.5 rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${gridItemStyle}`}>
                <span className={`block text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${textMutedStyle}`}>Longitude</span>
                <span className={`font-mono text-sm font-bold ${isLight ? 'text-slate-800' : isDark ? 'text-slate-200' : 'text-red-400'}`}>{location.longitude.toFixed(6)}°</span>
              </div>
              
              <div className={`col-span-2 px-3 py-2.5 rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between ${gridItemStyle}`}>
                <div>
                  <span className={`block text-[10px] font-extrabold uppercase tracking-wider ${textMutedStyle}`}>Origem dos Dados GPS</span>
                  <span className={`font-sans text-xs font-bold ${isLight ? 'text-slate-700' : isDark ? 'text-slate-300' : 'text-red-400'}`}>
                    {location.isFromPhoto ? 'Lote de precisão da imagem' : `Aproximadamente ${Math.round(location.accuracy)} metros`}
                  </span>
                </div>
                {/* Visual precision gauge indicator */}
                <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : isDark ? 'bg-slate-950' : 'bg-red-950/30'}`}>
                  <div 
                    className={`h-full rounded-full ${
                      location.isFromPhoto
                        ? 'bg-emerald-500 w-full'
                        : location.accuracy < 15 
                          ? 'bg-emerald-500 w-full' 
                          : location.accuracy < 50 
                            ? 'bg-amber-500 w-2/3' 
                            : 'bg-red-500 w-1/3'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
            
            <p className={`text-[10px] text-center mt-3 font-medium ${textMutedStyle}`}>
              As coordenadas de avistamento são salvas automaticamente na planilha e enviadas para o mapa de preservação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;

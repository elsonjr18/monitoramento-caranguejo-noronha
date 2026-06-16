import React from 'react';

interface HeaderProps {
  theme: 'light' | 'dark' | 'red';
  onThemeChange: (theme: 'light' | 'dark' | 'red') => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeChange }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top Banner with Partners Logos */}
      <div className="bg-slate-950 border-b border-slate-800/60 px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Ciência Cidadã • Fernando de Noronha
          </span>
          <div className="flex items-center space-x-3 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-300 mr-0.5 font-sans">
              Apoio:
            </span>
            <div className="flex items-center space-x-2">
              {/* ICMBio Logo */}
              <div className="bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] overflow-hidden border border-white/20">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/0/0f/ICMBio_Logo.png" 
                  alt="ICMBio Logo" 
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                  title="Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio)"
                />
              </div>
              {/* UFSB Logo */}
              <div className="bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] overflow-hidden border border-white/20">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/79/Ufsb_logo.jpg" 
                  alt="UFSB Logo" 
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                  title="Universidade Federal do Sul da Bahia (UFSB)"
                />
              </div>
              {/* Napier Logo */}
              <div className="bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] overflow-hidden border border-white/20 p-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80" className="w-full h-full object-contain" title="Edinburgh Napier University">
                  <g fill="#231F20" fontFamily="sans-serif">
                    <text x="5" y="45" fontSize="24" fontWeight="600" letterSpacing="-0.5px">Edinburgh Napier</text>
                    <text x="96" y="62" fontSize="11" fontWeight="400" letterSpacing="0.5px">UNIVERSITY</text>
                  </g>
                  <polygon points="185,25 215,35 185,55" fill="#E60028" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="bg-gradient-to-tr from-amber-600 to-orange-500 p-2 rounded-xl shadow-lg ring-2 ring-orange-500/30 flex items-center justify-center shrink-0">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-white"
            >
              <path d="M12 12c-2 0-3.5-1.5-3.5-3.5 0-1.5 1-2.5 2-3 1-.5 3-.5 4 0 1 .5 2 1.5 2 3 0 2-1.5 3.5-3.5 3.5Z" />
              <path d="M5 12c-2 0-3 1.5-3 3.5 0 2.5 2 4 4 4" />
              <path d="M19 12c2 0 3 1.5 3 3.5 0 2.5-2 4-4 4" />
              <path d="M12 12c0 3-1 4-2 6" />
              <path d="M12 12c0 3 1 4 2 6" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1 truncate">
              Noronha Caranguejo Amarelo
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-none truncate">
              Iniciativa de Monitoramento Participativo
            </p>
          </div>
        </div>

        {/* Theme Selector UI */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 shrink-0">
          <button 
            type="button"
            onClick={() => onThemeChange('light')}
            className={`px-1.5 py-1 text-[11px] rounded font-bold flex items-center transition-colors ${theme === 'light' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Modo Claro"
          >
            <span>☀️</span>
          </button>
          <button 
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`px-1.5 py-1 text-[11px] rounded font-bold flex items-center transition-colors ${theme === 'dark' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Modo Noturno"
          >
            <span>🌙</span>
          </button>
          <button 
            type="button"
            onClick={() => onThemeChange('red')}
            className={`px-1.5 py-1 text-[11px] rounded font-bold flex items-center transition-colors ${theme === 'red' ? 'bg-slate-800 text-red-500' : 'text-slate-400 hover:text-slate-200'}`}
            title="Noturno Vermelho"
          >
            <span>🔴</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
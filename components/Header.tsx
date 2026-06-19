import React from 'react';

interface HeaderProps {
  theme: 'light' | 'dark' | 'red';
  onThemeChange: (theme: 'light' | 'dark' | 'red') => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeChange }) => {
  return (
    <header className="sticky top-0 z-50 bg-blue-900 border-b border-blue-800 shadow-md">
      {/* Top Banner with Partners Logos */}
      <div className="bg-blue-950 border-b border-blue-800/60 px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-wider font-mono">
            Monitoramento de FAUNA
          </span>
          <div className="flex items-center space-x-3 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-blue-100 mr-0.5 font-sans">
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
          <div className="flex flex-shrink-0 items-center justify-center w-10 h-10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 36 36" 
              className="w-full h-full drop-shadow transition-transform hover:scale-105"
            >
              <defs>
                <linearGradient id="crabAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>
              </defs>
              
              {/* Single Crab Centered */}
              <g transform="translate(18, 18) scale(2)">
                <path fill="url(#crabAmberGrad)" d="M-3.5 -1.5 Q 0 -4 3.5 -1.5 Q 5 2 2.5 3 Q 0 4 -2.5 3 Q -5 2 -3.5 -1.5 Z" />
                <path fill="url(#crabAmberGrad)" d="M-2.5 -1.5 Q -4 -5 -5.5 -2.5 Q -6 -0.5 -4 -0.5 Q -3 -1.5 -2.5 -1.5 Z" />
                <path fill="url(#crabAmberGrad)" d="M2.5 -1.5 Q 4 -5 5.5 -2.5 Q 6 -0.5 4 -0.5 Q 3 -1.5 2.5 -1.5 Z" />
                <path fill="none" stroke="url(#crabAmberGrad)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" d="M -4 0 L -6 0 L -6.5 1.5 M -3.5 1.5 L -5.5 1.5 L -6 3 M -2.5 2.5 L -4.5 3 L -4 4.5 M 4 0 L 6 0 L 6.5 1.5 M 3.5 1.5 L 5.5 1.5 L 6 3 M 2.5 2.5 L 4.5 3 L 4 4.5" />
              </g>
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none mb-1 truncate drop-shadow-sm">
              CarangApp
            </h1>
            <p className="text-[10px] sm:text-[11px] text-blue-200 font-medium leading-none truncate">
              Ciência Cidadã em Ilhas Oceânicas
            </p>
          </div>
        </div>

        {/* Theme Selector UI */}
        <div className="flex items-center gap-1 bg-blue-950/80 p-0.5 rounded-lg border border-blue-800/80 shrink-0 shadow-inner">
          <button 
            type="button"
            onClick={() => onThemeChange('light')}
            className={`px-1.5 py-1 text-[11px] rounded font-bold flex items-center transition-all ${theme === 'light' ? 'bg-blue-800 text-amber-300 shadow-sm' : 'text-blue-300 hover:text-white'}`}
            title="Modo Claro"
          >
            <span>☀️</span>
          </button>
          <button 
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`px-1.5 py-1 text-[11px] rounded font-bold flex items-center transition-all ${theme === 'dark' ? 'bg-blue-800 text-blue-100 shadow-sm' : 'text-blue-300 hover:text-white'}`}
            title="Modo Noturno"
          >
            <span>🌙</span>
          </button>
          <button 
            type="button"
            onClick={() => onThemeChange('red')}
            className={`px-1.5 py-1 text-[11px] rounded font-bold flex items-center transition-all ${theme === 'red' ? 'bg-blue-800 text-red-500 shadow-sm' : 'text-blue-300 hover:text-white'}`}
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
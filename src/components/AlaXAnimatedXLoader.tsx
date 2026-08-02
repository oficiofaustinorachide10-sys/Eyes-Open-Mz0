import React from 'react';

interface AlaXAnimatedXLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const AlaXAnimatedXLoader: React.FC<AlaXAnimatedXLoaderProps> = ({
  message = "A carregar Biblioteca Ala X...",
  fullScreen = true
}) => {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 bg-[#07080f] flex flex-col items-center justify-center p-4 select-none overflow-hidden"
    : "w-full py-12 flex flex-col items-center justify-center p-4 select-none";

  return (
    <div className={containerClasses}>
      {/* ATMOSPHERIC BACKGROUND AMBIENT GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.12)_0%,_rgba(16,185,129,0.12)_50%,_transparent_75%)] pointer-events-none"></div>

      {/* FLOATING PARTICLES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-60 delay-500"></div>
        <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse opacity-70"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 max-w-sm">
        
        {/* ANIMATED INTERSECTING LEAVES FORMING AN 'X' */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          
          {/* BACKDROP BLUE & GREEN GLOW ORBS */}
          <div className="absolute w-32 h-32 rounded-full bg-blue-500/20 blur-2xl animate-pulse"></div>
          <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl animate-pulse [animation-delay:400ms]"></div>

          <svg
            className="w-full h-full drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* BLUE LEAF GRADIENT */}
              <linearGradient id="blueLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>

              {/* GREEN LEAF GRADIENT */}
              <linearGradient id="greenLeafGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              {/* GLOW FILTERS */}
              <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* BLUE DIAGONAL BOOK LEAF (Top-Left to Bottom-Right) */}
            <g className="animate-pulse duration-1000">
              <path
                d="M 35 35 
                   C 65 30, 110 50, 165 165 
                   C 135 170, 90 150, 35 35 Z"
                fill="url(#blueLeafGrad)"
                stroke="#93c5fd"
                strokeWidth="2.5"
                filter="url(#blueGlow)"
              />
              {/* Blue Leaf Page Lines / Veins */}
              <path
                d="M 45 45 Q 85 75 145 155"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeOpacity="0.6"
                strokeDasharray="4 3"
              />
              <path
                d="M 70 65 Q 90 55 105 50"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              <path
                d="M 110 110 Q 130 100 145 95"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </g>

            {/* GREEN DIAGONAL BOOK LEAF (Top-Right to Bottom-Left) */}
            <g className="animate-pulse duration-1000 [animation-delay:500ms]">
              <path
                d="M 165 35 
                   C 135 30, 90 50, 35 165 
                   C 65 170, 110 150, 165 35 Z"
                fill="url(#greenLeafGrad)"
                stroke="#6ee7b7"
                strokeWidth="2.5"
                filter="url(#greenGlow)"
              />
              {/* Green Leaf Page Lines / Veins */}
              <path
                d="M 155 45 Q 115 75 55 155"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeOpacity="0.6"
                strokeDasharray="4 3"
              />
              <path
                d="M 130 65 Q 110 55 95 50"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              <path
                d="M 90 110 Q 70 100 55 95"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </g>

            {/* CENTER EMERALD-BLUE INTERSECTION CORE */}
            <circle
              cx="100"
              cy="100"
              r="12"
              fill="#0f172a"
              stroke="#60a5fa"
              strokeWidth="2"
              className="animate-ping opacity-75"
            />
            <circle
              cx="100"
              cy="100"
              r="8"
              fill="url(#blueLeafGrad)"
            />
          </svg>
        </div>

        {/* BRANDING & LOADING STATUS */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
              ALA X
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
              Biblioteca
            </span>
          </div>

          <p className="text-xs text-gray-300 font-medium">
            {message}
          </p>

          {/* PROGRESS BAR WITH BLUE & GREEN GRADIENT */}
          <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden mx-auto border border-white/10">
            <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full animate-[pulse_1.5s_infinite] w-full"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, Zap, Sparkles } from 'lucide-react';

interface AlaXAnimatedXLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const AlaXAnimatedXLoader: React.FC<AlaXAnimatedXLoaderProps> = ({
  message = "Preparando sua biblioteca...",
  fullScreen = true
}) => {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const bump = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + bump, 98);
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 bg-[#03050d] flex flex-col items-center justify-between py-10 px-4 select-none overflow-hidden font-sans"
    : "w-full py-16 bg-[#03050d] rounded-3xl flex flex-col items-center justify-between p-6 select-none font-sans";

  return (
    <div className={containerClasses}>
      
      {/* ATMOSPHERIC BACKGROUND RADIAL GLOW & NEBULA LIGHTS */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(14,165,233,0.15)_0%,_rgba(16,185,129,0.12)_45%,_transparent_75%)] pointer-events-none" />
      
      {/* GLOWING AMBIENT PARTICLES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping opacity-60" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse opacity-70" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-50" />
      </div>

      {/* TOP GAP FOR SPACING */}
      <div className="w-full h-2" />

      {/* MAIN CENTER CONTENT AREA */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
        
        {/* LOGO EMBLEM: CROSSED BLUE & GREEN GLOSSY LEAVES IN A GLOWING CIRCLE */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          
          {/* AMBIENT GLOW RINGS */}
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-cyan-500/10 blur-2xl animate-pulse" />
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-emerald-500/10 blur-2xl animate-pulse [animation-delay:500ms]" />

          {/* SVG LEAF 'X' EMBLEM WITH DETAILED SHADING */}
          <svg
            className="w-full h-full drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* BLUE LEAF GRADIENT */}
              <linearGradient id="blueLeafGradExact" x1="10%" y1="10%" x2="90%" y2="90%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#0284c7" />
                <stop offset="85%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* GREEN LEAF GRADIENT */}
              <linearGradient id="greenLeafGradExact" x1="90%" y1="10%" x2="10%" y2="90%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="40%" stopColor="#16a34a" />
                <stop offset="85%" stopColor="#065f46" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>

              {/* CIRCULAR RING GRADIENT */}
              <linearGradient id="ringGradExact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                <stop offset="50%" stopColor="rgba(16, 185, 129, 0.6)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.2)" />
              </linearGradient>
            </defs>

            {/* OUTER GLOWING CIRCULAR EMBLEM RING */}
            <circle
              cx="150"
              cy="150"
              r="105"
              stroke="url(#ringGradExact)"
              strokeWidth="1.5"
              className="opacity-80"
            />
            
            <circle
              cx="150"
              cy="150"
              r="112"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />

            {/* ORBITING GLOWING PARTICLES ON RING */}
            <circle cx="85" cy="85" r="2" fill="#38bdf8" className="animate-ping opacity-80" />
            <circle cx="215" cy="85" r="2.5" fill="#4ade80" className="animate-pulse opacity-90" />
            <circle cx="80" cy="210" r="1.5" fill="#38bdf8" />
            <circle cx="225" cy="200" r="2" fill="#4ade80" />

            {/* LEFT BLUE LEAF (Top-Left to Bottom-Right Stem) */}
            <g className="transition-transform duration-700 hover:scale-105">
              <path
                d="M 150 150 
                   C 110 110, 80 70, 95 45 
                   C 125 35, 160 70, 150 150 Z"
                fill="url(#blueLeafGradExact)"
                stroke="#7dd3fc"
                strokeWidth="1.2"
              />
              {/* Left Leaf Central Vein */}
              <path
                d="M 100 52 C 120 85, 140 120, 150 150"
                stroke="#bae6fd"
                strokeWidth="1.2"
                strokeOpacity="0.7"
              />
              {/* Left Leaf Side Veins */}
              <path d="M 115 72 Q 130 75 138 82" stroke="#e0f2fe" strokeWidth="0.8" strokeOpacity="0.4" />
              <path d="M 128 92 Q 140 95 145 102" stroke="#e0f2fe" strokeWidth="0.8" strokeOpacity="0.4" />
              {/* Stem (extending bottom-right) */}
              <path
                d="M 150 150 Q 170 180 195 210"
                stroke="#78716c"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>

            {/* RIGHT GREEN LEAF (Top-Right to Bottom-Left Stem) */}
            <g className="transition-transform duration-700 hover:scale-105">
              <path
                d="M 150 150 
                   C 190 110, 220 70, 205 45 
                   C 175 35, 140 70, 150 150 Z"
                fill="url(#greenLeafGradExact)"
                stroke="#86efac"
                strokeWidth="1.2"
              />
              {/* Right Leaf Central Vein */}
              <path
                d="M 200 52 C 180 85, 160 120, 150 150"
                stroke="#bbf7d0"
                strokeWidth="1.2"
                strokeOpacity="0.7"
              />
              {/* Right Leaf Side Veins */}
              <path d="M 185 72 Q 170 75 162 82" stroke="#dcfce7" strokeWidth="0.8" strokeOpacity="0.4" />
              <path d="M 172 92 Q 160 95 155 102" stroke="#dcfce7" strokeWidth="0.8" strokeOpacity="0.4" />
              {/* Stem (extending bottom-left) */}
              <path
                d="M 150 150 Q 130 180 105 210"
                stroke="#78716c"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>

          </svg>
        </div>

        {/* TYPOGRAPHY BRAND BLOCK */}
        <div className="space-y-1 -mt-2">
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-[0.2em] text-white">
            ALA <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">X</span>
          </h1>
          <div className="flex items-center justify-center gap-3 text-[11px] text-gray-400 tracking-[0.35em] uppercase font-serif">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-gray-500" />
            <span>BIBLIOTECA</span>
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-gray-500" />
          </div>
        </div>

        {/* CIRCULAR BOOK ICON BADGE */}
        <div className="pt-2">
          <div className="w-10 h-10 rounded-full border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] mx-auto">
            <BookOpen className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

        {/* STATUS TITLE & SUBTITLE */}
        <div className="space-y-1.5 pt-1">
          <h2 className="text-lg sm:text-xl font-medium text-white tracking-tight">
            {message}
          </h2>
          <p className="text-xs text-gray-400 font-normal">
            Organizando milhares de obras para você.
          </p>
        </div>

        {/* PROGRESS BAR & PERCENTAGE */}
        <div className="w-full max-w-xs sm:max-w-sm flex items-center gap-4 pt-3">
          <div className="flex-1 h-1.5 rounded-full bg-[#0d101e] border border-white/5 overflow-hidden p-[1px] relative shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(52,211,153,0.6)] relative"
              style={{ width: `${progress}%` }}
            >
              {/* GLOW TIP */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full blur-[1px] opacity-80" />
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider w-9 text-right">
            {progress}%
          </span>
        </div>

      </div>

      {/* THREE FEATURE PILLARS GRID */}
      <div className="relative z-10 w-full max-w-xl mx-auto grid grid-cols-3 gap-2 sm:gap-4 pt-8 pb-4 border-t border-white/5">
        
        {/* SEGURO */}
        <div className="flex flex-col items-center text-center space-y-1 px-1 sm:px-3 border-r border-white/10">
          <div className="w-8 h-8 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-1">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase">SEGURO</span>
          <span className="text-[10px] text-gray-400 leading-tight">Seus dados protegidos</span>
        </div>

        {/* RÁPIDO */}
        <div className="flex flex-col items-center text-center space-y-1 px-1 sm:px-3 border-r border-white/10">
          <div className="w-8 h-8 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-1">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase">RÁPIDO</span>
          <span className="text-[10px] text-gray-400 leading-tight">Desempenho otimizado</span>
        </div>

        {/* INTELIGENTE */}
        <div className="flex flex-col items-center text-center space-y-1 px-1 sm:px-3">
          <div className="w-8 h-8 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">INTELIGENTE</span>
          <span className="text-[10px] text-gray-400 leading-tight">Tudo organizado para você</span>
        </div>

      </div>

      {/* BOTTOM TAGLINE */}
      <div className="relative z-10 space-y-2 pt-2 text-center">
        <div className="text-[10px] sm:text-xs tracking-[0.4em] text-gray-400 font-medium uppercase">
          LEIA &bull; APRENDA &bull; EVOLUA
        </div>
        <div className="w-1.5 h-1.5 bg-cyan-400 rotate-45 mx-auto opacity-70 shadow-[0_0_8px_#22d3ee]" />
      </div>

    </div>
  );
};

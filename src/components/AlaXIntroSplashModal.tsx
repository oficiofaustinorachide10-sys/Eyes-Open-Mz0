import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Play, Volume2, VolumeX, X, BookOpen, Star, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface AlaXIntroSplashModalProps {
  user: User | null;
  mode?: 'login' | 'register' | 'manual';
  onClose: () => void;
}

export const AlaXIntroSplashModal: React.FC<AlaXIntroSplashModalProps> = ({
  user,
  mode = 'login',
  onClose
}) => {
  const [animStage, setAnimStage] = useState<number>(0); // 0: wings closed, 1: wings opening, 2: ring & tree, 3: text ALA X, 4: full tagline & session confirm
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Stage 1: Wings opening
    const t1 = setTimeout(() => setAnimStage(1), 300);
    // Stage 2: Tree & Ring formation
    const t2 = setTimeout(() => setAnimStage(2), 1600);
    // Stage 3: ALA X text reveal
    const t3 = setTimeout(() => setAnimStage(3), 3200);
    // Stage 4: Tagline & Session confirmation
    const t4 = setTimeout(() => setAnimStage(4), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleReplay = () => {
    setAnimStage(0);
    setTimeout(() => setAnimStage(1), 300);
    setTimeout(() => setAnimStage(2), 1600);
    setTimeout(() => setAnimStage(3), 3200);
    setTimeout(() => setAnimStage(4), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08090f] flex flex-col items-center justify-center overflow-hidden p-4 select-none">
      
      {/* ATMOSPHERIC BACKGROUND LIGHTING & STONE TEXTURE */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d2033] via-[#0d0e17] to-[#05060a] opacity-90"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_rgba(245,158,11,0.15)_0%,_transparent_60%)]"></div>

      {/* FLOATING SPARKLES / PARTICLES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-75"></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-50"></div>
      </div>

      {/* TOP CONTROLS */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={handleReplay}
          className="p-2.5 rounded-2xl bg-black/40 hover:bg-black/70 border border-amber-500/30 text-amber-300 hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer backdrop-blur-md"
          title="Repetir Animação"
        >
          <Play className="w-3.5 h-3.5 fill-amber-400" />
          <span className="hidden sm:inline">Repetir Vídeo</span>
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 rounded-2xl bg-black/40 hover:bg-black/70 border border-amber-500/30 text-amber-300 hover:text-white transition-all text-xs font-bold cursor-pointer backdrop-blur-md"
          title={isMuted ? "Ativar Áudio" : "Desativar Áudio"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>

        <button
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <span>Entrar na Biblioteca</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ANIMATION STAGE CONTAINER */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center text-center space-y-6 px-4">
        
        {/* LOGO SYMBOL CANVAS / SVG ANIMATION */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-2">
          
          {/* BACKLIGHT GLOW RING */}
          <div className={`absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-amber-500/10 blur-2xl transition-all duration-1000 ${
            animStage >= 2 ? 'opacity-100 scale-110' : 'opacity-20 scale-75'
          }`}></div>

          <svg className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]" viewBox="0 0 400 400" fill="none">
            
            {/* CIRCULAR EMBLEM RING */}
            <circle
              cx="200"
              cy="180"
              r="110"
              stroke="url(#goldGradient)"
              strokeWidth="4"
              className={`transition-all duration-1000 ${
                animStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transformOrigin: 'center' }}
            />

            {/* INNER RING ACCENT */}
            <circle
              cx="200"
              cy="180"
              r="104"
              stroke="#d97706"
              strokeWidth="1"
              strokeDasharray="4 4"
              className={`transition-all duration-1000 delay-300 ${
                animStage >= 2 ? 'opacity-60' : 'opacity-0'
              }`}
            />

            {/* WINGS ANIMATION (LEFT & RIGHT) */}
            <g className={`transition-all duration-1000 ease-out ${
              animStage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-40 translate-y-8 scale-90'
            }`}>
              {/* LEFT WING */}
              <path
                d="M 195 180 C 160 140, 110 110, 70 120 C 50 125, 60 155, 90 160 C 120 165, 150 185, 180 205 C 150 190, 110 180, 85 190 C 70 196, 75 210, 95 210 C 130 210, 170 205, 195 180 Z"
                fill="#181a24"
                stroke="url(#wingBorderLeft)"
                strokeWidth="2"
                className={`transition-transform duration-1000 ${
                  animStage >= 1 ? 'rotate-0' : '-rotate-12'
                }`}
                style={{ transformOrigin: '200px 180px' }}
              />

              {/* RIGHT WING */}
              <path
                d="M 205 180 C 240 140, 290 110, 330 120 C 350 125, 340 155, 310 160 C 280 165, 250 185, 220 205 C 250 190, 290 180, 315 190 C 330 196, 325 210, 305 210 C 270 210, 230 205, 205 180 Z"
                fill="#181a24"
                stroke="url(#wingBorderRight)"
                strokeWidth="2"
                className={`transition-transform duration-1000 ${
                  animStage >= 1 ? 'rotate-0' : 'rotate-12'
                }`}
                style={{ transformOrigin: '200px 180px' }}
              />
            </g>

            {/* TREE OF KNOWLEDGE & READER SILHOUETTES */}
            <g className={`transition-all duration-1000 delay-500 ${
              animStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`} style={{ transformOrigin: '200px 180px' }}>
              
              {/* TREE TRUNK & ROOTS */}
              <path
                d="M 195 220 Q 200 170 200 140 Q 200 170 205 220 Q 220 240 240 250 M 195 220 Q 180 240 160 250 M 200 220 Q 200 250 200 260"
                stroke="#d97706"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* TREE BRANCHES & CROWN (LEAVES) */}
              <circle cx="200" cy="140" r="45" fill="#12141d" stroke="url(#goldGradient)" strokeWidth="2.5" />
              <path d="M 175 130 Q 200 110 225 130 M 165 145 Q 200 125 235 145" stroke="#f59e0b" strokeWidth="1.5" fill="none" />

              {/* READER 1 (LEFT UNDER TREE) */}
              <path d="M 165 205 C 160 195, 170 185, 175 195 C 178 200, 170 210, 160 210 Z" fill="#f59e0b" />
              <rect x="155" y="198" width="8" height="6" rx="1" fill="#fbbf24" transform="rotate(-15 155 198)" />

              {/* READER 2 (RIGHT UNDER TREE) */}
              <path d="M 235 205 C 240 195, 230 185, 225 195 C 222 200, 230 210, 240 210 Z" fill="#f59e0b" />
              <rect x="237" y="198" width="8" height="6" rx="1" fill="#fbbf24" transform="rotate(15 237 198)" />
            </g>

            {/* GRADIENTS */}
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="wingBorderLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#181a24" />
              </linearGradient>
              <linearGradient id="wingBorderRight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#181a24" />
              </linearGradient>
            </defs>

          </svg>
        </div>

        {/* TYPOGRAPHY REVEAL */}
        <div className="space-y-3">
          
          {/* TITLE "ALA X" */}
          <div className={`transition-all duration-1000 ${
            animStage >= 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
          }`}>
            <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-400 to-amber-200 drop-shadow-[0_4px_15px_rgba(245,158,11,0.4)]">
              ALA X
            </h1>
          </div>

          {/* SUBTITLE "BIBLIOTECA MÓVEL" */}
          <div className={`transition-all duration-1000 delay-200 ${
            animStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-center justify-center gap-3 text-amber-300 font-mono text-xs sm:text-sm tracking-[0.35em] uppercase font-bold">
              <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-amber-400"></span>
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>BIBLIOTECA MÓVEL</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-amber-400"></span>
            </div>
          </div>

          {/* TAGLINE "CONHECIMENTO | ACESSO | TRANSFORMAÇÃO" */}
          <div className={`transition-all duration-1000 delay-500 pt-1 ${
            animStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-[11px] sm:text-xs text-amber-200/80 font-sans tracking-[0.25em] uppercase">
              CONHECIMENTO &bull; ACESSO &bull; TRANSFORMAÇÃO
            </p>
          </div>

        </div>

        {/* SESSION CONFIRMATION BADGE */}
        {user && (
          <div className={`transition-all duration-1000 delay-700 w-full pt-4 ${
            animStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            <div className="p-4 rounded-2xl bg-[#141624]/90 border border-amber-500/40 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4 max-w-lg mx-auto">
              
              <div className="flex items-center gap-3 text-left">
                <div className="relative">
                  <img
                    src={user.photoURL || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={user.name}
                    className="w-11 h-11 rounded-xl object-cover border-2 border-amber-400"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#141624] flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {mode === 'register' ? 'Nova Conta Confirmada' : 'Sessão Iniciada com Sucesso'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-sm">{user.name}</h4>
                  <p className="text-[10px] text-amber-300 font-mono truncate max-w-[180px] sm:max-w-[240px]">{user.email}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                Continuar
              </button>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};

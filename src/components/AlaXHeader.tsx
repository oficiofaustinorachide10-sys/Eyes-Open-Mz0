import React from 'react';
import { 
  BookOpen, Search, Star, Heart, FolderDown, User as UserIcon, 
  Play, PlusCircle, Shield, LogOut, Check, Bell
} from 'lucide-react';
import { User } from '../types';

interface AlaXHeaderProps {
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenIntroVideo: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenFavorites: () => void;
  onOpenDownloads: () => void;
  onOpenNotifications: () => void;
  unreadNotificationCount: number;
  favoriteCount: number;
  downloadCount: number;
  onLogout: () => void;
}

export const AlaXHeader: React.FC<AlaXHeaderProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenIntroVideo,
  onOpenAdmin,
  onOpenAuth,
  onOpenProfile,
  onOpenFavorites,
  onOpenDownloads,
  onOpenNotifications,
  unreadNotificationCount,
  favoriteCount,
  downloadCount,
  onLogout
}) => {
  const isPublisher = currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin';

  return (
    <header className="relative w-full overflow-hidden border-b border-amber-500/30 bg-[#07080f]">
      
      {/* BLURRED VIDEO / MOTION BACKDROP LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* ANIMATED WINGS & LIGHTING BACKDROP */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/20 via-[#10121e] to-[#07080f] opacity-80"></div>
        
        {/* BLUR FILTER MASK */}
        <div className="absolute inset-0 backdrop-blur-xl bg-black/60"></div>

        {/* FLOATING PARTICLES & GOLD ORB GLOW */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl animate-pulse"></div>
        <div className="absolute -top-12 left-1/4 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl"></div>
        <div className="absolute -bottom-12 right-1/4 w-64 h-64 rounded-full bg-amber-600/10 blur-2xl"></div>

        {/* BACKGROUND LOGO WINGS WATERMARK */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 opacity-10 blur-[1px] pointer-events-none" viewBox="0 0 400 400">
          <circle cx="200" cy="180" r="110" stroke="#f59e0b" strokeWidth="2" fill="none" />
          <path d="M 195 180 C 160 140, 110 110, 70 120 C 50 125, 60 155, 90 160 C 120 165, 150 185, 180 205 Z" fill="#f59e0b" />
          <path d="M 205 180 C 240 140, 290 110, 330 120 C 350 125, 340 155, 310 160 C 280 165, 250 185, 220 205 Z" fill="#f59e0b" />
        </svg>

      </div>

      {/* TOP COMPACT BAR (Quick links & User Profile) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 flex items-center justify-between border-b border-amber-500/10 text-xs">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenIntroVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold hover:text-white transition-all cursor-pointer text-[11px]"
          >
            <Play className="w-3 h-3 fill-amber-400" />
            <span>Assistir Logótipo Animado</span>
          </button>

          <span className="text-gray-500 hidden sm:inline">&bull;</span>
          <span className="text-gray-400 hidden sm:inline text-[11px]">Leitura em PDF &bull; Acesso Livre</span>
        </div>

        <div className="flex items-center gap-2">
          {/* NOTIFICATIONS BELL */}
          <button
            onClick={onOpenNotifications}
            className="relative px-2.5 py-1.5 rounded-xl bg-[#141624]/80 hover:bg-[#1b1e30] border border-amber-500/20 text-amber-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
            title="Notificações em Tempo Real"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Avisos</span>
            {unreadNotificationCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-black animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* FAVORITES */}
          <button
            onClick={onOpenFavorites}
            className="px-2.5 py-1.5 rounded-xl bg-[#141624]/80 hover:bg-[#1b1e30] border border-amber-500/20 text-amber-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
            <span className="hidden sm:inline">Favoritos</span>
            {favoriteCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {favoriteCount}
              </span>
            )}
          </button>

          {/* DOWNLOADS */}
          <button
            onClick={onOpenDownloads}
            className="px-2.5 py-1.5 rounded-xl bg-[#141624]/80 hover:bg-[#1b1e30] border border-amber-500/20 text-emerald-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
          >
            <FolderDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Downloads</span>
            {downloadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-black">
                {downloadCount}
              </span>
            )}
          </button>

          {/* DISCRETE PUBLISHER ACTION */}
          {isPublisher && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold flex items-center gap-1 transition-all cursor-pointer text-[11px] shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Obra</span>
            </button>
          )}

          {/* USER ACCOUNT */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#141624]/80 hover:bg-[#1b1e30] border border-amber-500/30 text-amber-100 transition-all cursor-pointer"
            >
              <img
                src={currentUser.photoURL || currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-lg object-cover border border-amber-400"
              />
              <span className="font-bold text-[11px] truncate max-w-[100px]">{currentUser.name}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1 rounded-xl bg-amber-500 text-black font-bold text-[11px]"
            >
              Entrar
            </button>
          )}
        </div>

      </div>

      {/* CENTERED HEADER HERO CONTENT */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8 pb-10 text-center space-y-4">
        
        {/* TOP EMBLEM STAR ROW */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-amber-400"></div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent via-amber-500/50 to-amber-400"></div>
        </div>

        {/* MAIN CENTERED BRAND "ALA X" */}
        <div className="space-y-1">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-200 drop-shadow-[0_10px_35px_rgba(245,158,11,0.5)] select-none">
            ALA X
          </h1>

          {/* SUBTITLE */}
          <div className="flex items-center justify-center gap-3 text-amber-300 font-mono text-xs sm:text-base tracking-[0.35em] uppercase font-bold pt-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>BIBLIOTECA MÓVEL</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>

          <p className="text-[11px] sm:text-xs text-amber-200/70 font-sans tracking-[0.25em] uppercase pt-1">
            CONHECIMENTO &bull; ACESSO &bull; TRANSFORMAÇÃO
          </p>
        </div>

        {/* CENTERED SEARCH INPUT BAR */}
        <div className="max-w-xl mx-auto pt-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-amber-400" />
            <input
              type="text"
              placeholder="Pesquisar obras em PDF, autores, temas ou títulos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#121422]/90 border border-amber-500/40 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-amber-100 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 backdrop-blur-md shadow-2xl transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-3.5 text-xs text-gray-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

      </div>

    </header>
  );
};

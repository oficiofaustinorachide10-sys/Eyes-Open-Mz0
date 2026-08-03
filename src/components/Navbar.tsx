import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, Shield, Sparkles, Heart, User as UserIcon, 
  LogOut, PlusCircle, FolderDown, Menu, X, ChevronDown, Check, Bell
} from 'lucide-react';
import { User } from '../types';
import { BOOK_CATEGORIES } from '../utils';
import { ThemeSwitcher, AppTheme } from './ThemeSwitcher';

interface NavbarProps {
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenFavorites: () => void;
  onOpenDownloads: () => void;
  onOpenNotifications: () => void;
  unreadNotificationCount: number;
  downloadCount: number;
  favoriteCount: number;
  onLogout: () => void;
  transparentOverlay?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  currentTheme,
  onThemeChange,
  onOpenAdmin,
  onOpenAuth,
  onOpenProfile,
  onOpenFavorites,
  onOpenDownloads,
  onOpenNotifications,
  unreadNotificationCount,
  downloadCount,
  favoriteCount,
  onLogout,
  transparentOverlay = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Check if guest user & publisher
  const isGuest = !currentUser || currentUser.id === 'guest_reader' || Boolean(currentUser.isGuest);
  const isPublisher = !isGuest && (currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin');

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-xl transition-all ${
      transparentOverlay
        ? 'bg-[#07090e]/85 border-white/10 text-white shadow-2xl'
        : currentTheme === 'light'
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200'
        : currentTheme === 'lite'
        ? 'bg-slate-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-500/10'
        : 'bg-[#0c0d14]/90 border-amber-500/20 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shadow-md ${
              currentTheme === 'lite'
                ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-black shadow-emerald-500/30'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-amber-500/20'
            }`}>
              X
            </div>
            <div className="flex flex-col">
              <span className={`font-extrabold text-base font-serif tracking-wider leading-none ${
                currentTheme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                ALA X
              </span>
              <span className={`text-[9px] tracking-tight font-bold uppercase ${
                currentTheme === 'light' ? 'text-amber-700' : 'text-amber-400'
              }`}>
                BIBLIOTECA DIGITAL
              </span>
            </div>
          </div>

          {/* DESKTOP NAV LINKS (MATCHING DESIGN IMAGE) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold">
            <button
              onClick={() => onSelectCategory('todas')}
              className="text-amber-400 border-b-2 border-amber-400 py-1 font-extrabold cursor-pointer"
            >
              Início
            </button>
            <button
              onClick={() => onSelectCategory('todas')}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Explorar
            </button>
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Categorias
            </button>
            <button
              onClick={() => onSelectCategory('todas')}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Autores
            </button>
            <button
              onClick={() => onSelectCategory('todas')}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Blog
            </button>
          </nav>

          {/* SEARCH BAR (DESKTOP) */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <Search className={`absolute left-3.5 top-2.5 w-4 h-4 ${
              currentTheme === 'light' ? 'text-slate-400' : 'text-amber-400/60'
            }`} />
            <input
              type="text"
              placeholder="Buscar obras, autores..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs outline-none transition-all shadow-inner ${
                currentTheme === 'light'
                  ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                  : currentTheme === 'lite'
                  ? 'bg-slate-900 border-emerald-500/30 text-emerald-100 placeholder-slate-500 focus:border-emerald-400'
                  : 'bg-[#151726] border-amber-500/20 text-amber-100 placeholder-gray-500 focus:border-amber-400/80'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* RIGHT CONTROLS */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* THEME SWITCHER */}
            <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />

            {/* NOTIFICATIONS */}
            <button
              onClick={onOpenNotifications}
              className={`relative px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#151726] hover:bg-[#1c1f33] border-amber-500/20 text-amber-200'
              }`}
              title="Notificações em Tempo Real"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Avisos</span>
              {unreadNotificationCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] flex items-center justify-center font-black animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* FAVORITES */}
            <button
              onClick={onOpenFavorites}
              className={`relative px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#151726] hover:bg-[#1c1f33] border-amber-500/20 text-amber-200'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              <span>Favoritos</span>
              {favoriteCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* DOWNLOADS MANAGER */}
            <button
              onClick={onOpenDownloads}
              className={`relative px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-emerald-700'
                  : 'bg-[#151726] hover:bg-[#1c1f33] border-amber-500/20 text-emerald-300'
              }`}
            >
              <FolderDown className="w-4 h-4 text-emerald-500" />
              <span>Downloads</span>
              {downloadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] flex items-center justify-center font-black">
                  {downloadCount}
                </span>
              )}
            </button>

            {/* PUBLISHER DISCRETE ACTION (+ Nova Obra - Invisible to non-publishers) */}
            {isPublisher && (
              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Obra</span>
              </button>
            )}

            {/* USER PROFILE OR LOGIN BUTTON */}
            {!isGuest && currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#151726] hover:bg-[#1c1f33] border border-amber-500/30 text-xs text-amber-100 transition-all cursor-pointer"
                >
                  <img
                    src={currentUser.photoURL || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-amber-400/50"
                  />
                  <span className="font-bold truncate max-w-[120px]">{currentUser.name}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                  title="Encerrar Sessão / Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4" />
                <span>Iniciar Sessão</span>
              </button>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className="flex lg:hidden items-center gap-2">
            {isPublisher && (
              <button
                onClick={onOpenAdmin}
                className="p-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-[#151726] text-amber-400 border border-amber-500/20"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className={`lg:hidden border-t px-4 py-4 space-y-3 ${
          currentTheme === 'light' 
            ? 'bg-slate-50 border-slate-200 text-slate-900' 
            : 'bg-[#0f111c] border-amber-500/20 text-white'
        }`}>
          
          {/* THEME SWITCHER ROW MOBILE */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-black/10 border border-white/10">
            <span className="text-xs font-bold">Tema da App:</span>
            <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-amber-400/60" />
            <input
              type="text"
              placeholder="Pesquisar obras..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#151726] border border-amber-500/20 rounded-xl pl-10 pr-4 py-2 text-xs text-amber-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => { onOpenNotifications(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-[#151726] border border-amber-500/20 text-xs font-bold text-amber-300 flex flex-col items-center justify-center gap-1"
            >
              <div className="relative">
                <Bell className="w-4 h-4 text-amber-400" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.1 rounded-full bg-amber-400 text-black text-[9px] font-black">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Avisos</span>
            </button>

            <button
              onClick={() => { onOpenFavorites(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-[#151726] border border-amber-500/20 text-xs font-bold text-amber-200 flex flex-col items-center justify-center gap-1"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="text-[10px]">Favoritos ({favoriteCount})</span>
            </button>

            <button
              onClick={() => { onOpenDownloads(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-[#151726] border border-amber-500/20 text-xs font-bold text-emerald-300 flex flex-col items-center justify-center gap-1"
            >
              <FolderDown className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px]">Downloads ({downloadCount})</span>
            </button>
          </div>

          {!isGuest && currentUser ? (
            <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between">
              <button
                onClick={() => { onOpenProfile(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-xs font-bold text-white"
              >
                <img
                  src={currentUser.photoURL || currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <span>{currentUser.name}</span>
              </button>

              <button
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                className="p-2 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-amber-500/10">
              <button
                onClick={() => { onOpenAuth(); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>Iniciar Sessão / Criar Conta</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

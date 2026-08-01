import React, { useState } from 'react';
import { 
  BookOpen, Search, ShieldCheck, User as UserIcon, LogIn, LogOut, 
  PlusCircle, Sparkles, Heart, Menu, X, Library, Download, FolderDown
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenFavorites: () => void;
  onOpenDownloads: () => void;
  downloadCount?: number;
  favoriteCount?: number;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenAdmin,
  onOpenAuth,
  onOpenProfile,
  onOpenFavorites,
  onOpenDownloads,
  downloadCount = 0,
  favoriteCount = 0,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'admin@alax.mz';

  return (
    <header className="sticky top-0 z-40 bg-[#0f1117]/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* LOGO ALA X */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer" onClick={() => onSelectCategory('todas')}>
              <div className="w-full h-full bg-[#12141d] rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="cursor-pointer" onClick={() => onSelectCategory('todas')}>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-xl tracking-wider text-white font-mono">
                  ALA <span className="text-amber-400 font-black">X</span>
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PDF
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
                Biblioteca Digital de Obras
              </p>
            </div>
          </div>

          {/* SEARCH BAR (DESKTOP) */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/60" />
              <input
                type="text"
                placeholder="Pesquisar por título, autor, palavra-chave..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/20 rounded-xl pl-9 pr-4 py-2 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            
            {/* OBRAS BAIXADAS */}
            <button
              onClick={onOpenDownloads}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1c29] border border-amber-500/20 hover:border-amber-400/50 text-amber-200 hover:text-white text-xs font-semibold transition-all cursor-pointer relative"
              title="Obras Baixadas (Downloads)"
            >
              <FolderDown className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Baixadas</span>
              {downloadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-extrabold text-[10px]">
                  {downloadCount}
                </span>
              )}
            </button>

            {/* FAVORITES / MY LIBRARY */}
            {currentUser && (
              <button
                onClick={onOpenFavorites}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1c29] border border-amber-500/20 hover:border-amber-400/50 text-amber-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                title="Minha Biblioteca de Favoritos"
              >
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
                <span>Favoritos</span>
                {favoriteCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px]">
                    {favoriteCount}
                  </span>
                )}
              </button>
            )}

            {/* PUBLISH BUTTON (ONLY FOR AUTHORIZED PUBLISHER ACCOUNT) */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publicar Obra</span>
              </button>
            )}

            {/* USER PROFILE / AUTH BUTTON */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-xl bg-[#1a1c29] border border-amber-500/30 hover:border-amber-400 text-xs text-amber-100 transition-all cursor-pointer"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-amber-400/50"
                  />
                  <span className="font-bold max-w-[100px] truncate hidden md:inline">
                    {currentUser.name}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-rose-400 rounded-xl hover:bg-white/5 cursor-pointer transition-all"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-extrabold text-xs tracking-wide shadow-md shadow-amber-500/20 hover:opacity-95 cursor-pointer transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar / Registar</span>
              </button>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-amber-400 md:hidden rounded-lg hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE SEARCH & NAVIGATION EXTENSION */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-amber-500/20 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/60" />
              <input
                type="text"
                placeholder="Pesquisar obras no Ala X..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#181a24] border border-amber-500/20 rounded-xl pl-9 pr-4 py-2 text-xs text-amber-100 placeholder-gray-500 outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => { onOpenDownloads(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1a1c29] border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FolderDown className="w-4 h-4 text-emerald-400" />
                  <span>Obras Baixadas (Gestor)</span>
                </div>
                {downloadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                    {downloadCount}
                  </span>
                )}
              </button>

              {currentUser && (
                <button
                  onClick={() => { onOpenFavorites(); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1a1c29] text-amber-200 text-xs font-semibold flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Minha Biblioteca de Favoritos</span>
                  </div>
                  {favoriteCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {favoriteCount}
                    </span>
                  )}
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Publicar Obra em PDF</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

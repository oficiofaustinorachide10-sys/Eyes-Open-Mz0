import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, Shield, Sparkles, Heart, User as UserIcon, 
  LogOut, PlusCircle, FolderDown, Menu, X, ChevronDown, Check
} from 'lucide-react';
import { User } from '../types';
import { BOOK_CATEGORIES } from '../utils';

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
  downloadCount: number;
  favoriteCount: number;
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
  downloadCount,
  favoriteCount,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Discrete permission check — NO admin text broadcasted
  const isPublisher = currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-[#0c0d14]/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-lg shadow-md shadow-amber-500/20">
              X
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base font-serif tracking-wider leading-none">
                ALA X
              </span>
              <span className="text-[10px] text-amber-300 font-sans tracking-tight">
                Biblioteca & Obras Literárias
              </span>
            </div>
          </div>

          {/* SEARCH BAR (DESKTOP) */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-amber-400/60" />
            <input
              type="text"
              placeholder="Pesquisar por título, autor ou palavra-chave..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#151726] border border-amber-500/20 rounded-xl pl-10 pr-4 py-2 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400/80 transition-all shadow-inner"
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
            
            {/* FAVORITES */}
            <button
              onClick={onOpenFavorites}
              className="relative px-3 py-2 rounded-xl bg-[#151726] hover:bg-[#1c1f33] border border-amber-500/20 text-xs font-bold text-amber-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
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
              className="relative px-3 py-2 rounded-xl bg-[#151726] hover:bg-[#1c1f33] border border-amber-500/20 text-xs font-bold text-emerald-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <FolderDown className="w-4 h-4 text-emerald-400" />
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

            {/* USER PROFILE BUTTON */}
            {currentUser ? (
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
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer"
              >
                Entrar
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
        <div className="lg:hidden border-t border-amber-500/20 bg-[#0f111c] px-4 py-4 space-y-3">
          
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

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => { onOpenFavorites(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-[#151726] border border-amber-500/20 text-xs font-bold text-amber-200 flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Favoritos ({favoriteCount})</span>
            </button>

            <button
              onClick={() => { onOpenDownloads(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-[#151726] border border-amber-500/20 text-xs font-bold text-emerald-300 flex items-center gap-2"
            >
              <FolderDown className="w-4 h-4 text-emerald-400" />
              <span>Downloads ({downloadCount})</span>
            </button>
          </div>

          {currentUser && (
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
          )}
        </div>
      )}
    </header>
  );
};

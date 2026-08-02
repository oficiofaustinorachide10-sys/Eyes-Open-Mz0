import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Zap, ChevronDown, Check } from 'lucide-react';

export type AppTheme = 'dark' | 'light' | 'lite';

interface ThemeSwitcherProps {
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onThemeChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeConfig = {
    dark: {
      label: 'Tema Escuro',
      shortLabel: 'Escuro',
      icon: Moon,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 border-amber-500/30'
    },
    light: {
      label: 'Tema Claro',
      shortLabel: 'Claro',
      icon: Sun,
      color: 'text-amber-500',
      badgeBg: 'bg-amber-500/20 border-amber-500/30'
    },
    lite: {
      label: 'Tema Lite (Pro)',
      shortLabel: 'Tema Lite',
      icon: Zap,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 border-emerald-500/30'
    }
  };

  const CurrentIcon = themeConfig[currentTheme].icon;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
          currentTheme === 'light'
            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
            : currentTheme === 'lite'
            ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-200 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
            : 'bg-[#151726] hover:bg-[#1c1f33] text-amber-200 border-amber-500/30'
        }`}
        title="Alternar Tema da Biblioteca"
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${themeConfig[currentTheme].color}`} />
        <span className="hidden sm:inline">{themeConfig[currentTheme].shortLabel}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-52 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
          currentTheme === 'light'
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#10121d] border-amber-500/30 text-white'
        }`}>
          <div className="px-2 py-1.5 border-b border-white/10 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
              Personalizar Interface
            </span>
          </div>

          {/* ESCURO */}
          <button
            type="button"
            onClick={() => {
              onThemeChange('dark');
              setIsOpen(false);
            }}
            className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
              currentTheme === 'dark' 
                ? 'bg-amber-500/20 text-amber-300 font-extrabold' 
                : 'hover:bg-white/5 text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs block font-bold">Tema Escuro</span>
                <span className="text-[10px] text-gray-400 block font-normal">Aparência noturna elegante</span>
              </div>
            </div>
            {currentTheme === 'dark' && <Check className="w-4 h-4 text-amber-400" />}
          </button>

          {/* CLARO */}
          <button
            type="button"
            onClick={() => {
              onThemeChange('light');
              setIsOpen(false);
            }}
            className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
              currentTheme === 'light' 
                ? 'bg-amber-500/20 text-amber-700 font-extrabold' 
                : 'hover:bg-black/5 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-xs block font-bold">Tema Claro</span>
                <span className="text-[10px] text-gray-500 block font-normal">Alto contraste diurno</span>
              </div>
            </div>
            {currentTheme === 'light' && <Check className="w-4 h-4 text-amber-500" />}
          </button>

          {/* TEMA LITE */}
          <button
            type="button"
            onClick={() => {
              onThemeChange('lite');
              setIsOpen(false);
            }}
            className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
              currentTheme === 'lite' 
                ? 'bg-emerald-500/20 text-emerald-300 font-extrabold' 
                : 'hover:bg-white/5 text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">Tema Lite</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[8px] font-black uppercase">
                    Pro
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block font-normal">Disposição compacta reordenada</span>
              </div>
            </div>
            {currentTheme === 'lite' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

        </div>
      )}
    </div>
  );
};

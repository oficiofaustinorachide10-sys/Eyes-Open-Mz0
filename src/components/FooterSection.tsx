import React from 'react';
import { Facebook, Instagram, Twitter, Youtube, Heart } from 'lucide-react';

interface FooterSectionProps {
  onSelectCategory?: (category: string) => void;
  theme?: 'dark' | 'light' | 'lite';
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onSelectCategory, theme = 'dark' }) => {
  return (
    <footer className={`border-t transition-colors mt-16 ${
      theme === 'light'
        ? 'bg-slate-200 border-slate-300 text-slate-800'
        : 'bg-[#06070c] border-white/10 text-gray-400'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20">
                X
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-lg font-serif tracking-wider leading-none">
                  ALA X
                </span>
                <span className="text-[10px] text-amber-400 font-sans tracking-tight uppercase font-bold">
                  BIBLIOTECA DIGITAL
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Sua biblioteca virtual gratuita com milhares de obras para ler, baixar e se inspirar.
            </p>

            {/* SOCIAL ICONS */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-400 flex items-center justify-center transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-400 flex items-center justify-center transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-400 flex items-center justify-center transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-400 flex items-center justify-center transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* COLUMN 1: NAVEGAÇÃO */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Início</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Explorar</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Categorias</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Autores</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* COLUMN 2: INSTITUCIONAL */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Institucional</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Como funciona</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Termos de uso</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Política de privacidade</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* COLUMN 3: AJUDA */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Ajuda</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Perguntas frequentes</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Como baixar</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Reportar problema</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Suporte</a></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            © 2024 Ala X. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-amber-400 transition-colors">Termos de uso</a>
            <span>|</span>
            <a href="#" className="hover:text-amber-400 transition-colors">Privacidade</a>
            <span>|</span>
            <a href="#" className="hover:text-amber-400 transition-colors">Contato</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

import React from 'react';
import { X, Lock, ShieldAlert, LogIn, Sparkles, UserPlus } from 'lucide-react';

interface GuestAuthPromptModalProps {
  actionMessage?: string;
  onClose: () => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
}

export const GuestAuthPromptModal: React.FC<GuestAuthPromptModalProps> = ({
  actionMessage = 'Para utilizar esta funcionalidade, inicie sessão ou crie uma conta.',
  onClose,
  onOpenAuth,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#0e101a] border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl relative space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ICON BADGE */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>

        {/* HEADING & MESSAGE */}
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold font-serif text-white tracking-tight">
            Acesso Restrito
          </h3>
          <p className="text-sm text-amber-200/90 font-medium leading-relaxed max-w-sm mx-auto p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            {actionMessage}
          </p>
        </div>

        {/* BENEFIT HIGHLIGHTS */}
        <div className="p-4 rounded-2xl bg-[#171926] border border-white/5 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Leitura completa e ininterrupta de PDFs e capítulos</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Descarregamento de obras em alta velocidade</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Guardar favoritos, avaliar e comentar capítulos</span>
          </div>
        </div>

        {/* ACTION BUTTONS: INICIAR SESSÃO & CRIAR CONTA */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenAuth('login');
            }}
            className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-black text-xs shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sessão</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenAuth('register');
            }}
            className="py-3 px-3 rounded-2xl bg-[#1f2235] hover:bg-[#282c45] border border-amber-500/30 text-amber-300 font-black text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Conta</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-2xl bg-transparent hover:bg-white/5 text-slate-400 text-xs font-bold transition-all cursor-pointer"
        >
          Continuar apenas a explorar
        </button>
      </div>
    </div>
  );
};

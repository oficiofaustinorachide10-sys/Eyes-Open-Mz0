import React from 'react';
import { User } from '../types';
import { User as UserIcon, LogIn, X, Shield, ArrowRight } from 'lucide-react';

interface ContinueSessionModalProps {
  savedUser: User;
  onConfirm: () => void;
  onSwitchAccount: () => void;
}

export const ContinueSessionModal: React.FC<ContinueSessionModalProps> = ({
  savedUser,
  onConfirm,
  onSwitchAccount
}) => {
  const isAdmin = savedUser.role === 'admin' || savedUser.email === 'admin@alax.mz';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-[#141622] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <img
              src={savedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={savedUser.name}
              className="w-full h-full rounded-[14px] object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-serif">Bem-vindo de volta ao Ala X</h3>
            <p className="text-xs text-amber-300">Detetámos uma sessão anterior neste navegador</p>
          </div>
        </div>

        {/* PROMPT QUESTION */}
        <div className="p-4 rounded-2xl bg-[#181a26] border border-amber-500/20 text-center space-y-2">
          <p className="text-xs text-gray-300">Quer continuar com esta conta?</p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="font-extrabold text-white text-sm">{savedUser.name}</span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono">{savedUser.email}</p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-all cursor-pointer"
          >
            <span>Continuar como {savedUser.name.split(' ')[0]}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onSwitchAccount}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/20 text-amber-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Entrar com outra conta</span>
          </button>
        </div>

      </div>
    </div>
  );
};

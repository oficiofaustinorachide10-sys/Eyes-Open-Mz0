import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';

interface NewsletterSectionProps {
  theme?: 'dark' | 'light' | 'lite';
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ theme = 'dark' }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0a0c16] border border-amber-500/20 p-6 sm:p-10 my-10 shadow-2xl">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Mail className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Fique por dentro das novidades
            </h3>
            <p className="text-xs text-gray-400 max-w-md">
              Receba lançamentos, dicas de leitura e novidades da <strong className="text-amber-300 font-bold">Ala X</strong>
            </p>
          </div>
        </div>

        {subscribed ? (
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Obrigado! Inscrição confirmada com sucesso.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              required
              className="w-full sm:w-72 px-4 py-3 rounded-xl bg-[#131525] border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 transition-all shadow-inner"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-black font-extrabold text-xs tracking-wide shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Quero receber
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

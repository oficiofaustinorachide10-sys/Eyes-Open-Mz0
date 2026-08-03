import React from 'react';
import { Shield, Download, Lock, CheckCircle2 } from 'lucide-react';

interface WhyUseAlaXSectionProps {
  theme?: 'dark' | 'light' | 'lite';
}

export const WhyUseAlaXSection: React.FC<WhyUseAlaXSectionProps> = ({ theme = 'dark' }) => {
  const features = [
    {
      title: 'Leitura 100% Gratuita',
      desc: 'Acesso livre a milhares de obras',
      icon: Shield
    },
    {
      title: 'Download Instantâneo',
      desc: 'Baixe e leia quando quiser',
      icon: Download
    },
    {
      title: 'Sem Cadastro Obrigatório',
      desc: 'Acesse rápido e sem burocracia',
      icon: Lock
    },
    {
      title: 'Seguro e Confiável',
      desc: 'Plataforma protegida e verificada',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="space-y-4 my-10">
      <h3 className={`text-xl font-extrabold tracking-tight ${
        theme === 'light' ? 'text-slate-950' : 'text-white'
      }`}>
        Por que usar a Ala X?
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                  : 'bg-[#0e101c] border-white/10 text-white hover:border-amber-500/30'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white leading-snug">{item.title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

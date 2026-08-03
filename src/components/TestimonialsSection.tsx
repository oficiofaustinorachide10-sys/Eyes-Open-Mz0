import React from 'react';
import { Star, ArrowRight, Quote } from 'lucide-react';

interface TestimonialsSectionProps {
  theme?: 'dark' | 'light' | 'lite';
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ theme = 'dark' }) => {
  const testimonials = [
    {
      name: 'Juliana M.',
      role: 'Leitora assídua',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      text: '"A Ala X mudou minha forma de ler. Tem obras incríveis e o acesso é super fácil!"',
      stars: 5
    },
    {
      name: 'Rafael S.',
      role: 'Estudante',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      text: '"Finalmente um lugar onde encontro livros grátis com qualidade e segurança."',
      stars: 5
    },
    {
      name: 'Patrícia L.',
      role: 'Professora',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      text: '"Baixo os livros e leio no meu tempo, sem complicação. Recomendo demais!"',
      stars: 5
    }
  ];

  return (
    <div className="space-y-4 my-10">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-extrabold tracking-tight ${
          theme === 'light' ? 'text-slate-950' : 'text-white'
        }`}>
          O que nossos leitores dizem
        </h3>
        <button className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer">
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((item, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                : 'bg-[#0f111d] border-white/10 text-white'
            }`}
          >
            <div className="space-y-3">
              <Quote className="w-8 h-8 text-amber-500/40" />
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium italic">
                {item.text}
              </p>
              <div className="flex items-center gap-1 text-amber-400 pt-1">
                {[...Array(item.stars)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
              />
              <div>
                <h5 className="font-extrabold text-xs text-white leading-snug">{item.name}</h5>
                <p className="text-[10px] text-gray-400">{item.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

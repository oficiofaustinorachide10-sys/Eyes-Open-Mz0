import React, { useState } from 'react';
import { BookOpen, Star, BookMarked, Users, Shield, CheckCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Book, User } from '../types';

interface HeroBannerProps {
  featuredBook?: Book;
  currentUser: User | null;
  onReadBook: (book: Book) => void;
  onOpenDetails?: (book: Book, tab?: 'reviews' | 'comments') => void;
  onOpenAdmin: () => void;
  totalBooksCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredBook,
  currentUser,
  onReadBook,
  onOpenDetails,
  onOpenAdmin,
  totalBooksCount
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const displayBook = featuredBook || {
    id: 'book_madrasta_hero',
    title: 'A MADRASTA',
    author: 'Ofélio Faustino',
    synopsis: 'Um drama envolvente sobre amor, família e os desafios que transformam destinos.',
    category: 'Drama',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadCount: 1420,
    ratingAverage: 4.9,
    ratingCount: 38
  } as Book;

  return (
    <div className="space-y-6 my-4">
      
      {/* MAIN HERO CARD (MATCHING UPLOADED DESIGN) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#070911] border border-amber-500/20 p-6 sm:p-10 lg:p-12 shadow-2xl">
        
        {/* ATMOSPHERIC FOREST/LIGHTING WALLPAPER BACKGROUND */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen pointer-events-none"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-8767611136f6?auto=format&fit=crop&q=80&w=1600')`
          }}
        />
        
        {/* AMBER & GOLDEN ATMOSPHERIC LIGHT GLOWS */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/20 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-amber-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-amber-300/10 blur-[100px] pointer-events-none" />

        {/* CAROUSEL NAVIGATION ARROWS */}
        <button 
          onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : 3))}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 hover:border-amber-400 text-white hover:text-amber-400 items-center justify-center transition-all cursor-pointer backdrop-blur-md z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setActiveSlide((prev) => (prev < 3 ? prev + 1 : 0))}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 hover:border-amber-400 text-white hover:text-amber-400 items-center justify-center transition-all cursor-pointer backdrop-blur-md z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT SIDE CONTENT */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* BADGE: DESTAQUE DA SEMANA */}
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-black tracking-widest uppercase">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>DESTAQUE DA SEMANA</span>
            </div>

            {/* MAIN TITLE */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-serif uppercase leading-tight">
                {displayBook.title}
              </h1>
              <p className="text-xl sm:text-2xl text-amber-400 font-serif italic font-medium">
                Por <span className="underline decoration-amber-500/40">{displayBook.author}</span>
              </p>
            </div>

            {/* SYNOPSIS */}
            <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
              {displayBook.synopsis || 'Um drama envolvente sobre amor, família e os desafios que transformam destinos.'}
            </p>

            {/* BUTTONS */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onReadBook(displayBook)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ler agora</span>
              </button>

              <button
                onClick={() => onOpenDetails?.(displayBook, 'reviews')}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-black/50 hover:bg-black/80 border border-white/20 hover:border-amber-400 text-white font-bold text-sm transition-all cursor-pointer backdrop-blur-md"
              >
                <span>Ver detalhes</span>
              </button>
            </div>

            {/* CAROUSEL INDICATOR DOTS */}
            <div className="flex items-center gap-2 pt-4">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeSlide === idx ? 'w-8 bg-amber-400' : 'w-5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

          </div>

          {/* RIGHT SIDE 3D BOOK DISPLAY */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div 
              onClick={() => onReadBook(displayBook)}
              className="relative group cursor-pointer max-w-xs sm:max-w-sm"
            >
              {/* SHADOW & AMBER GLOW */}
              <div className="absolute -inset-3 bg-amber-400/20 rounded-2xl blur-2xl group-hover:bg-amber-400/35 transition duration-500" />
              
              {/* 3D BOOK COVER MOCKUP MATCHING DESIGN IMAGE */}
              <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-white text-slate-900 p-6 sm:p-8 shadow-2xl transition-transform duration-500 group-hover:scale-[1.03] min-h-[360px] sm:min-h-[420px] flex flex-col justify-between border-r-8 border-r-slate-300">
                
                {/* FLORAL ARTWORK BACKGROUND PATTERN ON COVER */}
                <div className="absolute top-4 right-4 opacity-15 pointer-events-none text-slate-900">
                  <svg width="140" height="180" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M10 100 Q 30 50 80 10" />
                    <path d="M30 70 Q 50 30 90 20" />
                    <circle cx="80" cy="10" r="8" />
                    <circle cx="90" cy="20" r="5" />
                  </svg>
                </div>

                <div className="space-y-4 relative z-10">
                  <h2 className="text-3xl sm:text-4xl font-black font-serif tracking-tight text-slate-950 uppercase border-b border-slate-200 pb-2">
                    {displayBook.title}
                  </h2>
                  <p className="text-sm font-serif italic text-slate-600">
                    A sombra do coração
                  </p>
                  <p className="text-xs font-serif italic text-slate-500 pt-4">
                    A Jardim da Crença
                  </p>
                </div>

                <div className="relative z-10 pt-8 flex items-center justify-between border-t border-slate-200 text-xs font-serif italic text-slate-700">
                  <span>Rachide</span>
                  <span className="font-sans font-bold text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded">PDF</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* STATS BANNER (MATCHING UPLOADED DESIGN 4 COLUMNS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 rounded-2xl bg-[#0b0d18] border border-white/10 text-white">
        
        <div className="flex items-center gap-3.5 p-2 sm:p-3 rounded-xl bg-white/[0.02]">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white leading-tight">10.000+</div>
            <div className="text-xs text-gray-400 font-medium">Obras disponíveis</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-2 sm:p-3 rounded-xl bg-white/[0.02]">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white leading-tight">5.000+</div>
            <div className="text-xs text-gray-400 font-medium">Autores nacionais</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-2 sm:p-3 rounded-xl bg-white/[0.02]">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white leading-tight">50.000+</div>
            <div className="text-xs text-gray-400 font-medium">Leitores ativos</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-2 sm:p-3 rounded-xl bg-white/[0.02]">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white leading-tight">100%</div>
            <div className="text-xs text-gray-400 font-medium">Acesso gratuito</div>
          </div>
        </div>

      </div>

    </div>
  );
};


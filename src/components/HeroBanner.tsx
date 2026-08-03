import React, { useState, useEffect } from 'react';
import { BookOpen, Star, BookMarked, Users, Shield, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { Book, User } from '../types';

interface HeroBannerProps {
  featuredBook?: Book;
  currentUser: User | null;
  onReadBook: (book: Book) => void;
  onOpenDetails?: (book: Book, tab?: 'reviews' | 'comments') => void;
  onOpenAdmin: () => void;
  totalBooksCount: number;
  onShare?: (book: Book) => void;
}

interface SlideItem {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  bgUrl: string;
  coverUrl?: string;
  isSpecialCover?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredBook,
  currentUser,
  onReadBook,
  onOpenDetails,
  onOpenAdmin,
  totalBooksCount,
  onShare
}) => {
  const slides: SlideItem[] = [
    {
      id: 'madrasta',
      title: 'A MADRASTA',
      author: 'Ofélio Faustino',
      synopsis: 'Um drama envolvente sobre amor, família e os desafios que transformam destinos.',
      bgUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop', // Floresta mística
      isSpecialCover: true
    },
    {
      id: 'lagrimas',
      title: 'LÁGRIMAS DO SILÊNCIO',
      author: 'Maria Sousa',
      synopsis: 'Uma jornada profunda sobre mistérios do passado, segredos guardados e a coragem de recomeçar.',
      bgUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1920&auto=format&fit=crop', // Biblioteca antiga
      coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 'ecos',
      title: 'ECOS DA ALMA',
      author: 'João Mendes',
      synopsis: 'Uma travessia poética entre o silêncio da noite e os mistérios esquecidos da alma humana.',
      bgUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop', // Noite e montanhas
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 'caminho',
      title: 'O CAMINHO DA LUZ',
      author: 'Ana Paula',
      synopsis: 'Um conto inspirador sobre esperança, destino e os caminhos iluminados da superação pessoal.',
      bgUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop', // Jardim / Floresta iluminada
      coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=800&auto=format&fit=crop'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[activeSlide];

  const displayBook: Book = featuredBook || {
    id: currentSlide.id,
    title: currentSlide.title,
    author: currentSlide.author,
    synopsis: currentSlide.synopsis,
    category: 'Drama',
    coverUrl: currentSlide.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadCount: 1420,
    ratingAverage: 4.9,
    ratingCount: 38
  } as Book;

  return (
    <div className="space-y-6 my-2">
      
      {/* MAIN HERO SECTION WITH CINEMATIC BACKGROUND AND ROTATION */}
      <section className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800/60 shadow-xl group">
        
        {/* CINEMATIC BACKGROUND IMAGE WITH OVERLAYS */}
        <div className="absolute inset-0 z-0 transition-opacity duration-1000">
          <img 
            src={currentSlide.bgUrl} 
            alt="Cenário de fundo" 
            className="w-full h-full object-cover object-center filter brightness-[0.40] transition-transform duration-1000 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/95 to-[#07090e]/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-[#07090e]/40"></div>
        </div>

        {/* NAVIGATION CHEVRON BUTTONS */}
        <button 
          onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
          className="absolute left-1 sm:left-3 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-amber-400 hover:bg-black/90 transition-all backdrop-blur-sm cursor-pointer"
          title="Anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button 
          onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-1 sm:right-3 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-amber-400 hover:bg-black/90 transition-all backdrop-blur-sm cursor-pointer"
          title="Próximo"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* BANNER CONTENT - COMPACT FLEX/GRID WITH BOOK ALWAYS ON THE RIGHT */}
        <div className="max-w-7xl mx-auto px-7 sm:px-10 lg:px-12 w-full py-3 sm:py-5 lg:py-6 grid grid-cols-12 gap-2 sm:gap-6 items-center relative z-10">
          
          {/* LEFT COLUMN: TEXT CONTENT */}
          <div className="col-span-7 sm:col-span-8 lg:col-span-7 space-y-1.5 sm:space-y-3 animate-fadeIn">
            <div className="inline-flex items-center space-x-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] sm:text-xs font-bold tracking-wider uppercase">
              <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-amber-400" />
              <span>Destaque</span>
            </div>

            <h1 className="font-serif text-base sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight uppercase line-clamp-1">
              {currentSlide.title}
            </h1>

            <p className="text-xs sm:text-base lg:text-lg text-amber-200/90 font-serif italic line-clamp-1">
              Por <span className="font-semibold text-amber-400">{currentSlide.author}</span>
            </p>

            <p className="text-slate-300 text-[11px] sm:text-xs lg:text-sm max-w-xl leading-snug font-medium line-clamp-1 sm:line-clamp-2 hidden xs:block">
              {currentSlide.synopsis}
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 pt-0.5 sm:pt-1">
              <button 
                onClick={() => onReadBook(displayBook)}
                className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-extrabold text-[10px] sm:text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Ler agora</span>
              </button>
              
              <button 
                onClick={() => onOpenDetails?.(displayBook, 'reviews')}
                className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#131b2e]/80 border border-amber-500/40 text-amber-300 font-bold text-[10px] sm:text-xs hover:bg-amber-500/10 transition-all backdrop-blur-sm cursor-pointer"
              >
                Detalhes
              </button>

              <button 
                onClick={() => onShare ? onShare(displayBook) : null}
                className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-cyan-500/20 hover:bg-cyan-500 border border-cyan-500/40 text-cyan-300 hover:text-black font-bold text-[10px] sm:text-xs transition-all backdrop-blur-sm cursor-pointer flex items-center gap-1"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Partilhar</span>
              </button>
            </div>

            {/* CAROUSEL INDICATORS */}
            <div className="flex items-center space-x-1.5 pt-1 sm:pt-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1 rounded-full transition-all cursor-pointer ${
                    activeSlide === idx ? 'w-6 sm:w-8 bg-amber-400' : 'w-3 sm:w-5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: BOOK DISPLAY (ALWAYS ON THE RIGHT SIDE) */}
          <div className="col-span-5 sm:col-span-4 lg:col-span-5 flex justify-end">
            <div 
              onClick={() => onReadBook(displayBook)}
              className="relative w-24 sm:w-40 md:w-48 lg:w-52 aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden shadow-xl shadow-black/80 border border-white/10 transform rotate-1 hover:rotate-0 transition-all duration-500 cursor-pointer group/cover shrink-0"
            >
              {currentSlide.isSpecialCover ? (
                /* MADRASTA 3D FLORAL COVER */
                <div className="w-full h-full bg-slate-100 p-2 sm:p-4 text-slate-900 flex flex-col justify-between border-r-4 sm:border-r-6 border-slate-300 relative">
                  <div className="absolute top-1 right-1 opacity-15 pointer-events-none text-slate-900">
                    <svg width="50" height="70" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M10 100 Q 30 50 80 10" />
                      <circle cx="80" cy="10" r="8" />
                    </svg>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 pt-0.5">
                    <h2 className="font-serif font-black text-[11px] sm:text-base lg:text-xl tracking-tight uppercase border-b border-slate-300 pb-0.5 sm:pb-1">
                      A Madrasta
                    </h2>
                    <p className="font-serif italic text-[8px] sm:text-[10px] text-slate-600 line-clamp-1">A sombra do coração</p>
                    <p className="font-serif italic text-[8px] sm:text-[10px] text-slate-500 pt-0.5 line-clamp-1">A Jardim da Crença</p>
                  </div>
                  <div className="border-t border-slate-300 pt-1 flex items-center justify-between text-[8px] sm:text-[10px] font-serif italic text-slate-700">
                    <span>Faustino</span>
                    <span className="font-sans font-bold text-[8px] sm:text-[9px] text-amber-800 bg-amber-100 px-1 py-0.2 rounded">PDF</span>
                  </div>
                </div>
              ) : (
                /* IMAGE COVER */
                <div className="relative w-full h-full">
                  <img 
                    src={currentSlide.coverUrl || displayBook.coverUrl} 
                    alt={currentSlide.title} 
                    className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 sm:p-3">
                    <span className="text-[8px] sm:text-[10px] text-amber-400 font-bold tracking-wider uppercase">Destaque</span>
                    <h3 className="font-serif text-white text-[10px] sm:text-sm font-bold line-clamp-1">{currentSlide.title}</h3>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ESTATÍSTICAS SECTION (4 CARDS MATCHING DESIGN IMAGE) */}
      <section className="border-t border-b border-slate-800/40 bg-[#0b0f17] rounded-xl sm:rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            
            <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-[#0f1420] border border-slate-800/60">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base sm:text-xl shrink-0">
                <BookMarked className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-xl font-bold text-white font-serif">10.000+</h4>
                <p className="text-[10px] sm:text-xs text-slate-400">Obras disponíveis</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-[#0f1420] border border-slate-800/60">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base sm:text-xl shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-xl font-bold text-white font-serif">5.000+</h4>
                <p className="text-[10px] sm:text-xs text-slate-400">Autores nacionais</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-[#0f1420] border border-slate-800/60">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base sm:text-xl shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-xl font-bold text-white font-serif">50.000+</h4>
                <p className="text-[10px] sm:text-xs text-slate-400">Leitores ativos</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-[#0f1420] border border-slate-800/60">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base sm:text-xl shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-xl font-bold text-white font-serif">100%</h4>
                <p className="text-[10px] sm:text-xs text-slate-400">Acesso gratuito</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};



import React, { useState, useEffect } from 'react';
import { BookOpen, Star, BookMarked, Users, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Book, User } from '../types';

interface HeroBannerProps {
  featuredBook?: Book;
  currentUser: User | null;
  onReadBook: (book: Book) => void;
  onOpenDetails?: (book: Book, tab?: 'reviews' | 'comments') => void;
  onOpenAdmin: () => void;
  totalBooksCount: number;
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
  totalBooksCount
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
      <section className="relative min-h-[240px] sm:min-h-[340px] lg:min-h-[400px] flex items-center overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/60 shadow-2xl group">
        
        {/* CINEMATIC BACKGROUND IMAGE WITH OVERLAYS */}
        <div className="absolute inset-0 z-0 transition-opacity duration-1000">
          <img 
            src={currentSlide.bgUrl} 
            alt="Cenário de fundo" 
            className="w-full h-full object-cover object-center filter brightness-[0.45] transition-transform duration-1000 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-[#07090e]/50"></div>
        </div>

        {/* NAVIGATION CHEVRON BUTTONS */}
        <button 
          onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
          className="absolute left-2 sm:left-4 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/80 hover:text-amber-400 hover:bg-black/80 transition-all backdrop-blur-sm cursor-pointer"
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button 
          onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-2 sm:right-4 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/80 hover:text-amber-400 hover:bg-black/80 transition-all backdrop-blur-sm cursor-pointer"
          title="Próximo"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* BANNER CONTENT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 w-full py-4 sm:py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center relative z-10">
          
          {/* LEFT COLUMN: TEXT CONTENT */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 lg:space-y-5 animate-fadeIn">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-bold tracking-wider uppercase">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400" />
              <span>Destaque da semana</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1] uppercase">
              {currentSlide.title}
            </h1>

            <p className="text-sm sm:text-lg lg:text-xl text-amber-200/90 font-serif italic">
              Por <span className="font-semibold text-amber-400">{currentSlide.author}</span>
            </p>

            <p className="text-slate-300 text-xs sm:text-sm lg:text-base max-w-xl leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
              {currentSlide.synopsis}
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pt-1 sm:pt-2">
              <button 
                onClick={() => onReadBook(displayBook)}
                className="px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-extrabold text-xs sm:text-sm flex items-center space-x-2 sm:space-x-3 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Ler agora</span>
              </button>
              
              <button 
                onClick={() => onOpenDetails?.(displayBook, 'reviews')}
                className="px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl bg-[#131b2e]/80 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm hover:bg-amber-500/10 transition-all backdrop-blur-sm cursor-pointer"
              >
                Ver detalhes
              </button>
            </div>

            {/* CAROUSEL INDICATORS */}
            <div className="flex items-center space-x-2 pt-2 sm:pt-3">
              {slides.map((_, idx) => (
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

          {/* RIGHT COLUMN: BOOK DISPLAY */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div 
              onClick={() => onReadBook(displayBook)}
              className="relative w-32 sm:w-52 md:w-60 lg:w-64 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 transform rotate-1 hover:rotate-0 transition-all duration-500 cursor-pointer group/cover"
            >
              {currentSlide.isSpecialCover ? (
                /* MADRASTA 3D FLORAL COVER */
                <div className="w-full h-full bg-slate-100 p-3 sm:p-5 text-slate-900 flex flex-col justify-between border-r-6 sm:border-r-8 border-slate-300 relative">
                  <div className="absolute top-2 right-2 opacity-15 pointer-events-none text-slate-900">
                    <svg width="80" height="100" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M10 100 Q 30 50 80 10" />
                      <circle cx="80" cy="10" r="8" />
                    </svg>
                  </div>
                  <div className="space-y-1 sm:space-y-2 pt-1">
                    <h2 className="font-serif font-black text-sm sm:text-xl lg:text-2xl tracking-tight uppercase border-b border-slate-300 pb-1 sm:pb-2">
                      A Madrasta
                    </h2>
                    <p className="font-serif italic text-[10px] sm:text-xs text-slate-600">A sombra do coração</p>
                    <p className="font-serif italic text-[10px] sm:text-xs text-slate-500 pt-1 sm:pt-2">A Jardim da Crença</p>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5 sm:pt-3 flex items-center justify-between text-[10px] sm:text-xs font-serif italic text-slate-700">
                    <span>Rachide</span>
                    <span className="font-sans font-bold text-[9px] sm:text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">PDF</span>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-5">
                    <span className="text-[10px] sm:text-xs text-amber-400 font-bold tracking-wider uppercase">Destaque Especial</span>
                    <h3 className="font-serif text-white text-sm sm:text-lg font-bold">{currentSlide.title}</h3>
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



import React, { useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Book } from '../types';

interface DestaquesSectionProps {
  books: Book[];
  theme?: 'dark' | 'light' | 'lite';
  onReadBook: (book: Book) => void;
  onOpenDetails: (book: Book, tab?: 'reviews' | 'comments') => void;
  onSelectCategory: (categorySlug: string) => void;
}

export const DestaquesSection: React.FC<DestaquesSectionProps> = ({
  books,
  theme = 'dark',
  onReadBook,
  onOpenDetails,
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 my-10 relative">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-extrabold tracking-tight ${
          theme === 'light' ? 'text-slate-950' : 'text-white'
        }`}>
          Destaques
        </h3>
        <button 
          onClick={() => onSelectCategory('todas')}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CAROUSEL CONTAINER WITH ARROWS */}
      <div className="relative group">
        
        {/* LEFT ARROW BUTTON */}
        <button
          onClick={scrollLeft}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 border border-white/20 text-white hover:border-amber-400 hover:text-amber-400 flex items-center justify-center transition-all shadow-xl cursor-pointer"
          title="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* RIGHT ARROW BUTTON */}
        <button
          onClick={scrollRight}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 border border-white/20 text-white hover:border-amber-400 hover:text-amber-400 flex items-center justify-center transition-all shadow-xl cursor-pointer"
          title="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* HORIZONTAL CAROUSEL GRID */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
        >
          {books.slice(0, 8).map((book) => {
            const isMadrasta = book.title.toLowerCase().includes('madrasta');

            return (
              <div
                key={book.id}
                onClick={() => onOpenDetails(book)}
                className={`min-w-[210px] max-w-[230px] rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between group/card ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 hover:border-amber-400 shadow-md'
                    : 'bg-[#0a0c16] border-white/10 hover:border-amber-500/50 shadow-xl'
                }`}
              >
                {/* BOOK COVER CONTAINER */}
                <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                  
                  {isMadrasta ? (
                    /* SPECIAL COVER DISPLAY FOR A MADRASTA MATCHING REFERENCE IMAGE */
                    <div className="w-full h-full bg-slate-100 p-4 text-slate-900 flex flex-col justify-between border-r-4 border-slate-300">
                      <div className="space-y-1.5 pt-2">
                        <h4 className="font-serif font-black text-lg tracking-tight uppercase leading-none border-b border-slate-300 pb-1">
                          A Madrasta
                        </h4>
                        <p className="font-serif italic text-[10px] text-slate-600">A sombra do coração</p>
                        <p className="font-serif italic text-[9px] text-slate-500 pt-1">A Jardim da Crença</p>
                      </div>
                      <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[10px] font-serif italic text-slate-700">
                        <span>Rachide</span>
                        <span className="font-sans font-bold text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">PDF</span>
                      </div>
                    </div>
                  ) : (
                    /* STANDARD IMAGE COVER */
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* DESTAQUE AMBER BADGE ON COVER (IF MADRASTA / FEATURED) */}
                  {(book.isFeatured || isMadrasta) && (
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-amber-500 text-black font-extrabold text-[10px] shadow-lg tracking-wide uppercase">
                      Destaque
                    </div>
                  )}

                  {/* DARK GRADIENT OVERLAY */}
                  {!isMadrasta && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/card:opacity-40 transition-opacity" />
                  )}
                </div>

                {/* CARD CONTENT INFO */}
                <div className="p-3.5 space-y-1 bg-[#090b14]">
                  {/* RATING */}
                  <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{book.ratingAverage ? book.ratingAverage.toFixed(1) : '4.9'}</span>
                  </div>

                  {/* TITLE */}
                  <h4 className="font-bold text-sm text-white truncate group-hover/card:text-amber-400 transition-colors">
                    {book.title}
                  </h4>

                  {/* AUTHOR */}
                  <p className="text-xs text-gray-400 truncate font-medium">
                    {book.author}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

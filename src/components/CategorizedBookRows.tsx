import React, { useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, ArrowRight, Layers, Sparkles, Heart, Feather, Globe, ShieldAlert, BookOpen, Cpu } from 'lucide-react';
import { Book } from '../types';

interface CategorizedBookRowsProps {
  books: Book[];
  theme?: 'dark' | 'light' | 'lite';
  onReadBook: (book: Book) => void;
  onOpenDetails: (book: Book, tab?: 'reviews' | 'comments' | 'chapters') => void;
  onSelectCategory: (categorySlug: string) => void;
}

interface CategoryGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  categorySlug: string;
  filterFn: (b: Book) => boolean;
}

export const CategorizedBookRows: React.FC<CategorizedBookRowsProps> = ({
  books,
  theme = 'dark',
  onReadBook,
  onOpenDetails,
  onSelectCategory,
}) => {
  // Define the category row sections to present in the feed
  const categoryGroups: CategoryGroup[] = [
    {
      id: 'em_lancamento',
      title: 'Obras em Lançamento (Capítulos em Série)',
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
      categorySlug: 'todas',
      filterFn: (b) => b.status === 'em_lancamento' || Boolean(b.chapters && b.chapters.length > 0)
    },
    {
      id: 'destaques',
      title: 'Destaques & Mais Lidos',
      icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" />,
      categorySlug: 'todas',
      filterFn: (b) => Boolean(b.isFeatured || (b.downloadCount && b.downloadCount > 100))
    },
    {
      id: 'drama_romance',
      title: 'Drama & Romance',
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      categorySlug: 'drama',
      filterFn: (b) => {
        const cat = (b.category || '').toLowerCase();
        return cat.includes('drama') || cat.includes('romance');
      }
    },
    {
      id: 'ficcao_suspense',
      title: 'Ficção Científica & Thriller',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      categorySlug: 'ficcao',
      filterFn: (b) => {
        const cat = (b.category || '').toLowerCase();
        return cat.includes('ficção') || cat.includes('thriller') || cat.includes('suspense');
      }
    },
    {
      id: 'poesia_ensaio',
      title: 'Poesia & Ensaios Líricos',
      icon: <Feather className="w-5 h-5 text-amber-300" />,
      categorySlug: 'poesia',
      filterFn: (b) => {
        const cat = (b.category || '').toLowerCase();
        return cat.includes('poesia') || cat.includes('ensaio') || cat.includes('lírica');
      }
    },
    {
      id: 'historia_cultura',
      title: 'História, Cultura & Sociedade',
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
      categorySlug: 'historia',
      filterFn: (b) => {
        const cat = (b.category || '').toLowerCase();
        return cat.includes('história') || cat.includes('cultura') || cat.includes('sociedade');
      }
    }
  ];

  return (
    <div className="space-y-10 my-6">
      {categoryGroups.map((group) => {
        // Filter books for this category group
        let filtered = books.filter(group.filterFn);
        
        // If no specific books matched, show fallback selection from main catalog
        if (filtered.length === 0) {
          filtered = books.slice(0, 6);
        }

        return (
          <RowCategorySection
            key={group.id}
            group={group}
            books={filtered}
            theme={theme}
            onOpenDetails={onOpenDetails}
            onSelectCategory={onSelectCategory}
          />
        );
      })}
    </div>
  );
};

// Subcomponent for each individual category horizontal row
const RowCategorySection: React.FC<{
  group: CategoryGroup;
  books: Book[];
  theme: 'dark' | 'light' | 'lite';
  onOpenDetails: (book: Book, tab?: 'reviews' | 'comments' | 'chapters') => void;
  onSelectCategory: (categorySlug: string) => void;
}> = ({ group, books, theme, onOpenDetails, onSelectCategory }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3 relative group/section">
      {/* CATEGORY HEADER ROW */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
            {group.icon}
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-extrabold font-serif tracking-tight ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              {group.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400">
              {books.length} {books.length === 1 ? 'obra disponível' : 'obras nesta coleção'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onSelectCategory(group.categorySlug)}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-all hover:translate-x-0.5"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* HORIZONTAL CAROUSEL CONTAINER WITH NAVIGATION BUTTONS */}
      <div className="relative group/carousel">
        {/* SCROLL LEFT BUTTON */}
        <button
          onClick={scrollLeft}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/80 border border-white/20 text-white hover:border-amber-400 hover:text-amber-400 flex items-center justify-center transition-all shadow-xl cursor-pointer backdrop-blur-md opacity-80 hover:opacity-100"
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* SCROLL RIGHT BUTTON */}
        <button
          onClick={scrollRight}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/80 border border-white/20 text-white hover:border-amber-400 hover:text-amber-400 flex items-center justify-center transition-all shadow-xl cursor-pointer backdrop-blur-md opacity-80 hover:opacity-100"
          title="Próximo"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* INFINITE HORIZONTAL SCROLL LIST */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
        >
          {books.map((book) => {
            const isMadrasta = book.title.toLowerCase().includes('madrasta');
            const isSerial = book.status === 'em_lancamento' || Boolean(book.chapters && book.chapters.length > 0);

            return (
              <div
                key={book.id}
                onClick={() => onOpenDetails(book, isSerial ? 'chapters' : 'reviews')}
                className={`min-w-[160px] sm:min-w-[200px] max-w-[170px] sm:max-w-[210px] rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between group/card shrink-0 ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 hover:border-amber-400 shadow-md'
                    : 'bg-[#0a0c16] border-white/10 hover:border-amber-500/50 shadow-xl'
                }`}
              >
                {/* BOOK COVER DISPLAY */}
                <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                  {isMadrasta ? (
                    <div className="w-full h-full bg-slate-100 p-3 sm:p-4 text-slate-900 flex flex-col justify-between border-r-4 border-slate-300">
                      <div className="space-y-1 pt-1 sm:pt-2">
                        <h4 className="font-serif font-black text-xs sm:text-base tracking-tight uppercase leading-none border-b border-slate-300 pb-1">
                          A Madrasta
                        </h4>
                        <p className="font-serif italic text-[9px] sm:text-[10px] text-slate-600">A sombra do coração</p>
                        <p className="font-serif italic text-[8px] sm:text-[9px] text-slate-500 pt-0.5">A Jardim da Crença</p>
                      </div>
                      <div className="border-t border-slate-300 pt-1.5 flex items-center justify-between text-[8px] sm:text-[10px] font-serif italic text-slate-700">
                        <span>Faustino</span>
                        <span className="font-sans font-bold text-[8px] text-amber-800 bg-amber-100 px-1 py-0.2 rounded">PDF</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* BADGES ON COVER */}
                  {isSerial && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-black font-extrabold text-[9px] shadow-lg tracking-wide uppercase flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      <span>Em Lançamento</span>
                    </div>
                  )}

                  {(book.isFeatured || isMadrasta) && !isSerial && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-black font-extrabold text-[9px] shadow-lg tracking-wide uppercase">
                      Destaque
                    </div>
                  )}
                </div>

                {/* CARD INFO */}
                <div className="p-2.5 sm:p-3 space-y-1 bg-[#090b14] border-t border-white/5">
                  <div className="flex items-center justify-between gap-1 text-amber-400 font-extrabold text-[11px] sm:text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{book.ratingAverage ? book.ratingAverage.toFixed(1) : '4.9'}</span>
                    </div>
                    {isSerial && (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {book.chapters?.length || 1} cap.
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover/card:text-amber-400 transition-colors">
                    {book.title}
                  </h4>

                  <p className="text-[10px] sm:text-xs text-gray-400 truncate font-medium">
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

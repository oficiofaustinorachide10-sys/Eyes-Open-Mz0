import React from 'react';
import { BookOpen, Download, Star, Heart, FileText, Share2, Calendar, MessageSquare } from 'lucide-react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  isFavorite: boolean;
  onRead: (book: Book) => void;
  onDownload: (book: Book) => void;
  onToggleFavorite: (bookId: string) => void;
  onOpenDetails: (book: Book, initialTab?: 'reviews' | 'comments') => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isFavorite,
  onRead,
  onDownload,
  onToggleFavorite,
  onOpenDetails
}) => {
  return (
    <div className="group relative bg-[#151722] rounded-2xl border border-amber-500/20 hover:border-amber-400/60 transition-all duration-300 overflow-hidden shadow-xl flex flex-col justify-between hover:-translate-y-1">
      
      {/* COVER IMAGE & OVERLAY */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0d0e14]">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-transparent to-black/30 opacity-80" />

        {/* CATEGORY BADGE */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md">
          {book.category}
        </div>

        {/* FAVORITE TOGGLE BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(book.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
            isFavorite 
              ? 'bg-rose-500/90 text-white shadow-lg' 
              : 'bg-black/50 text-gray-300 hover:text-white hover:bg-black/80'
          }`}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* RATING BADGE & CLICK TO VIEW REVIEWS */}
        <button
          onClick={() => onOpenDetails(book, 'reviews')}
          className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-black/90 transition-all cursor-pointer"
          title="Ver Avaliações"
        >
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{book.ratingAverage ? book.ratingAverage.toFixed(1) : '5.0'}</span>
          <span className="text-gray-400 text-[10px]">({book.ratingCount || 1})</span>
        </button>

        {/* COMMENTS BADGE & CLICK TO VIEW COMMENTS */}
        <button
          onClick={() => onOpenDetails(book, 'comments')}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-black/90 transition-all cursor-pointer"
          title="Ver Comentários"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Comentários</span>
        </button>

        {/* HOVER QUICK READ OVERLAY BUTTON */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-4 gap-2">
          <button
            onClick={() => onRead(book)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ler</span>
          </button>
          <button
            onClick={() => onOpenDetails(book, 'comments')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e202d] border border-amber-500/40 text-amber-300 font-bold text-xs shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comentar</span>
          </button>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h3 
            onClick={() => onOpenDetails(book, 'reviews')}
            className="font-bold text-white text-base hover:text-amber-300 cursor-pointer line-clamp-1 transition-colors"
          >
            {book.title}
          </h3>
          <p className="text-xs text-amber-200/80 font-medium line-clamp-1">
            {book.author}
          </p>
          <p className="text-[11px] text-gray-400 line-clamp-2 pt-1 leading-relaxed">
            {book.synopsis}
          </p>
        </div>

        {/* METADATA FOOTER & ACTIONS */}
        <div className="pt-3 border-t border-amber-500/10 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Download className="w-3.5 h-3.5" />
              {book.downloadCount || 0} downloads
            </span>

            {book.publishedYear && (
              <span className="flex items-center gap-1 text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-amber-500/60" />
                {book.publishedYear}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onRead(book)}
              className="py-2 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-black font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Ler PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ler</span>
            </button>

            <button
              onClick={() => onOpenDetails(book, 'comments')}
              className="py-2 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Abrir Comentários"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Opinar</span>
            </button>

            <button
              onClick={() => onDownload(book)}
              className="py-2 px-2 rounded-xl bg-[#1e202d] hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Baixar PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

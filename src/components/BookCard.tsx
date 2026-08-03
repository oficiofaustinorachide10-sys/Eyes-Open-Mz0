import React, { useState } from 'react';
import { BookOpen, Download, Star, Heart, FileText, Share2, Calendar, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  isFavorite: boolean;
  theme?: 'dark' | 'light' | 'lite';
  viewMode?: 'grid' | 'list';
  onRead: (book: Book) => void;
  onDownload: (book: Book) => void;
  onToggleFavorite: (bookId: string) => void;
  onOpenDetails: (book: Book, initialTab?: 'reviews' | 'comments') => void;
  onShare?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isFavorite,
  theme = 'dark',
  viewMode = 'grid',
  onRead,
  onDownload,
  onToggleFavorite,
  onOpenDetails,
  onShare
}) => {
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  // LIST VIEW LAYOUT (Lite / Custom List Mode)
  if (viewMode === 'list') {
    return (
      <div className={`group relative rounded-2xl border transition-all duration-300 p-4 shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
        theme === 'light'
          ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900'
          : theme === 'lite'
          ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-400 text-emerald-50 shadow-emerald-500/10'
          : 'bg-[#151722] border-amber-500/20 hover:border-amber-400/60 text-white'
      }`}>
        <div className="flex items-center gap-4 w-full md:w-auto flex-1">
          {/* COVER THUMBNAIL */}
          <div 
            onClick={() => onRead(book)}
            className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-black/40 cursor-pointer group-hover:scale-105 transition-transform"
          >
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-black text-amber-300">
              {book.category}
            </span>
          </div>

          {/* BOOK DETAILS */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 
                onClick={() => onOpenDetails(book, 'reviews')}
                className={`font-bold text-base hover:underline cursor-pointer truncate ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}
              >
                {book.title}
              </h3>

              {book.status === 'em_lancamento' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold uppercase">
                  Em Lançamento {book.latestChapterNumber ? `• Cap. ${book.latestChapterNumber}` : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-extrabold uppercase">
                  Completo
                </span>
              )}
            </div>

            <p className={`text-xs font-medium ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>
              Por {book.author}
            </p>

            {/* SYNOPSIS - CLICKABLE */}
            <div 
              onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
              className="cursor-pointer group/syn"
              title="Clique para ler o texto completo"
            >
              <p className={`text-[11px] leading-relaxed transition-all ${
                isSynopsisExpanded 
                  ? (theme === 'light' ? 'text-slate-800' : 'text-amber-100')
                  : (theme === 'light' ? 'text-slate-600 line-clamp-1' : 'text-gray-400 line-clamp-1')
              }`}>
                {book.synopsis}
              </p>
              <span className="text-[10px] font-extrabold text-amber-400 inline-flex items-center gap-0.5 pt-0.5 hover:underline">
                {isSynopsisExpanded ? 'Ver menos' : 'Ler texto completo'}
              </span>
            </div>

            {/* RATING & COMMENTS SHORTCUT */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <button
                onClick={() => onOpenDetails(book, 'reviews')}
                className="flex items-center gap-1 font-bold text-amber-400 hover:underline cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{book.ratingAverage ? book.ratingAverage.toFixed(1) : '5.0'}</span>
                <span className="text-[10px] text-gray-400">({book.ratingCount || 1} avaliações)</span>
              </button>

              <button
                onClick={() => onOpenDetails(book, 'comments')}
                className="flex items-center gap-1 font-bold text-amber-300 hover:underline cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comentários</span>
              </button>

              <span className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                <Download className="w-3 h-3" />
                {book.downloadCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS ROW */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/10 shrink-0">
          <button
            onClick={() => onToggleFavorite(book.id)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isFavorite 
                ? 'bg-rose-500 text-white border-rose-400' 
                : (theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-[#1a1d2e] border-amber-500/20 text-gray-400')
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
          </button>

          <button
            onClick={() => onRead(book)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ler PDF</span>
          </button>

          <button
            onClick={() => onDownload(book)}
            className="px-3 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-black border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar</span>
          </button>
        </div>
      </div>
    );
  }

  // STANDARD GRID VIEW LAYOUT
  return (
    <div className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden shadow-xl flex flex-col justify-between hover:-translate-y-1 ${
      theme === 'light'
        ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900 shadow-slate-200'
        : theme === 'lite'
        ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-400 text-emerald-50 shadow-emerald-500/10'
        : 'bg-[#151722] border-amber-500/20 hover:border-amber-400/60 text-white'
    }`}>
      
      {/* COVER IMAGE & OVERLAY */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0d0e14]">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-t via-transparent opacity-80 ${
          theme === 'light' ? 'from-white/90 to-black/20' : 'from-[#151722] to-black/30'
        }`} />

        {/* CATEGORY & WORK STATUS BADGE */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md">
            {book.category}
          </span>

          {book.status === 'em_lancamento' ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1">
              <span>Em Lançamento</span>
              {book.latestChapterNumber && <span>• Cap. {book.latestChapterNumber}</span>}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-md">
              Completo
            </span>
          )}
        </div>

        {/* FAVORITE TOGGLE BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(book.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
            isFavorite 
              ? 'bg-rose-500 text-white shadow-lg' 
              : 'bg-black/50 text-gray-300 hover:text-white hover:bg-black/80'
          }`}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* RATING BADGE & CLICK TO VIEW REVIEWS */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(book, 'reviews');
          }}
          className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all cursor-pointer shadow-lg group/star"
          title="Ver Avaliações e pessoas que avaliaram"
        >
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover/star:text-black group-hover/star:fill-black" />
          <span>{book.ratingAverage ? book.ratingAverage.toFixed(1) : '5.0'}</span>
          <span className="text-gray-400 group-hover/star:text-black/80 text-[10px]">({book.ratingCount || 1})</span>
        </button>

        {/* COMMENTS BADGE & CLICK TO VIEW COMMENTS */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(book, 'comments');
          }}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all cursor-pointer shadow-lg group/comment"
          title="Ver Comentários da obra"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400 group-hover/comment:text-black" />
          <span>Comentários</span>
        </button>

        {/* HOVER QUICK READ OVERLAY BUTTON */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-4 gap-2">
          <button
            onClick={() => onRead(book)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ler PDF</span>
          </button>
          <button
            onClick={() => onOpenDetails(book, 'comments')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e202d] border border-amber-500/40 text-amber-300 font-bold text-xs shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Comentar</span>
          </button>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h3 
            onClick={() => onOpenDetails(book, 'reviews')}
            className={`font-bold text-base hover:text-amber-500 cursor-pointer line-clamp-1 transition-colors ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            {book.title}
          </h3>
          <p className={`text-xs font-medium line-clamp-1 ${
            theme === 'light' ? 'text-amber-800' : 'text-amber-200/80'
          }`}>
            Por {book.author}
          </p>

          {/* SYNOPSIS TEXT - CLICK TO EXPAND / SHOW IN FULL */}
          <div 
            onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
            className="pt-1 group/synopsis cursor-pointer"
            title="Clique para ver o texto completo da publicação"
          >
            <p className={`text-[11px] leading-relaxed transition-all ${
              isSynopsisExpanded 
                ? (theme === 'light' ? 'text-slate-800' : 'text-amber-100') 
                : (theme === 'light' ? 'text-slate-600 line-clamp-2' : 'text-gray-400 group-hover/synopsis:text-gray-200 line-clamp-2')
            }`}>
              {book.synopsis}
            </p>
            <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-0.5 pt-0.5 hover:underline">
              {isSynopsisExpanded ? (
                <><span>Ver menos</span><ChevronUp className="w-3 h-3" /></>
              ) : (
                <><span>Ler texto completo</span><ChevronDown className="w-3 h-3" /></>
              )}
            </span>
          </div>
        </div>

        {/* METADATA FOOTER & ACTIONS */}
        <div className={`pt-3 border-t space-y-3 ${
          theme === 'light' ? 'border-slate-200' : 'border-amber-500/10'
        }`}>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <Download className="w-3.5 h-3.5" />
              {book.downloadCount || 0} downloads
            </span>

            {book.publishedYear && (
              <span className="flex items-center gap-1 text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                {book.publishedYear}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => onRead(book)}
              className="py-2 px-1 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-500 hover:text-black font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Ler PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ler</span>
            </button>

            <button
              onClick={() => onOpenDetails(book, 'comments')}
              className="py-2 px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Abrir Comentários"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Opinar</span>
            </button>

            <button
              onClick={() => onDownload(book)}
              className="py-2 px-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Baixar PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar</span>
            </button>

            <button
              onClick={() => onShare ? onShare(book) : null}
              className="py-2 px-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/30 text-cyan-400 hover:text-black font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Partilhar Obra"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partilhar</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

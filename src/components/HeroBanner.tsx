import React, { useState } from 'react';
import { BookOpen, Sparkles, Download, Shield, FileText, ArrowRight, Star, PlusCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isBannerTextExpanded, setIsBannerTextExpanded] = useState(false);
  const isPublisher = currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#12141f] via-[#1a1c29] to-[#12141f] border border-amber-500/30 p-6 sm:p-10 my-6 shadow-2xl">
      {/* BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN - BRAND & DESCRIPTION */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Plataforma Oficial de Publicação & Leitura</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-serif leading-tight">
            Descubra & Leia Obras Literárias em <span className="text-amber-400 italic">PDF</span>
          </h2>

          {/* PUBLICATION TEXT - CLICKABLE TO SHOW FULLY */}
          <div 
            onClick={() => setIsBannerTextExpanded(!isBannerTextExpanded)}
            className="cursor-pointer group/heroText space-y-1"
            title="Clique para ler a apresentação completa"
          >
            <p className={`text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed transition-all ${
              isBannerTextExpanded ? 'text-amber-100' : 'line-clamp-3 group-hover/heroText:text-white'
            }`}>
              Bem-vindo ao <strong className="text-amber-300 font-bold">Ala X</strong>, a sua biblioteca virtual aberta para exploração, leitura online de PDF, download instantâneo e avaliação crítica de romances, thrillers, poesias e ensaios.
            </p>
            <span className="text-xs font-extrabold text-amber-400 inline-flex items-center gap-1 hover:underline pt-0.5">
              {isBannerTextExpanded ? (
                <><span>Recolher texto</span><ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <><span>Ler texto de apresentação completo</span><ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </span>
          </div>

          {/* QUICK STATS BADGES */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181a26] border border-amber-500/20 text-gray-300">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span><strong className="text-white font-extrabold">{totalBooksCount}</strong> Obras Publicadas</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181a26] border border-amber-500/20 text-gray-300">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Downloads Ilimitados</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181a26] border border-amber-500/20 text-gray-300">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Plataforma Segura</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            {featuredBook && (
              <>
                <button
                  onClick={() => onReadBook(featuredBook)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ler Destaque: {featuredBook.title}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                {onOpenDetails && (
                  <button
                    onClick={() => onOpenDetails(featuredBook, 'reviews')}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#181a26] border border-amber-500/30 text-amber-300 hover:text-white font-semibold text-xs sm:text-sm hover:border-amber-400/60 transition-all cursor-pointer"
                    title="Ver Avaliações e Leitores que Avaliaram"
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Avaliações ({featuredBook.ratingCount || 1})</span>
                  </button>
                )}
              </>
            )}

            {isPublisher && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#181a26] border border-amber-500/30 text-amber-300 hover:text-white font-semibold text-xs sm:text-sm hover:border-amber-400/60 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Nova Obra</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - FEATURED BOOK SHOWCASE */}
        {featuredBook && (
          <div className="lg:col-span-5 flex justify-center">
            <div 
              className="group relative w-full max-w-xs"
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-300 opacity-30 group-hover:opacity-75 blur transition duration-500" />
              <div className="relative rounded-2xl bg-[#181a26] p-4 border border-amber-500/40 shadow-2xl space-y-3">
                
                <div 
                  onClick={() => onReadBook(featuredBook)}
                  className="relative h-64 w-full rounded-xl overflow-hidden bg-black/40 cursor-pointer"
                >
                  <img
                    src={featuredBook.coverUrl}
                    alt={featuredBook.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500 text-black font-black text-[10px] uppercase tracking-wider">
                      {featuredBook.category}
                    </span>
                    {featuredBook.status === 'em_lancamento' ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-black font-extrabold text-[9px] uppercase tracking-wider">
                        Em Lançamento {featuredBook.latestChapterNumber ? `• Cap. ${featuredBook.latestChapterNumber}` : ''}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[9px] uppercase tracking-wider">
                        Completo
                      </span>
                    )}
                  </div>

                  {/* STAR BADGE -> DIRECTS TO REVIEWS */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails?.(featuredBook, 'reviews');
                    }}
                    className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-amber-300 text-xs font-extrabold flex items-center gap-1 hover:bg-amber-500 hover:text-black transition-all cursor-pointer border border-amber-500/30"
                    title="Ver Avaliações e pessoas que avaliaram"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{featuredBook.ratingAverage ? featuredBook.ratingAverage.toFixed(1) : '5.0'}</span>
                  </button>

                  {/* COMMENTS BADGE -> DIRECTS TO COMMENTS */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails?.(featuredBook, 'comments');
                    }}
                    className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-amber-300 text-xs font-extrabold flex items-center gap-1 hover:bg-amber-500 hover:text-black transition-all cursor-pointer border border-amber-500/30"
                    title="Ver Comentários"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Comentários</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Obra em Destaque</span>
                  <h3 
                    onClick={() => onOpenDetails?.(featuredBook, 'reviews')}
                    className="font-bold text-white text-base line-clamp-1 group-hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {featuredBook.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-1">Por {featuredBook.author}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-amber-300 font-semibold">
                  <button 
                    onClick={() => onReadBook(featuredBook)}
                    className="flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Abrir no Leitor PDF</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

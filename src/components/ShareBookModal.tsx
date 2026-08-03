import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Send, MessageCircle, Facebook, Globe, Lock, ShieldAlert } from 'lucide-react';
import { Book } from '../types';
import { updateBookMetaTags } from '../lib/metaHelper';

interface ShareBookModalProps {
  book: Book;
  onClose: () => void;
}

export const ShareBookModal: React.FC<ShareBookModalProps> = ({ book, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    updateBookMetaTags(book);
    return () => {
      updateBookMetaTags(null);
    };
  }, [book]);

  // Construct absolute URL with query parameter ?book=ID
  const shareUrl = `${window.location.origin}${window.location.pathname}?book=${book.id}`;
  const shareText = `Confira a obra "${book.title}" por ${book.author} na Ala-X Digital Library:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: shareText,
        url: shareUrl,
      }).catch((e) => console.log('Share dismissed:', e));
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#0f111a] border border-amber-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold font-serif text-white tracking-tight">
              Partilhar Obra
            </h3>
            <p className="text-xs text-slate-400">
              Disseminar cultura e literatura angolana & moçambicana
            </p>
          </div>
        </div>

        {/* BOOK PREVIEW MINI CARD */}
        <div className="p-3 rounded-2xl bg-[#171926] border border-white/5 flex items-center gap-3">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-12 h-16 rounded-xl object-cover border border-amber-500/30 shrink-0 shadow-md"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-amber-200 truncate">{book.title}</h4>
            <p className="text-xs text-gray-400 truncate">Por {book.author}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {book.category}
            </span>
          </div>
        </div>

        {/* DIRECT SHARE BUTTONS (WHATSAPP, FACEBOOK, NATIVE) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Redes Sociais & Mensagens</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleWhatsAppShare}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Facebook className="w-4 h-4 fill-white text-blue-600" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* COPY LINK INPUT FIELD */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Link Direto da Obra</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#171926] border border-amber-500/30 rounded-2xl px-3.5 py-2.5 text-xs text-amber-100 font-mono outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* NATIVE SHARE BUTTON FOR MOBILE DEVICES */}
        {Boolean(typeof navigator !== 'undefined' && navigator.share) && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Outras Aplicações do Telemóvel</span>
          </button>
        )}

        {/* ACCESS SECURITY NOTE */}
        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5 text-[11px] text-amber-200/90 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Visitantes sem conta poderão abrir o link e ver a sinopse. As opções de leitura, download e avaliação requerem início de sessão.
          </p>
        </div>
      </div>
    </div>
  );
};

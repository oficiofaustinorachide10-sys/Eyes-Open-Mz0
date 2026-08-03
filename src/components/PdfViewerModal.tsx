import React, { useState } from 'react';
import { X, Download, Maximize2, Minimize2, ExternalLink, BookOpen, ChevronLeft } from 'lucide-react';
import { Book } from '../types';
import { dbIncrementBookDownloads, resolvePdfUrl } from '../lib/db';

interface PdfViewerModalProps {
  book: Book;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ book, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloadCount, setDownloadCount] = useState(book.downloadCount || 0);

  const activePdfUrl = resolvePdfUrl(book);

  const handleDownload = async () => {
    try {
      const updated = await dbIncrementBookDownloads(book.id);
      setDownloadCount(updated);
      const link = document.createElement('a');
      link.href = activePdfUrl;
      link.download = `${book.title.replace(/\s+/g, '_')}_AlaX.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[#0b0c10] flex flex-col ${isFullscreen ? 'p-0' : 'p-2 sm:p-6'}`}>
      <div className="relative w-full h-full bg-[#12141d] border border-amber-500/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* READER HEADER */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181a27] border-b border-amber-500/20 shrink-0">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar à Biblioteca</span>
            </button>

            <div className="hidden sm:block">
              <h2 className="text-sm font-extrabold text-white line-clamp-1">
                {book.title}
              </h2>
              <p className="text-[10px] text-amber-400 font-medium">
                Leitor de PDF Ala X — {book.author}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            <button
              onClick={() => window.open(activePdfUrl, '_blank')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 transition-all cursor-pointer"
              title="Abrir PDF numa nova separador"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? 'Sair do modo ecrã inteiro' : 'Modo ecrã inteiro'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF VIEWPORT (IFRAME & OBJECT EMBED) */}
        <div className="flex-1 w-full bg-[#0a0b0e] relative">
          <iframe
            src={`${activePdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            title={book.title}
            className="w-full h-full border-none"
          />
        </div>

        {/* READER FOOTER BAR */}
        <div className="px-4 py-2 bg-[#181a27] border-t border-amber-500/10 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-white">{book.title}</span>
            <span className="text-amber-400">({book.category})</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Downloads: <strong className="text-emerald-400 font-bold">{downloadCount}</strong></span>
            {book.pageCount && <span>Páginas: <strong className="text-amber-300 font-bold">{book.pageCount}</strong></span>}
          </div>
        </div>

      </div>
    </div>
  );
};

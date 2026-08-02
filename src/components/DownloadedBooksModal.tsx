import React, { useState } from 'react';
import { 
  ArrowLeft, Download, CheckCircle2, Clock, ExternalLink, BookOpen, 
  Trash2, FileText, ArrowUpRight, FolderDown, RefreshCw
} from 'lucide-react';
import { Book } from '../types';

export interface DownloadedItem {
  id: string;
  bookId: string;
  book: Book;
  downloadedAt: number;
  progress: number; // 0 - 100
  status: 'downloading' | 'completed';
  fileSizeFormatted?: string;
}

interface DownloadedBooksModalProps {
  downloadedItems: DownloadedItem[];
  onClose: () => void;
  onOpenExternalPdf: (book: Book) => void;
  onRemoveDownloadedItem: (id: string) => void;
  onRestartDownload?: (book: Book) => void;
}

export const DownloadedBooksModal: React.FC<DownloadedBooksModalProps> = ({
  downloadedItems,
  onClose,
  onOpenExternalPdf,
  onRemoveDownloadedItem,
  onRestartDownload
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all');

  const inProgressItems = downloadedItems.filter(i => i.status === 'downloading' || i.progress < 100);
  const completedItems = downloadedItems.filter(i => i.status === 'completed' && i.progress >= 100);

  const filteredItems = downloadedItems.filter(item => {
    if (activeTab === 'in_progress') return item.status === 'downloading' || item.progress < 100;
    if (activeTab === 'completed') return item.status === 'completed' && item.progress >= 100;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#141622] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* TOP APP BAR WITH BACK BUTTON */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/20 bg-[#181a27]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-black font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-black shadow-lg shadow-amber-500/20">
              <FolderDown className="w-4 h-4 text-black" />
            </div>
            <h3 className="font-extrabold text-white text-base sm:text-lg font-serif">
              Obras Baixadas — Ala X
            </h3>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-amber-500/10 bg-[#12141f]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Todas ({downloadedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'in_progress'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Em Andamento ({inProgressItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Concluídas ({completedItems.length})</span>
            </button>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-[#181a26] rounded-2xl border border-amber-500/10">
              <Download className="w-10 h-10 text-amber-400/40 mx-auto" />
              <h4 className="font-bold text-white text-sm">Nenhum download encontrado</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {activeTab === 'in_progress' 
                  ? 'Não há downloads em andamento neste momento.'
                  : activeTab === 'completed'
                  ? 'Ainda não tem obras totalmente baixadas.'
                  : 'Clique no botão de download de qualquer obra para guardá-la offline.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isCompleted = item.status === 'completed' && item.progress >= 100;

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isCompleted
                      ? 'bg-[#181a27] border-emerald-500/30 hover:border-emerald-500/60'
                      : 'bg-[#1c1a17] border-amber-500/40 shadow-lg shadow-amber-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* BOOK DETAILS */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <img
                        src={item.book.coverUrl}
                        alt={item.book.title}
                        className="w-12 h-16 rounded-xl object-cover border border-amber-500/30 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate">{item.book.title}</h4>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase shrink-0">
                            {item.book.category}
                          </span>
                        </div>
                        <p className="text-xs text-amber-300/80 truncate">Por {item.book.author}</p>
                        
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono pt-0.5">
                          <span>{item.book.fileSizeFormatted || '3.5 MB'}</span>
                          <span>•</span>
                          <span>{new Date(item.downloadedAt).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </div>
                    </div>

                    {/* STATUS BADGE & DELETE */}
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>100% Totalmente Baixado</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Em Andamento ({item.progress}%)</span>
                        </span>
                      )}

                      <button
                        onClick={() => onRemoveDownloadedItem(item.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 transition-all cursor-pointer"
                        title="Remover da lista de downloads"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* PROGRESS BAR (IF IN PROGRESS) */}
                  {!isCompleted && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-amber-300 flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                          <span>A transferir ficheiro PDF...</span>
                        </span>
                        <span className="text-amber-400 font-mono">{item.progress}%</span>
                      </div>
                      
                      <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-amber-500/20">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-gray-400 italic pt-0.5">
                        ⚠️ A opção de leitura ficará disponível assim que o download for totalmente concluído (100%).
                      </p>
                    </div>
                  )}

                  {/* READ BUTTON (STRICT CONDITION: ONLY VISIBLE WHEN FULLY DOWNLOADED) */}
                  {isCompleted && (
                    <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between">
                      <p className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Ficheiro pronto para leitura no leitor ou gestor externo</span>
                      </p>

                      <button
                        onClick={() => onOpenExternalPdf(item.book)}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ler Obra (Leitor / Gestor Externo)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER NOTE */}
        <div className="p-4 border-t border-amber-500/20 bg-[#181a27] text-center">
          <p className="text-[11px] text-gray-400">
            Ao clicar em <strong className="text-emerald-300 font-extrabold">"Ler Obra"</strong>, o ficheiro PDF é aberto diretamente no gestor de ficheiros ou leitor de PDF externo do seu dispositivo.
          </p>
        </div>

      </div>
    </div>
  );
};

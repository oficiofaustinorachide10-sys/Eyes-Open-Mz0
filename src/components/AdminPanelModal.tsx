import React, { useState, useEffect } from 'react';
import { 
  X, PlusCircle, BookOpen, Trash2, Edit3, Upload, Shield, 
  BarChart3, FileText, CheckCircle2, AlertCircle, RefreshCw, Star, Download, Users
} from 'lucide-react';
import { Book, User, AdminStats } from '../types';
import { dbCreateBook, dbDeleteBook, dbUpdateBook, dbFetchAdminStats } from '../lib/db';
import { BOOK_CATEGORIES, compressBase64Image } from '../utils';

interface AdminPanelModalProps {
  currentUser: User | null;
  books: Book[];
  onClose: () => void;
  onBookAdded: (newBook: Book) => void;
  onBookDeleted: (bookId: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  currentUser,
  books,
  onClose,
  onBookAdded,
  onBookDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'stats'>('upload');

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [authorUserId, setAuthorUserId] = useState<string | undefined>(undefined);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [synopsis, setSynopsis] = useState('');

  const SAMPLE_USERS_LIST = [
    { id: 'admin_alax_master', name: 'Ofício Faustino Rachide (Admin)', email: 'admin@alax.mz', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
    { id: 'user-reader-4', name: 'Eurico Machava', email: 'eurico@exemplo.mz', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
    { id: 'user-reader-2', name: 'Ana Paula Langa', email: 'ana@exemplo.mz', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
    { id: 'user-gato', name: 'Gato Escritor', email: 'gato@exemplo.mz', avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=150' }
  ];

  const filteredUsers = SAMPLE_USERS_LIST.filter(u => {
    const q = author.startsWith('@') ? author.slice(1).toLowerCase() : author.toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const [category, setCategory] = useState('Drama');
  const [language, setLanguage] = useState('Português');
  const [pageCount, setPageCount] = useState<number>(120);
  const [publishedYear, setPublishedYear] = useState<number>(new Date().getFullYear());
  const [isFeatured, setIsFeatured] = useState(false);

  // File uploads state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrlInput, setPdfUrlInput] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin stats
  const [stats, setStats] = useState<AdminStats>({
    totalBooks: books.length,
    totalDownloads: books.reduce((acc, b) => acc + (b.downloadCount || 0), 0),
    totalUsers: 14,
    totalReviews: 24
  });

  useEffect(() => {
    dbFetchAdminStats().then(setStats).catch(console.error);
  }, [books]);

  // Handle Cover File Upload (convert to compressed Base64)
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawUrl = event.target?.result as string;
        const compressed = await compressBase64Image(rawUrl, 800, 0.65);
        setCoverPreviewUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle PDF File Upload (convert to Blob Data URL)
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPdfUrlInput(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Upload Form
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !synopsis.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor preencha todos os campos obrigatórios.' });
      return;
    }

    const finalCoverUrl = coverPreviewUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
    const finalPdfUrl = pdfUrlInput || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const newBook: Book = {
        id: `book_${Date.now()}`,
        title: title.trim(),
        author: author.trim().replace(/^@/, ''),
        authorUserId: authorUserId || (author.startsWith('@') ? 'user_tagged' : undefined),
        publisherUserId: currentUser?.id || 'admin_alax_master',
        synopsis: synopsis.trim(),
        category,
        coverUrl: finalCoverUrl,
        pdfUrl: finalPdfUrl,
        createdAt: Date.now(),
        downloadCount: 0,
        likesCount: 0,
        ratingAverage: 5.0,
        ratingCount: 1,
        pageCount: Number(pageCount) || 120,
        language: language.trim(),
        publishedYear: Number(publishedYear) || 2026,
        isFeatured,
        uploadedBy: currentUser?.name || 'Administrador Ala X'
      };

      const created = await dbCreateBook(newBook);
      onBookAdded(created);

      setStatusMessage({ type: 'success', text: `A obra "${created.title}" foi publicada com sucesso no Ala X!` });

      // Reset Form
      setTitle('');
      setAuthor('');
      setAuthorUserId(undefined);
      setShowUserDropdown(false);
      setSynopsis('');
      setCoverFile(null);
      setCoverPreviewUrl('');
      setPdfFile(null);
      setPdfUrlInput('');
      setIsFeatured(false);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Erro ao publicar obra: ${err?.message || 'Falha na gravação'}` });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (window.confirm(`Tem a certeza que deseja eliminar a obra "${bookTitle}" permanentemente do Ala X?`)) {
      try {
        await dbDeleteBook(bookId);
        onBookDeleted(bookId);
      } catch (e) {
        console.error('Error deleting book:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#141622] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-amber-500/20 bg-[#181a27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-black font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Gestão de Obras — Ala X
              </h2>
              <p className="text-xs text-amber-300">
                Publicação de novas obras em PDF e catálogo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 px-6 pt-4 bg-[#181a27] border-b border-amber-500/10">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#141622] text-amber-300 border-amber-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Publicar Nova Obra</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-[#141622] text-amber-300 border-amber-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Gerir Obras ({books.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#141622] text-amber-300 border-amber-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estatísticas & Métricas</span>
          </button>
        </div>

        {/* TAB BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          
          {/* TAB 1: UPLOAD FORM */}
          {activeTab === 'upload' && (
            <form onSubmit={handlePublishSubmit} className="space-y-6">
              
              {statusMessage && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold border ${
                  statusMessage.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* TITLE */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200">Título da Obra *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: A Madrasta"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400"
                  />
                </div>

                {/* AUTHOR WITH @ USER AUTOCOMPLETE */}
                <div className="space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-200">Autor / Escritor da Obra *</label>
                    <span className="text-[10px] text-amber-400">Escreva <code className="bg-amber-500/20 px-1 rounded text-amber-300">@</code> para selecionar utilizador</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: @Gato ou Ofício Faustino"
                    value={author}
                    onFocus={() => setShowUserDropdown(true)}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400"
                  />

                  {/* USER AUTOCOMPLETE DROPDOWN */}
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#181a27] border border-amber-500/30 rounded-2xl shadow-2xl p-2 max-h-48 overflow-y-auto space-y-1">
                      <p className="text-[10px] text-amber-300 font-bold px-2 py-1 uppercase tracking-wider">
                        Utilizadores Registados (Vincular Autor):
                      </p>
                      {filteredUsers.map((usr) => (
                        <button
                          key={usr.id}
                          type="button"
                          onClick={() => {
                            setAuthor(usr.name);
                            setAuthorUserId(usr.id);
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-500/20 transition-all text-left cursor-pointer group"
                        >
                          <img
                            src={usr.avatar}
                            alt={usr.name}
                            className="w-7 h-7 rounded-full object-cover border border-amber-400/30"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 block truncate">
                              {usr.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate font-mono">
                              {usr.email}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CATEGORY, LANGUAGE, YEAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200">Categoria / Gênero</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-100 outline-none focus:border-amber-400"
                  >
                    {BOOK_CATEGORIES.filter(c => c.slug !== 'todas').map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200">Páginas</label>
                  <input
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200">Ano de Publicação</label>
                  <input
                    type="number"
                    value={publishedYear}
                    onChange={(e) => setPublishedYear(Number(e.target.value))}
                    className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-100 outline-none"
                  />
                </div>
              </div>

              {/* SYNOPSIS */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-200">Sinopse Detalhada *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva a sinopse completa da obra literária..."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400"
                />
              </div>

              {/* FILE UPLOADS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#181a26] border border-amber-500/20">
                
                {/* COVER UPLOAD */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload de Imagem de Capa</span>
                  </label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                  />

                  {coverPreviewUrl && (
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-amber-400">
                      <img src={coverPreviewUrl} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* PDF UPLOAD */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Upload de Ficheiro PDF</span>
                  </label>

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-black hover:file:bg-emerald-400 cursor-pointer"
                  />

                  <div className="pt-2">
                    <span className="text-[10px] text-gray-400 block pb-1">Ou cole um Link URL direto de PDF:</span>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/obra.pdf"
                      value={pdfUrlInput}
                      onChange={(e) => setPdfUrlInput(e.target.value)}
                      className="w-full bg-[#11131c] border border-amber-500/20 rounded-xl p-2 text-xs text-amber-100 outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* FEATURED CHECKBOX */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeaturedCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isFeaturedCheck" className="text-xs text-amber-200 font-semibold cursor-pointer">
                  Destacar esta obra no Banner Principal do Ala X
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:scale-[1.01] transition-all cursor-pointer"
              >
                {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                <span>{isUploading ? 'A publicar Obra...' : 'Publicar Obra no Ala X'}</span>
              </button>

            </form>
          )}

          {/* TAB 2: MANAGE BOOKS */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-amber-500/10">
                <span>Lista completa de obras cadastradas no Cloud Firestore</span>
                <span>Total: {books.length} obras</span>
              </div>

              <div className="space-y-3">
                {books.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-[#181a26] border border-amber-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="w-12 h-16 rounded-lg object-cover border border-amber-500/30 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{b.title}</h4>
                          <span className="px-2 py-0.5 text-[9px] rounded bg-amber-500/20 text-amber-300 font-black uppercase">
                            {b.category}
                          </span>
                        </div>
                        <p className="text-xs text-amber-300/80">Por {b.author}</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-1">
                          <span>Downloads: <strong className="text-emerald-400">{b.downloadCount || 0}</strong></span>
                          <span>Nota: <strong className="text-amber-400">{b.ratingAverage?.toFixed(1) || '5.0'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleDeleteBook(b.id, b.title)}
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Apagar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STATS & METRICS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-5 rounded-2xl bg-[#181a26] border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold">Total de Obras</span>
                    <BookOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{stats.totalBooks}</p>
                  <span className="text-[10px] text-amber-300">Catálogo Ativo</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#181a26] border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold">Total Downloads PDF</span>
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-emerald-400">{stats.totalDownloads}</p>
                  <span className="text-[10px] text-emerald-300">Downloads no Firestore</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#181a26] border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold">Utilizadores Ala X</span>
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
                  <span className="text-[10px] text-gray-400">Leitores Registados</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#181a26] border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold">Avaliações</span>
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-amber-300">{stats.totalReviews}</p>
                  <span className="text-[10px] text-gray-400">Comentários & Estrelas</span>
                </div>

              </div>

              <div className="p-6 rounded-2xl bg-[#181a26] border border-amber-500/20 space-y-3">
                <h4 className="font-extrabold text-white text-sm">Informações de Servidor & Firestore</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  A base de dados do <strong>Ala X</strong> está conectada ao Cloud Firestore em tempo real. As atualizações de contadores de downloads e publicação de obras são propagadas automaticamente para todos os leitores.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

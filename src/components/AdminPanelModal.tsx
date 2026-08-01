import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Edit, BookOpen, Upload, Sparkles, Check, 
  Search, Shield, AtSign, Loader2, AlertCircle, FileText, User as UserIcon
} from 'lucide-react';
import { Book, User } from '../types';
import { dbCreateBook, dbDeleteBook, dbUpdateBook } from '../lib/db';
import { dbFetchAllUsers } from '../lib/authService';
import { BOOK_CATEGORIES, compressBase64Image } from '../utils';

interface AdminPanelModalProps {
  currentUser: User | null;
  books: Book[];
  onClose: () => void;
  onBookAdded: (book: Book) => void;
  onBookDeleted: (bookId: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  currentUser,
  books,
  onClose,
  onBookAdded,
  onBookDeleted
}) => {
  // Discrete permission guard
  const isPublisher = currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  // Form State
  const [title, setTitle] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [selectedAuthorUser, setSelectedAuthorUser] = useState<User | null>(null);
  const [synopsis, setSynopsis] = useState('');
  const [category, setCategory] = useState(BOOK_CATEGORIES[0]?.name || 'Ficção');
  const [coverUrl, setCoverUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pageCount, setPageCount] = useState(150);
  const [publishedYear, setPublishedYear] = useState(2026);
  const [isFeatured, setIsFeatured] = useState(false);

  // User Autocomplete for Author Selection
  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [filteredUserSuggestions, setFilteredUserSuggestions] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Load registered users on mount for @mentions and author selection
  useEffect(() => {
    dbFetchAllUsers().then((users) => {
      setSystemUsers(users);
    });
  }, []);

  // Handle author input change & @ trigger
  const handleAuthorInputChange = (val: string) => {
    setAuthorInput(val);
    setSelectedAuthorUser(null);

    // If typing @ or search query
    if (val.includes('@')) {
      const query = val.split('@').pop()?.toLowerCase() || '';
      const matches = systemUsers.filter(u => 
        u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );
      setFilteredUserSuggestions(matches);
      setShowAuthorSuggestions(true);
    } else if (val.trim().length > 0) {
      const query = val.toLowerCase().trim();
      const matches = systemUsers.filter(u => 
        u.name.toLowerCase().includes(query)
      );
      setFilteredUserSuggestions(matches);
      setShowAuthorSuggestions(matches.length > 0);
    } else {
      setShowAuthorSuggestions(false);
    }
  };

  const selectAuthorUser = (user: User) => {
    setAuthorInput(user.name);
    setSelectedAuthorUser(user);
    setShowAuthorSuggestions(false);
  };

  // Image & File upload base64 helpers
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const rawBase64 = ev.target?.result as string;
        try {
          const compressed = await compressBase64Image(rawBase64, 800, 0.7);
          setCoverUrl(compressed);
        } catch (err) {
          setCoverUrl(rawBase64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPdfUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPublisher) {
      setErrorMsg('Sem permissão para realizar esta operação.');
      return;
    }

    if (!title.trim() || !authorInput.trim() || !synopsis.trim() || !pdfUrl) {
      setErrorMsg('Preencha os campos obrigatórios: Título, Autor, Sinopse e Ficheiro PDF.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const finalCover = coverUrl.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';

      if (editingBookId) {
        await dbUpdateBook(editingBookId, {
          title: title.trim(),
          author: authorInput.trim(),
          authorUserId: selectedAuthorUser?.uid || selectedAuthorUser?.id,
          synopsis: synopsis.trim(),
          category,
          coverUrl: finalCover,
          pdfUrl: pdfUrl.trim(),
          pageCount,
          publishedYear,
          isFeatured
        });
        setSuccessMsg('Obra atualizada com sucesso!');
        setEditingBookId(null);
      } else {
        const newBookPayload: Book = {
          id: `book_${Date.now()}`,
          title: title.trim(),
          author: authorInput.trim(),
          authorUserId: selectedAuthorUser?.uid || selectedAuthorUser?.id,
          publisherUserId: currentUser?.uid || currentUser?.id, // Secret publisher link
          synopsis: synopsis.trim(),
          category,
          coverUrl: finalCover,
          pdfUrl: pdfUrl.trim(),
          createdAt: Date.now(),
          downloadCount: 0,
          likesCount: 0,
          ratingAverage: 5.0,
          ratingCount: 1,
          pageCount,
          publishedYear,
          isFeatured,
          uploadedBy: currentUser?.uid
        };

        const created = await dbCreateBook(newBookPayload);
        onBookAdded(created);
        setSuccessMsg('Nova obra publicada com sucesso!');
      }

      // Reset Form
      setTitle('');
      setAuthorInput('');
      setSelectedAuthorUser(null);
      setSynopsis('');
      setCoverUrl('');
      setPdfUrl('');
      setIsFeatured(false);

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setErrorMsg(err.message || 'Erro ao publicar obra no Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBookInit = (b: Book) => {
    setEditingBookId(b.id);
    setTitle(b.title);
    setAuthorInput(b.author);
    setSynopsis(b.synopsis);
    setCategory(b.category);
    setCoverUrl(b.coverUrl);
    setPdfUrl(b.pdfUrl);
    setPageCount(b.pageCount || 150);
    setPublishedYear(b.publishedYear || 2026);
    setIsFeatured(Boolean(b.isFeatured));
    setActiveTab('create');
  };

  const handleDeleteBookInit = async (bookId: string) => {
    if (!isPublisher) return;
    if (confirm('Tem a certeza que deseja remover esta obra do sistema?')) {
      try {
        await dbDeleteBook(bookId);
        onBookDeleted(bookId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!isPublisher) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#141622] border border-rose-500/40 rounded-3xl p-6 text-center max-w-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Acesso Restrito</h3>
          <p className="text-xs text-gray-400">Não tem permissões para aceder a este recurso.</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#141622] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-lg font-serif">Gestão de Obras Literárias</h3>
              <p className="text-[11px] text-amber-300">Publicação e catalogação oficial de PDFs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="grid grid-cols-2 p-1 bg-[#181a26] rounded-xl border border-amber-500/20">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'create' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {editingBookId ? 'Editar Obra em Destaque' : 'Publicar Nova Obra'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'manage' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Catálogo Existente ({books.length})
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: CREATE / EDIT FORM */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitBook} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* TITLE */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-200">Título da Obra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: O Leitor Noturno"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
              </div>

              {/* AUTHOR SELECTION (WITH @ USER AUTOCOMPLETE) */}
              <div className="space-y-1 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-200">Autor da Obra *</label>
                  <span className="text-[10px] text-amber-400">Digite @ para sugerir utilizadores</span>
                </div>
                <div className="relative">
                  <AtSign className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/60" />
                  <input
                    type="text"
                    required
                    placeholder="Digite o autor ou @para selecionar da lista"
                    value={authorInput}
                    onChange={(e) => handleAuthorInputChange(e.target.value)}
                    className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                  />
                </div>

                {/* USER AUTOCOMPLETE DROPDOWN */}
                {showAuthorSuggestions && filteredUserSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#181a29] border border-amber-500/40 rounded-xl shadow-xl max-h-40 overflow-y-auto p-1 divide-y divide-amber-500/10">
                    {filteredUserSuggestions.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => selectAuthorUser(u)}
                        className="p-2 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-2.5 rounded-lg"
                      >
                        <img
                          src={u.photoURL || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                          alt={u.name}
                          className="w-6 h-6 rounded-full object-cover border border-amber-400"
                        />
                        <div>
                          <p className="font-bold text-xs text-amber-100">{u.name}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* CATEGORY */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-200">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                >
                  {BOOK_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PAGE COUNT */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-200">N.º de Páginas</label>
                <input
                  type="number"
                  min={1}
                  value={pageCount}
                  onChange={(e) => setPageCount(parseInt(e.target.value) || 100)}
                  className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
              </div>

              {/* PUBLISHED YEAR */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-200">Ano de Publicação</label>
                <input
                  type="number"
                  value={publishedYear}
                  onChange={(e) => setPublishedYear(parseInt(e.target.value) || 2026)}
                  className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
              </div>

            </div>

            {/* SYNOPSIS */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200">Sinopse da Obra *</label>
              <textarea
                rows={3}
                required
                placeholder="Escreva uma descrição detalhada sobre o livro..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* COVER URL OR UPLOAD */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200">Capa do Livro (URL ou Ficheiro Imagem)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="https://exemplo.com/capa.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="flex-1 bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
                <label className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs cursor-pointer border border-amber-500/30 shrink-0">
                  <span>Carregar Imagem</span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* PDF URL OR UPLOAD */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200">Documento PDF * (URL ou Carregar Ficheiro PDF)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  required
                  placeholder="https://exemplo.com/documento.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="flex-1 bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
                <label className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-xs cursor-pointer border border-emerald-500/30 shrink-0">
                  <span>Escolher PDF</span>
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* FEATURED TOGGLE */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="isFeatured" className="text-xs text-amber-200 font-bold cursor-pointer">
                Destacar esta obra no Hero Banner Principal
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex justify-end gap-3 border-t border-amber-500/10">
              {editingBookId && (
                <button
                  type="button"
                  onClick={() => { setEditingBookId(null); setTitle(''); setAuthorInput(''); setSynopsis(''); setCoverUrl(''); setPdfUrl(''); }}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                <span>{editingBookId ? 'Guardar Alterações' : 'Publicar Obra'}</span>
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: MANAGE EXISTING BOOKS */}
        {activeTab === 'manage' && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {books.length === 0 ? (
              <p className="text-center py-8 text-xs text-gray-400">Nenhuma obra publicada no catálogo.</p>
            ) : (
              books.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-[#181a26] border border-amber-500/20 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      className="w-10 h-14 rounded-lg object-cover border border-amber-500/30"
                    />
                    <div>
                      <h5 className="font-bold text-white text-xs">{b.title}</h5>
                      <p className="text-[11px] text-amber-300">Por {b.author}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-0.5">
                        <span className="text-emerald-400 font-semibold">{b.category}</span>
                        <span>•</span>
                        <span>{b.downloadCount || 0} downloads</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditBookInit(b)}
                      className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBookInit(b.id)}
                      className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

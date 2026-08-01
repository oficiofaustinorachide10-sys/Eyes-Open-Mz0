import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, Shield, Sparkles, Star, Download, 
  Layers, Heart, FileText, ArrowUpDown, ChevronRight, BookMarked
} from 'lucide-react';
import { Book, User } from './types';
import { dbSubscribeBooks, dbIncrementBookDownloads } from './lib/db';
import { getStoredUser, saveStoredUser, subscribeToAuth, logoutUser } from './lib/authService';
import { BOOK_CATEGORIES, SAMPLE_BOOKS } from './utils';

// Subcomponents
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { BookCard } from './components/BookCard';
import { LivroDetailModal } from './components/LivroDetailModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ContinueSessionModal } from './components/ContinueSessionModal';
import { DownloadedBooksModal, DownloadedItem } from './components/DownloadedBooksModal';

export default function App() {
  const [books, setBooks] = useState<Book[]>(SAMPLE_BOOKS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedSessionUser, setSavedSessionUser] = useState<User | null>(null);
  const [showSessionPrompt, setShowSessionPrompt] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<'recent' | 'downloads' | 'rating' | 'title'>('recent');

  // Favorites (array of book IDs)
  const [favoriteBookIds, setFavoriteBookIds] = useState<string[]>(['book-1', 'book-2']);

  // Downloaded Books State & Manager
  const [downloadedItems, setDownloadedItems] = useState<DownloadedItem[]>(() => {
    try {
      const stored = localStorage.getItem('ala_x_downloaded_items');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'dl_sample_1',
        bookId: SAMPLE_BOOKS[0]?.id || 'book-1',
        book: SAMPLE_BOOKS[0],
        downloadedAt: Date.now() - 3600000,
        progress: 100,
        status: 'completed',
        fileSizeFormatted: '4.2 MB'
      }
    ];
  });

  // Active Modals
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [selectedBookForPdfReader, setSelectedBookForPdfReader] = useState<Book | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isDownloadsModalOpen, setIsDownloadsModalOpen] = useState<boolean>(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);

  // Sync downloads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ala_x_downloaded_items', JSON.stringify(downloadedItems));
    } catch (e) {
      console.error(e);
    }
  }, [downloadedItems]);

  // Check stored session on load & listen for Firebase Auth state changes
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setSavedSessionUser(stored);
      setShowSessionPrompt(true);
    }

    const unsubAuth = subscribeToAuth((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        saveStoredUser(fbUser);
        setShowSessionPrompt(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // Firestore real-time listener for books
  useEffect(() => {
    const unsub = dbSubscribeBooks((updatedBooks) => {
      setBooks(updatedBooks);
    });
    return () => unsub();
  }, []);

  // Filter & Sort Books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Favorites filter
      if (showOnlyFavorites && !favoriteBookIds.includes(book.id)) {
        return false;
      }

      // Search Query filter (Title, Author, Synopsis, Category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = book.title.toLowerCase().includes(q);
        const matchesAuthor = book.author.toLowerCase().includes(q);
        const matchesSynopsis = book.synopsis.toLowerCase().includes(q);
        const matchesCat = book.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesSynopsis && !matchesCat) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'todas') {
        const targetCategoryObj = BOOK_CATEGORIES.find(c => c.slug === selectedCategory);
        if (targetCategoryObj && book.category.toLowerCase() !== targetCategoryObj.name.toLowerCase()) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recent') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'downloads') {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      if (sortBy === 'rating') {
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [books, searchQuery, selectedCategory, sortBy, showOnlyFavorites, favoriteBookIds]);

  // Featured book for Hero Banner
  const featuredBook = useMemo(() => {
    return books.find(b => b.isFeatured) || books[0];
  }, [books]);

  // Favorite Books List
  const favoriteBooks = useMemo(() => {
    return books.filter(b => favoriteBookIds.includes(b.id));
  }, [books, favoriteBookIds]);

  // Toggle favorite
  const handleToggleFavorite = (bookId: string) => {
    setFavoriteBookIds(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  // Open External PDF / Gestor de Ficheiros
  const handleOpenExternalPdf = (book: Book) => {
    try {
      const link = document.createElement('a');
      link.href = book.pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(book.pdfUrl, '_blank');
    }
  };

  // Download PDF handler with progress simulation & gestor tracking
  const handleDownloadBook = async (book: Book) => {
    setIsDownloadsModalOpen(true);

    const existing = downloadedItems.find(i => i.bookId === book.id);
    if (existing && existing.status === 'completed') {
      return;
    }

    const itemId = `dl_${book.id}_${Date.now()}`;
    const newItem: DownloadedItem = {
      id: itemId,
      bookId: book.id,
      book,
      downloadedAt: Date.now(),
      progress: 15,
      status: 'downloading',
      fileSizeFormatted: book.fileSizeFormatted || '3.5 MB'
    };

    setDownloadedItems(prev => [newItem, ...prev.filter(i => i.bookId !== book.id)]);

    // Increment downloads in Firestore right away
    try {
      const updatedDownloads = await dbIncrementBookDownloads(book.id);
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, downloadCount: updatedDownloads } : b));
    } catch (e) {
      console.error(e);
    }

    // Animate download progress smoothly: 15% -> 45% -> 75% -> 95% -> 100%
    let curProgress = 15;
    const interval = setInterval(() => {
      curProgress += Math.floor(Math.random() * 25) + 15;
      if (curProgress >= 100) {
        curProgress = 100;
        clearInterval(interval);

        setDownloadedItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return { ...item, progress: 100, status: 'completed' };
          }
          return item;
        }));

        // Trigger browser file download
        try {
          const link = document.createElement('a');
          link.href = book.pdfUrl;
          link.download = `${book.title.replace(/\s+/g, '_')}_AlaX.pdf`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error(e);
        }
      } else {
        setDownloadedItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return { ...item, progress: curProgress };
          }
          return item;
        }));
      }
    }, 450);
  };

  const handleRemoveDownloadedItem = (id: string) => {
    setDownloadedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleLogoutAction = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    saveStoredUser(null);
    setCurrentUser(null);
    setSavedSessionUser(null);
    setShowSessionPrompt(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0e15] text-amber-50 selection:bg-amber-500 selection:text-black font-sans antialiased flex flex-col justify-between">
      
      {/* HEADER & NAVBAR */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setShowOnlyFavorites(false);
        }}
        onOpenAdmin={() => {
          const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz';
          if (!currentUser || !isAdmin) {
            setIsAuthModalOpen(true);
          } else {
            setIsAdminPanelOpen(true);
          }
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
        onOpenDownloads={() => setIsDownloadsModalOpen(true)}
        downloadCount={downloadedItems.length}
        favoriteCount={favoriteBookIds.length}
        onLogout={handleLogoutAction}
      />

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-8">
        
        {/* HERO BANNER SHOWCASE */}
        {!showOnlyFavorites && !searchQuery && selectedCategory === 'todas' && (
          <HeroBanner
            featuredBook={featuredBook}
            onReadBook={(book) => setSelectedBookForPdfReader(book)}
            onOpenAdmin={() => setIsAdminPanelOpen(true)}
            totalBooksCount={books.length}
          />
        )}

        {/* CATEGORIES STRIP */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-white text-sm tracking-wide uppercase">
                {showOnlyFavorites ? 'Minha Biblioteca de Favoritos' : 'Categorias & Obras em PDF'}
              </h3>
            </div>

            {/* SORTING CONTROLS */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#181a26] border border-amber-500/20 rounded-xl px-3 py-1.5 text-xs text-amber-200 outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="recent">Mais Recentes</option>
                <option value="downloads">Mais Descarregados</option>
                <option value="rating">Melhor Avaliados</option>
                <option value="title">Ordem Alfabética</option>
              </select>
            </div>
          </div>

          {/* CATEGORY PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {BOOK_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.slug && !showOnlyFavorites;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setShowOnlyFavorites(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#181a26] text-gray-300 border-amber-500/15 hover:border-amber-400/50 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE FILTER STATUS */}
        {(showOnlyFavorites || selectedCategory !== 'todas' || searchQuery) && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <span>
              A mostrar resultados para:{' '}
              <strong className="text-white">
                {showOnlyFavorites ? 'Favoritos' : selectedCategory !== 'todas' ? `Categoria "${selectedCategory}"` : `Pesquisa por "${searchQuery}"`}
              </strong>{' '}
              ({filteredBooks.length} obras encontradas)
            </span>
            <button
              onClick={() => {
                setSelectedCategory('todas');
                setSearchQuery('');
                setShowOnlyFavorites(false);
              }}
              className="font-bold underline text-amber-400 hover:text-white cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* BOOKS CATALOG GRID */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-[#141622] rounded-3xl border border-amber-500/20 p-8">
            <BookMarked className="w-12 h-12 text-amber-400/40 mx-auto" />
            <h4 className="text-lg font-bold text-white">Nenhuma obra encontrada</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Não foram encontradas obras literárias com os critérios selecionados. Tente pesquisar por outro termo ou explorar o catálogo.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('todas');
                setSearchQuery('');
                setShowOnlyFavorites(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md"
            >
              Ver Todas as Obras
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isFavorite={favoriteBookIds.includes(book.id)}
                onRead={(b) => setSelectedBookForPdfReader(b)}
                onDownload={handleDownloadBook}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(b) => setSelectedBookForDetails(b)}
              />
            ))}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0a0b10] border-t border-amber-500/20 py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center text-black font-black text-xs">
              X
            </div>
            <span className="font-bold text-white font-mono">ALA X</span>
            <span>— Plataforma de Publicação & Leitura de Obras em PDF</span>
          </div>

          <p>© 2026 Ala X. Todos os direitos reservados. Conectado ao Firebase Cloud Firestore.</p>
        </div>
      </footer>

      {/* ACTIVE MODALS */}
      {selectedBookForDetails && (
        <LivroDetailModal
          book={selectedBookForDetails}
          currentUser={currentUser}
          isFavorite={favoriteBookIds.includes(selectedBookForDetails.id)}
          onClose={() => setSelectedBookForDetails(null)}
          onOpenPdfReader={(b) => {
            setSelectedBookForDetails(null);
            setSelectedBookForPdfReader(b);
          }}
          onToggleFavorite={handleToggleFavorite}
          onStartDownload={handleDownloadBook}
          onBookUpdated={(updated) => {
            setBooks(prev => prev.map(b => b.id === updated.id ? updated : b));
          }}
        />
      )}

      {selectedBookForPdfReader && (
        <PdfViewerModal
          book={selectedBookForPdfReader}
          onClose={() => setSelectedBookForPdfReader(null)}
        />
      )}

      {isDownloadsModalOpen && (
        <DownloadedBooksModal
          downloadedItems={downloadedItems}
          onClose={() => setIsDownloadsModalOpen(false)}
          onOpenExternalPdf={handleOpenExternalPdf}
          onRemoveDownloadedItem={handleRemoveDownloadedItem}
          onRestartDownload={handleDownloadBook}
        />
      )}

      {isAdminPanelOpen && (
        <AdminPanelModal
          currentUser={currentUser}
          books={books}
          onClose={() => setIsAdminPanelOpen(false)}
          onBookAdded={(newBook) => setBooks(prev => [newBook, ...prev])}
          onBookDeleted={(bookId) => setBooks(prev => prev.filter(b => b.id !== bookId))}
        />
      )}

      {((!currentUser && !showSessionPrompt) || isAuthModalOpen) && (
        <AuthModal
          canClose={Boolean(currentUser)}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(user) => {
            saveStoredUser(user);
            setCurrentUser(user);
            setIsAuthModalOpen(false);
          }}
        />
      )}

      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          user={currentUser}
          favoriteBooks={favoriteBooks}
          onClose={() => setIsProfileModalOpen(false)}
          onSelectBook={(b) => setSelectedBookForDetails(b)}
          onOpenDownloads={() => setIsDownloadsModalOpen(true)}
          onLogout={handleLogoutAction}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
            saveStoredUser(updated);
          }}
        />
      )}

      {/* CONTINUATION PROMPT FOR RETURNING BROWSERS */}
      {showSessionPrompt && savedSessionUser && (
        <ContinueSessionModal
          savedUser={savedSessionUser}
          onConfirm={() => {
            setCurrentUser(savedSessionUser);
            setShowSessionPrompt(false);
          }}
          onSwitchAccount={() => {
            saveStoredUser(null);
            setSavedSessionUser(null);
            setShowSessionPrompt(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}

    </div>
  );
}

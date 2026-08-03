import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, Shield, Sparkles, Star, Download, 
  Layers, Heart, FileText, ArrowUpDown, ChevronRight, BookMarked,
  LayoutGrid, List, Zap
} from 'lucide-react';
import { Book, User, AppNotification } from './types';
import { dbSubscribeBooks, dbIncrementBookDownloads, dbSubscribeNotifications } from './lib/db';
import { subscribeToAuth, logoutUser, getStoredUser, saveStoredUser } from './lib/authService';
import { BOOK_CATEGORIES, SAMPLE_BOOKS } from './utils';

// Subcomponents
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategorizedBookRows } from './components/CategorizedBookRows';
import { WhyUseAlaXSection } from './components/WhyUseAlaXSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { NewsletterSection } from './components/NewsletterSection';
import { FooterSection } from './components/FooterSection';
import { AlaXIntroSplashModal } from './components/AlaXIntroSplashModal';
import { AlaXAnimatedXLoader } from './components/AlaXAnimatedXLoader';
import { AppTheme } from './components/ThemeSwitcher';
import { BookCard } from './components/BookCard';
import { LivroDetailModal } from './components/LivroDetailModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DownloadedBooksModal, DownloadedItem } from './components/DownloadedBooksModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { ShareBookModal } from './components/ShareBookModal';
import { GuestAuthPromptModal } from './components/GuestAuthPromptModal';
import { updateBookMetaTags } from './lib/metaHelper';

const DEFAULT_GUEST_USER: User = {
  id: 'guest_reader',
  uid: 'guest_reader',
  email: 'leitor@alax.mz',
  name: 'Leitor Ala X',
  role: 'user',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  bio: 'Leitor da Biblioteca Digital Ala X',
  favoriteBookIds: [],
  createdAt: Date.now()
};

export default function App() {
  const [books, setBooks] = useState<Book[]>(SAMPLE_BOOKS);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return getStoredUser() || DEFAULT_GUEST_USER;
  });
  const [authChecked, setAuthChecked] = useState<boolean>(true);

  // App Theme & View Mode State
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem('ala_x_theme');
      if (stored === 'light' || stored === 'dark' || stored === 'lite') return stored;
    } catch (e) {
      console.error(e);
    }
    return 'dark';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return currentTheme === 'lite' ? 'list' : 'grid';
  });

  const handleThemeChange = (newTheme: AppTheme) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem('ala_x_theme', newTheme);
    } catch (e) {
      console.error(e);
    }
    // Auto toggle list view for Lite mode if user changes theme
    if (newTheme === 'lite') {
      setViewMode('list');
    }
  };

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
    return [];
  });

  // Active Modals & Splash Video State
  const [showIntroSplash, setShowIntroSplash] = useState<boolean>(false);
  const [splashMode, setSplashMode] = useState<'login' | 'register' | 'manual'>('login');
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<{ book: Book; initialTab?: 'reviews' | 'comments'; targetCommentId?: string } | null>(null);
  const [selectedBookForPdfReader, setSelectedBookForPdfReader] = useState<Book | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isDownloadsModalOpen, setIsDownloadsModalOpen] = useState<boolean>(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [sharingBook, setSharingBook] = useState<Book | null>(null);
  const [guestAuthPromptMessage, setGuestAuthPromptMessage] = useState<string | null>(null);

  // Sync meta tags when viewing a book detail
  useEffect(() => {
    if (selectedBookForDetails?.book) {
      updateBookMetaTags(selectedBookForDetails.book);
    } else {
      updateBookMetaTags(null);
    }
  }, [selectedBookForDetails]);

  // Check URL parameters for book sharing direct links (?book=BOOK_ID)
  useEffect(() => {
    if (!books || books.length === 0) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bookIdFromUrl = urlParams.get('book') || (window.location.hash.startsWith('#book=') ? window.location.hash.replace('#book=', '') : null);
      if (bookIdFromUrl) {
        const found = books.find(b => b.id === bookIdFromUrl);
        if (found) {
          setSelectedBookForDetails({ book: found });
        }
      }
    } catch (e) {
      console.error('Error parsing shared book link:', e);
    }
  }, [books]);

  const isAdmin = currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin';
  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  // Sync downloads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ala_x_downloaded_items', JSON.stringify(downloadedItems));
    } catch (e) {
      console.error(e);
    }
  }, [downloadedItems]);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubAuth = subscribeToAuth((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        saveStoredUser(fbUser);
      } else {
        saveStoredUser(null);
      }
      setAuthChecked(true);
    });
    return () => unsubAuth();
  }, []);

  // Firestore real-time listener for books & notifications
  useEffect(() => {
    const unsubBooks = dbSubscribeBooks((updatedBooks) => {
      if (updatedBooks && updatedBooks.length > 0) {
        setBooks(updatedBooks);
      }
    });

    let unsubNotifs = () => {};
    if (currentUser && currentUser.id !== 'guest_reader') {
      unsubNotifs = dbSubscribeNotifications(currentUser.id, Boolean(isAdmin), (updatedNotifs) => {
        setNotifications(updatedNotifs);
      });
    }

    return () => {
      unsubBooks();
      unsubNotifs();
    };
  }, [currentUser?.id, isAdmin]);

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

  // Open External PDF
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

  // Download PDF handler
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

    try {
      const updatedDownloads = await dbIncrementBookDownloads(book.id);
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, downloadCount: updatedDownloads } : b));
    } catch (e) {
      console.error(e);
    }

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
    setCurrentUser(DEFAULT_GUEST_USER);
    saveStoredUser(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
      currentTheme === 'light'
        ? 'bg-slate-100 text-slate-900 selection:bg-amber-400 selection:text-black'
        : currentTheme === 'lite'
        ? 'bg-slate-950 text-emerald-50 selection:bg-emerald-500 selection:text-black'
        : 'bg-[#0d0e15] text-amber-50 selection:bg-amber-500 selection:text-black'
    }`}>
      
      {/* NAVBAR NAVIGATION (SINGLE HEADER AS IN REFERENCE DESIGN) */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setShowOnlyFavorites(false);
        }}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
        onOpenDownloads={() => setIsDownloadsModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
        downloadCount={downloadedItems.length}
        favoriteCount={favoriteBookIds.length}
        onLogout={handleLogoutAction}
        transparentOverlay={!showOnlyFavorites && !searchQuery && selectedCategory === 'todas'}
      />

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 w-full space-y-6">
        
        {/* HOMEPAGE DEFAULT LAYOUT MATCHING UPLOADED REFERENCE DESIGN */}
        {!showOnlyFavorites && !searchQuery && selectedCategory === 'todas' ? (
          <>
            {/* 1. HERO BANNER DESTAQUE DA SEMANA + STATS BAR (INTEGRATED AT TOP) */}
            <HeroBanner
              featuredBook={featuredBook}
              currentUser={currentUser}
              onReadBook={(book) => setSelectedBookForPdfReader(book)}
              onOpenDetails={(b, tab) => setSelectedBookForDetails({ book: b, initialTab: tab })}
              onOpenAdmin={() => setIsAdminPanelOpen(true)}
              totalBooksCount={books.length}
              onShare={(b) => setSharingBook(b)}
            />

            {/* 2. CATEGORIZED INFINITE HORIZONTAL ROWS IN FEED */}
            <CategorizedBookRows
              books={books}
              theme={currentTheme}
              onReadBook={(book) => setSelectedBookForPdfReader(book)}
              onOpenDetails={(b, tab) => setSelectedBookForDetails({ book: b, initialTab: tab })}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setShowOnlyFavorites(false);
              }}
              onShare={(b) => setSharingBook(b)}
            />

            {/* 4. POR QUE USAR A ALA X? */}
            <WhyUseAlaXSection theme={currentTheme} />

            {/* 5. O QUE NOSSOS LEITORES DIZEM */}
            <TestimonialsSection theme={currentTheme} />

            {/* 6. NEWSLETTER */}
            <NewsletterSection theme={currentTheme} />
          </>
        ) : (
          /* CATALOG FILTER & SEARCH VIEW */
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className={`w-4 h-4 ${currentTheme === 'lite' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <h3 className={`font-extrabold text-sm tracking-wide uppercase ${
                    currentTheme === 'light' ? 'text-slate-800' : 'text-white'
                  }`}>
                    {showOnlyFavorites ? 'Minha Biblioteca de Favoritos' : 'Resultados do Catálogo em PDF'}
                  </h3>
                </div>

                {/* SORTING & VIEW MODE CONTROLS */}
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-xl border flex items-center gap-1 ${
                    currentTheme === 'light'
                      ? 'bg-slate-200 border-slate-300'
                      : currentTheme === 'lite'
                      ? 'bg-slate-900 border-emerald-500/30'
                      : 'bg-[#181a26] border-amber-500/20'
                  }`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? (currentTheme === 'lite' ? 'bg-emerald-500 text-black shadow-md' : 'bg-amber-500 text-black shadow-md')
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Modo Grelha"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'list'
                          ? (currentTheme === 'lite' ? 'bg-emerald-500 text-black shadow-md' : 'bg-amber-500 text-black shadow-md')
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Modo Lista"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* SORT BY */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={`border rounded-xl px-3 py-1.5 text-xs outline-none cursor-pointer ${
                        currentTheme === 'light'
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                          : currentTheme === 'lite'
                          ? 'bg-slate-900 border-emerald-500/30 text-emerald-200 focus:border-emerald-400'
                          : 'bg-[#181a26] border-amber-500/20 text-amber-200 focus:border-amber-400'
                      }`}
                    >
                      <option value="recent">Mais Recentes</option>
                      <option value="downloads">Mais Descarregados</option>
                      <option value="rating">Melhor Avaliados</option>
                      <option value="title">Ordem Alfabética</option>
                    </select>
                  </div>
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
                          ? (currentTheme === 'lite' 
                              ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                              : 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20')
                          : (currentTheme === 'light'
                              ? 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                              : currentTheme === 'lite'
                              ? 'bg-slate-900 text-emerald-200 border-emerald-500/20 hover:border-emerald-400'
                              : 'bg-[#181a26] text-gray-300 border-amber-500/15 hover:border-amber-400/50 hover:text-white')
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
              <div className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                currentTheme === 'light'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : currentTheme === 'lite'
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span>
                  A mostrar resultados para:{' '}
                  <strong className={currentTheme === 'light' ? 'text-slate-900' : 'text-white'}>
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
                  className="font-bold underline cursor-pointer hover:opacity-80"
                >
                  Limpar Filtros
                </button>
              </div>
            )}

            {/* BOOKS CATALOG GRID / LIST */}
            {filteredBooks.length === 0 ? (
              <div className={`text-center py-16 space-y-4 rounded-3xl border p-8 ${
                currentTheme === 'light'
                  ? 'bg-white border-slate-200 text-slate-800'
                  : currentTheme === 'lite'
                  ? 'bg-slate-900 border-emerald-500/30 text-emerald-100'
                  : 'bg-[#141622] border-amber-500/20 text-white'
              }`}>
                <BookMarked className="w-12 h-12 text-amber-400/40 mx-auto" />
                <h4 className="text-lg font-bold">Nenhuma obra encontrada</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Não foram encontradas obras com os critérios selecionados.
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
              <div className={
                viewMode === 'list' 
                  ? "grid grid-cols-1 gap-4" 
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              }>
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isFavorite={favoriteBookIds.includes(book.id)}
                    theme={currentTheme}
                    viewMode={viewMode}
                    onRead={(b) => setSelectedBookForPdfReader(b)}
                    onDownload={handleDownloadBook}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetails={(b, tab) => setSelectedBookForDetails({ book: b, initialTab: tab })}
                    onShare={(b) => setSharingBook(b)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER (FULL DESIGN FROM IMAGE) */}
      <FooterSection
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setShowOnlyFavorites(false);
        }}
        theme={currentTheme}
      />

      {/* ACTIVE MODALS */}
      {selectedBookForDetails && (
        <LivroDetailModal
          book={selectedBookForDetails.book}
          initialTab={selectedBookForDetails.initialTab}
          targetCommentId={selectedBookForDetails.targetCommentId}
          currentUser={currentUser}
          isFavorite={favoriteBookIds.includes(selectedBookForDetails.book.id)}
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
          onShare={(b) => setSharingBook(b)}
          onRequireAuth={(msg) => setGuestAuthPromptMessage(msg || 'Para utilizar esta funcionalidade, inicie sessão ou crie uma conta.')}
        />
      )}

      {isNotificationsModalOpen && (
        <NotificationCenterModal
          currentUser={currentUser}
          notifications={notifications}
          onClose={() => setIsNotificationsModalOpen(false)}
          onOpenNotificationTarget={(notif) => {
            setIsNotificationsModalOpen(false);
            if (notif.type === 'new_user') {
              setIsProfileModalOpen(true);
            } else if (notif.bookId) {
              const targetBook = books.find(b => b.id === notif.bookId);
              if (targetBook) {
                setSelectedBookForDetails({
                  book: targetBook,
                  initialTab: notif.type === 'new_review' ? 'reviews' : 'comments',
                  targetCommentId: notif.commentId
                });
              }
            }
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

      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          books={books}
          onClose={() => setIsProfileModalOpen(false)}
          onSelectBook={(b) => setSelectedBookForDetails({ book: b })}
          onLogout={handleLogoutAction}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
          }}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          canClose={true}
          initialMode={authInitialMode}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(user, mode) => {
            setCurrentUser(user);
            saveStoredUser(user);
            setIsAuthModalOpen(false);
            setSplashMode(mode || 'login');
            setShowIntroSplash(true);
          }}
        />
      )}

      {showIntroSplash && (
        <AlaXIntroSplashModal
          user={currentUser}
          mode={splashMode}
          onClose={() => setShowIntroSplash(false)}
        />
      )}

      {sharingBook && (
        <ShareBookModal
          book={sharingBook}
          onClose={() => setSharingBook(null)}
        />
      )}

      {guestAuthPromptMessage && (
        <GuestAuthPromptModal
          actionMessage={guestAuthPromptMessage}
          onClose={() => setGuestAuthPromptMessage(null)}
          onOpenAuth={(mode) => {
            setAuthInitialMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
        />
      )}

    </div>
  );
}

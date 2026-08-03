import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Heart, Download, BookOpen, Star, MessageSquare, ThumbsUp, 
  Send, Reply, Pin, Copy, Flag, Edit, Trash2, Check, Sparkles, User as UserIcon, MoreHorizontal, ArrowLeft, Maximize2,
  ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { Book, User, Review, BookComment } from '../types';
import { 
  dbSubscribeReviews, dbAddOrUpdateReview, dbDeleteReview,
  dbSubscribeComments, dbAddComment, dbUpdateComment, dbDeleteComment, dbToggleCommentLike, dbPinComment, dbReportComment,
  dbCreateNotification, dbAddChapterToBook
} from '../lib/db';
import { dbFetchAllUsers } from '../lib/authService';
import { ImageViewerModal } from './ImageViewerModal';

interface LivroDetailModalProps {
  book: Book;
  currentUser: User | null;
  isFavorite: boolean;
  initialTab?: 'reviews' | 'comments';
  targetCommentId?: string;
  onClose: () => void;
  onOpenPdfReader: (book: Book) => void;
  onToggleFavorite: (bookId: string) => void;
  onStartDownload: (book: Book) => void;
  onBookUpdated?: (book: Book) => void;
  onShare?: (book: Book) => void;
  onRequireAuth?: (message?: string) => void;
}

export const LivroDetailModal: React.FC<LivroDetailModalProps> = ({
  book,
  currentUser,
  isFavorite,
  initialTab,
  targetCommentId,
  onClose,
  onOpenPdfReader,
  onToggleFavorite,
  onStartDownload,
  onBookUpdated,
  onShare,
  onRequireAuth
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'reviews' | 'comments'>(
    targetCommentId 
      ? 'comments' 
      : (initialTab ? initialTab : (book.status === 'em_lancamento' || (book.chapters && book.chapters.length > 0) ? 'chapters' : 'reviews'))
  );
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isSynopsisExpandedModal, setIsSynopsisExpandedModal] = useState(true);

  // Real-time Firestore Reviews & Comments
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<BookComment[]>([]);

  // Registered system users for @mentions
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  // Avaliações Form State (Play Store style)
  const [isRatingFormOpen, setIsRatingFormOpen] = useState(false);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Comentários Form State (Facebook style)
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentSortBy, setCommentSortBy] = useState<'relevant' | 'recent' | 'oldest'>('relevant');
  
  // @Mentions popup state
  const [showMentionsList, setShowMentionsList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  // Lançar Novo Capítulo Inline Form State
  const [isAddingChapterInline, setIsAddingChapterInline] = useState(false);
  const [chapNumberInline, setChapNumberInline] = useState((book.chapters?.length || 0) + 1);
  const [chapTitleInline, setChapTitleInline] = useState('');
  const [chapDescInline, setChapDescInline] = useState('');
  const [chapPdfUrlInline, setChapPdfUrlInline] = useState('');
  const [chapPageCountInline, setChapPageCountInline] = useState(15);
  const [isSubmittingChapInline, setIsSubmittingChapInline] = useState(false);

  const isGuest = !currentUser || currentUser.id === 'guest_reader' || Boolean(currentUser.isGuest);
  const isPublisher = !isGuest && (currentUser?.email === 'oficiofaustino78@gmail.com' || currentUser?.email === 'admin@alax.mz' || currentUser?.role === 'admin');

  const handleChapPdfUploadInline = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor selecione um ficheiro PDF válido.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setChapPdfUrlInline(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChapterInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPublisher) {
      alert('Apenas administradores podem publicar capítulos.');
      return;
    }
    if (!chapPdfUrlInline) {
      alert('Por favor insira ou carregue o ficheiro PDF do capítulo.');
      return;
    }
    setIsSubmittingChapInline(true);
    try {
      const newChap = await dbAddChapterToBook(book.id, {
        number: chapNumberInline,
        title: chapTitleInline || `Capítulo ${chapNumberInline}`,
        description: chapDescInline,
        pdfUrl: chapPdfUrlInline,
        pageCount: chapPageCountInline || 15
      });

      const updatedChapters = [...(book.chapters || []), newChap];
      const updatedBook: Book = {
        ...book,
        status: 'em_lancamento',
        chapters: updatedChapters
      };
      
      onBookUpdated?.(updatedBook);
      setIsAddingChapterInline(false);
      setChapTitleInline('');
      setChapDescInline('');
      setChapPdfUrlInline('');
      setChapNumberInline(updatedChapters.length + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingChapInline(false);
    }
  };

  // Subscribe to Reviews & Comments
  useEffect(() => {
    const unsubRev = dbSubscribeReviews(book.id, setReviews);
    const unsubComm = dbSubscribeComments(book.id, setComments);
    dbFetchAllUsers().then(setSystemUsers).catch(() => {});

    return () => {
      unsubRev();
      unsubComm();
    };
  }, [book.id]);

  // Target Comment Auto-Scroll & Highlight
  useEffect(() => {
    if (targetCommentId && comments.length > 0) {
      setActiveTab('comments');
      setTimeout(() => {
        const el = document.getElementById(`comment-${targetCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [targetCommentId, comments]);

  // Existing User Review
  const userExistingReview = useMemo(() => {
    if (!currentUser) return null;
    return reviews.find(r => r.userId === (currentUser.uid || currentUser.id));
  }, [reviews, currentUser]);

  // Rating Distribution Calculation (Play Store style)
  const ratingStats = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = reviews.length;
    let sum = 0;

    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating as 1|2|3|4|5] += 1;
        sum += r.rating;
      }
    });

    const average = total > 0 ? parseFloat((sum / total).toFixed(1)) : (book.ratingAverage || 5.0);
    return { counts, total: total || (book.ratingCount || 1), average };
  }, [reviews, book]);

  // Submit/Update Review Handler with Notification
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !currentUser) {
      onRequireAuth?.('Para utilizar esta funcionalidade, inicie sessão ou crie uma conta.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      const reviewPayload: Review = {
        id: userExistingReview ? userExistingReview.id : `rev_${currentUser.uid || currentUser.id}_${book.id}`,
        bookId: book.id,
        userId: currentUser.uid || currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.photoURL || currentUser.avatar,
        rating: selectedStars,
        comment: reviewText.trim(),
        createdAt: userExistingReview ? userExistingReview.createdAt : Date.now()
      };

      await dbAddOrUpdateReview(reviewPayload);

      // Create Admin Notification for New Review
      await dbCreateNotification({
        userId: 'admin',
        senderId: currentUser.uid || currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.photoURL || currentUser.avatar,
        type: 'new_review',
        title: 'Nova avaliação de obra',
        message: `${currentUser.name} avaliou a obra "${book.title}" com ${selectedStars} estrela(s).`,
        bookId: book.id,
        bookTitle: book.title,
        reviewId: reviewPayload.id
      });

      setIsRatingFormOpen(false);
      setReviewText('');
    } catch (err: any) {
      console.error(err);
      setReviewError('Erro ao submeter avaliação.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteUserReview = async () => {
    if (!userExistingReview) return;
    if (confirm('Deseja apagar a sua avaliação?')) {
      try {
        await dbDeleteReview(userExistingReview.id, book.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Handle Comment Change & @mentions
  const handleCommentTextChange = (text: string) => {
    setCommentText(text);
    if (text.includes('@')) {
      const q = text.split('@').pop()?.toLowerCase() || '';
      setMentionQuery(q);
      setShowMentionsList(true);
    } else {
      setShowMentionsList(false);
    }
  };

  const insertMentionUser = (u: User) => {
    const parts = commentText.split('@');
    parts.pop();
    const newText = parts.join('@') + `@${u.name} `;
    setCommentText(newText);
    setShowMentionsList(false);
  };

  // Submit Comment or Reply with Notifications
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !currentUser) {
      onRequireAuth?.('Para utilizar esta funcionalidade, inicie sessão ou crie uma conta.');
      return;
    }
    if (!commentText.trim()) return;

    try {
      const newComm: BookComment = {
        id: `comm_${Date.now()}`,
        bookId: book.id,
        userId: currentUser.uid || currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.photoURL || currentUser.avatar,
        text: commentText.trim(),
        createdAt: Date.now(),
        likesCount: 0,
        likedBy: [],
        parentId: replyingToCommentId || null,
        pinned: false
      };

      await dbAddComment(newComm);

      // Notification 1: Admin Notification for new comment
      await dbCreateNotification({
        userId: 'admin',
        senderId: currentUser.uid || currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.photoURL || currentUser.avatar,
        type: 'new_comment',
        title: 'Novo comentário em obra',
        message: `${currentUser.name} comentou na obra "${book.title}".`,
        bookId: book.id,
        bookTitle: book.title,
        commentId: newComm.id
      });

      // Notification 2: If reply, notify original comment author
      if (replyingToCommentId) {
        const parentComm = comments.find(c => c.id === replyingToCommentId);
        if (parentComm && parentComm.userId !== (currentUser.uid || currentUser.id)) {
          await dbCreateNotification({
            userId: parentComm.userId,
            senderId: currentUser.uid || currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.photoURL || currentUser.avatar,
            type: 'comment_reply',
            title: 'Resposta ao seu comentário',
            message: `${currentUser.name} respondeu ao seu comentário na obra "${book.title}".`,
            bookId: book.id,
            bookTitle: book.title,
            commentId: newComm.id
          });
        }
      }

      // Notification 3: Check @mentions
      systemUsers.forEach((u) => {
        if (
          u.id !== (currentUser.uid || currentUser.id) &&
          commentText.toLowerCase().includes(`@${u.name.toLowerCase()}`)
        ) {
          dbCreateNotification({
            userId: u.id,
            senderId: currentUser.uid || currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.photoURL || currentUser.avatar,
            type: 'user_mention',
            title: 'Mencionou você em um comentário',
            message: `${currentUser.name} mencionou você na obra "${book.title}".`,
            bookId: book.id,
            bookTitle: book.title,
            commentId: newComm.id
          });
        }
      });

      setCommentText('');
      setReplyingToCommentId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCommentSubmit = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      await dbUpdateComment(commentId, editCommentText.trim());
      setEditingCommentId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered & Sorted Comments (Facebook style with Work Author highlight & pin)
  const sortedRootComments = useMemo(() => {
    // Only root comments (no parentId)
    const roots = comments.filter(c => !c.parentId);

    return roots.sort((a, b) => {
      // Pinned comment comes first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Check if commenter is Work Author
      const isAAuthor = a.userId === book.authorUserId || a.userName.toLowerCase() === book.author.toLowerCase();
      const isBAuthor = b.userId === book.authorUserId || b.userName.toLowerCase() === book.author.toLowerCase();

      if (isAAuthor && !isBAuthor) return -1;
      if (!isAAuthor && isBAuthor) return 1;

      if (commentSortBy === 'recent') return b.createdAt - a.createdAt;
      if (commentSortBy === 'oldest') return a.createdAt - b.createdAt;
      // Relevant = likesCount
      return (b.likesCount || 0) - (a.likesCount || 0);
    });
  }, [comments, book, commentSortBy]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#141622] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto p-4 sm:p-8 space-y-6">
        
        {/* TOP APP BAR WITH BACK BUTTON (← Voltar) */}
        <div className="w-full pb-4 border-b border-amber-500/20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-black font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <span className="text-xs font-bold text-amber-300/80 uppercase tracking-widest hidden sm:inline">
            Publicação do Ala X
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(book.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-white/5 border-amber-500/20 text-gray-400 hover:text-rose-400'
              }`}
              title="Favoritar"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* BOOK HERO SHOWCASE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COVER IMAGE WITH FULLSCREEN ZOOM TRIGGER */}
          <div
            onClick={() => setIsImageViewerOpen(true)}
            className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-400/50 shadow-2xl"
          >
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-72 md:h-80 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-300 gap-2 p-4 text-center">
              <Maximize2 className="w-8 h-8 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider">Toque para ampliar imagem</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                  {book.category}
                </span>

                {book.status === 'em_lancamento' ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span>Em Lançamento</span>
                    {book.latestChapterNumber && (
                      <span className="text-amber-400 font-extrabold">• Cap. {book.latestChapterNumber}</span>
                    )}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                    Completo
                  </span>
                )}

                <span className="text-xs text-amber-300/80">
                  {book.publishedYear || 2026} • {book.pageCount || 180} Páginas
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">{book.title}</h2>
              <p className="text-sm text-amber-300 font-bold">Por {book.author}</p>

              {/* RATING SUMMARY - CLICKING REDIRECTS TO REVIEWS & PEOPLE WHO RATED */}
              <div 
                onClick={() => setActiveTab('reviews')}
                className="inline-flex items-center gap-3 pt-1 cursor-pointer group/rating hover:bg-amber-500/10 p-1.5 rounded-xl transition-all"
                title="Clique para ver todas as avaliações e as pessoas que avaliaram a obra"
              >
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(ratingStats.average) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-black text-white">{ratingStats.average}</span>
                <span className="text-xs text-amber-300 font-bold group-hover/rating:underline">
                  ({ratingStats.total} avaliações - ver leitores)
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-amber-200">{book.downloadCount || 0} downloads</span>
              </div>

              {/* SYNOPSIS / PUBLICATION TEXT - CLICK TO SHOW FULLY */}
              <div 
                onClick={() => setIsSynopsisExpandedModal(!isSynopsisExpandedModal)}
                className="pt-2 cursor-pointer group/synopsis"
                title="Clique para expandir/recolher o texto completo da publicação"
              >
                <p className={`text-xs text-gray-200 leading-relaxed transition-all ${
                  isSynopsisExpandedModal ? '' : 'line-clamp-4 text-gray-300 group-hover/synopsis:text-white'
                }`}>
                  {book.synopsis}
                </p>
                <span className="text-[10px] font-extrabold text-amber-400 flex items-center gap-1 pt-1 hover:underline">
                  {isSynopsisExpandedModal ? (
                    <><span>Recolher texto</span><ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <><span>Ver texto completo da publicação</span><ChevronDown className="w-3 h-3" /></>
                  )}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={() => {
                  if (isGuest) {
                    onRequireAuth?.('Para utilizar esta funcionalidade, inicie sessão ou crie uma conta.');
                  } else {
                    onOpenPdfReader(book);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ler Obra em PDF</span>
              </button>

              <button
                onClick={() => {
                  if (isGuest) {
                    onRequireAuth?.('Para utilizar esta funcionalidade, inicie sessão ou crie uma conta.');
                  } else {
                    onStartDownload(book);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/30 font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar PDF</span>
              </button>

              <button
                onClick={() => onShare ? onShare(book) : null}
                className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Partilhar</span>
              </button>

              <button
                onClick={() => {
                  if (isGuest) {
                    onRequireAuth?.('Para utilizar esta funcionalidade, inicie sessão ou crie uma conta.');
                  } else {
                    onToggleFavorite(book.id);
                  }
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-white/5 border-amber-500/20 text-gray-400 hover:text-rose-400'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* TABS SWITCHER */}
        <div className="border-b border-amber-500/20 flex items-center gap-6 overflow-x-auto">
          {(book.status === 'em_lancamento' || (book.chapters && book.chapters.length > 0)) && (
            <button
              onClick={() => setActiveTab('chapters')}
              className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'chapters'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Capítulos Lançados ({book.chapters?.length || 0})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Avaliações ({reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'comments'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comentários ({comments.length})</span>
          </button>
        </div>

        {/* TAB 0: CAPÍTULOS LANÇADOS (OBRA EM LANÇAMENTO) */}
        {activeTab === 'chapters' && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-[#181a26] border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  Publicação em Série
                </span>
                <h4 className="font-extrabold text-white text-sm pt-1">
                  {book.chapters?.length || 0} Capítulo(s) Disponível(eis)
                </h4>
                <p className="text-xs text-gray-400">
                  Acompanhe a obra à medida que novos capítulos são disponibilizados pelo autor.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsAddingChapterInline(!isAddingChapterInline)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAddingChapterInline ? 'Fechar Form' : '➕ Lançar Novo Capítulo'}</span>
                </button>

                <button
                  onClick={() => onStartDownload(book)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descarregar Todos</span>
                </button>
              </div>
            </div>

            {/* INLINE FORM FOR PUBLISHING A NEW CHAPTER */}
            {isAddingChapterInline && (
              <form onSubmit={handleSaveChapterInline} className="p-4 rounded-2xl bg-[#11131e] border border-emerald-500/40 space-y-3 animate-fadeIn">
                <h5 className="font-bold text-xs text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Lançar Capítulo para "{book.title}"</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-200">N.º Capítulo *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={chapNumberInline}
                      onChange={(e) => setChapNumberInline(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-100 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-amber-200">Título do Capítulo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Capítulo 2: O Despertar"
                      value={chapTitleInline}
                      onChange={(e) => setChapTitleInline(e.target.value)}
                      className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-100 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200">Resumo/Descrição (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: O segredo é finalmente revelado..."
                    value={chapDescInline}
                    onChange={(e) => setChapDescInline(e.target.value)}
                    className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-100 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-200">Ficheiro PDF do Capítulo *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="https://exemplo.com/capitulo2.pdf"
                        value={chapPdfUrlInline}
                        onChange={(e) => setChapPdfUrlInline(e.target.value)}
                        className="flex-1 bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-100 outline-none"
                      />
                      <label className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-[11px] cursor-pointer border border-emerald-500/30 shrink-0">
                        <span>Carregar PDF</span>
                        <input type="file" accept="application/pdf" onChange={handleChapPdfUploadInline} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-200">N.º de Páginas</label>
                    <input
                      type="number"
                      min={1}
                      value={chapPageCountInline}
                      onChange={(e) => setChapPageCountInline(parseInt(e.target.value) || 15)}
                      className="w-full bg-[#181a26] border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-100 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingChapterInline(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 text-gray-400 text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingChapInline}
                    className="px-5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingChapInline ? 'Publicando...' : '🚀 Publicar Capítulo'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {!book.chapters || book.chapters.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-400 italic">
                  O primeiro capítulo desta obra será disponibilizado em breve.
                </p>
              ) : (
                book.chapters.map((chap) => (
                  <div
                    key={chap.id}
                    className="p-4 rounded-2xl bg-[#181a26] border border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-sm shrink-0">
                        {chap.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-white text-sm">{chap.title}</h5>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold border border-emerald-500/30">
                            Liberado
                          </span>
                        </div>
                        {chap.description && (
                          <p className="text-xs text-gray-300 pt-0.5">{chap.description}</p>
                        )}
                        <p className="text-[10px] text-gray-400 pt-1">
                          {chap.pageCount} páginas • {chap.fileSizeFormatted || 'PDF'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => onOpenPdfReader({
                          ...book,
                          pdfUrl: chap.pdfUrl,
                          title: `${book.title} - ${chap.title}`
                        })}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ler</span>
                      </button>

                      <button
                        onClick={() => onStartDownload({
                          ...book,
                          pdfUrl: chap.pdfUrl,
                          title: `${book.title} - ${chap.title}`
                        })}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 1: AVALIAÇÕES (Play Store Style) */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
            
            {/* PLAY STORE RATING BREAKDOWN BOARD */}
            <div className="p-5 rounded-2xl bg-[#181a26] border border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              
              {/* SCORE BIG BADGE */}
              <div className="text-center sm:border-r sm:border-amber-500/20 space-y-1">
                <span className="text-4xl font-black text-white font-mono">{ratingStats.average}</span>
                <div className="flex justify-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(ratingStats.average) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">{ratingStats.total} avaliações no total</p>
              </div>

              {/* STAR PROGRESS BARS (Play Store style) */}
              <div className="sm:col-span-2 space-y-1.5">
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const count = ratingStats.counts[starNum as 1|2|3|4|5] || 0;
                  const pct = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                  return (
                    <div key={starNum} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-right font-bold text-gray-300">{starNum}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[10px] text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* AVALIAR BUTTON & FORM */}
            <div>
              {!userExistingReview ? (
                <button
                  onClick={() => setIsRatingFormOpen(!isRatingFormOpen)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-xs transition-all cursor-pointer border border-amber-500/30"
                >
                  {isRatingFormOpen ? 'Cancelar' : '★ Avaliar esta Obra'}
                </button>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xs text-amber-200">Já submeteu a sua avaliação para esta obra.</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStars(userExistingReview.rating);
                        setReviewText(userExistingReview.comment);
                        setIsRatingFormOpen(true);
                      }}
                      className="text-xs font-bold text-amber-400 underline cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleDeleteUserReview}
                      className="text-xs font-bold text-rose-400 underline cursor-pointer"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              )}

              {/* RATING FORM (Stars -> Experience field -> Submit) */}
              {isRatingFormOpen && (
                <form onSubmit={handleSaveReview} className="mt-4 p-4 rounded-2xl bg-[#181a29] border border-amber-500/30 space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-200">1. Escolha a sua classificação (1 a 5 estrelas)</label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelectedStars(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125"
                        >
                          <Star
                            className={`w-7 h-7 ${star <= selectedStars ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-200">2. Escreva a sua experiência (opcional)</label>
                    <textarea
                      rows={3}
                      placeholder="Escreva a sua experiência com a obra (opcional)..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full bg-[#12141f] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-xs font-bold text-rose-400">{reviewError}</p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRatingFormOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-5 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md"
                    >
                      Enviar Avaliação
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* PLAY STORE STYLE REVIEWS LIST */}
            {reviews.length === 0 ? (
              <div className="p-6 text-center bg-[#181a26] border border-amber-500/20 rounded-2xl space-y-2">
                <Star className="w-8 h-8 text-amber-400/50 mx-auto" />
                <p className="text-xs font-bold text-gray-300">Nenhuma avaliação registada ainda.</p>
                <p className="text-[11px] text-gray-400">Seja o primeiro leitor a avaliar e a partilhar a sua opinião sobre esta obra!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-amber-200 flex items-center gap-1.5 pt-2">
                  <UserIcon className="w-4 h-4 text-amber-400" />
                  <span>Leitores que Avaliaram ({reviews.length})</span>
                </h5>
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-[#181a26] border border-amber-500/15 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={r.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                          alt={r.userName}
                          className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                        />
                        <div>
                          <span className="font-bold text-white text-xs block">{r.userName}</span>
                          <span className="text-[10px] text-gray-400">Leitor do Ala X</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3.5 h-3.5 ${st <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {r.comment && (
                      <p className="text-xs text-amber-100 italic pt-1">"{r.comment}"</p>
                    )}
                    <span className="text-[10px] text-gray-500 block pt-1">
                      Avaliado em {new Date(r.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: COMENTÁRIOS (Facebook Style) */}
        {activeTab === 'comments' && (
          <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
            
            {/* SORTING CONTROLS */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold">
                {comments.length} Comentários em tempo real
              </span>

              <select
                value={commentSortBy}
                onChange={(e) => setCommentSortBy(e.target.value as any)}
                className="bg-[#181a26] border border-amber-500/20 rounded-xl px-3 py-1 text-xs text-amber-200 outline-none"
              >
                <option value="relevant">Mais Relevantes</option>
                <option value="recent">Mais Recentes</option>
                <option value="oldest">Mais Antigos</option>
              </select>
            </div>

            {/* CREATE COMMENT INPUT WITH @MENTIONS */}
            <form onSubmit={handlePostComment} className="space-y-2 relative">
              {replyingToCommentId && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 text-xs text-amber-300 border border-amber-500/30">
                  <span>A responder a um comentário...</span>
                  <button onClick={() => setReplyingToCommentId(null)} className="text-rose-400 font-bold">
                    Cancelar Resposta
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Escreva um comentário... Use @ para mencionar alguém"
                  value={commentText}
                  onChange={(e) => handleCommentTextChange(e.target.value)}
                  className="w-full bg-[#181a26] border border-amber-500/30 rounded-2xl p-3 pr-12 text-xs text-amber-100 outline-none focus:border-amber-400 resize-none"
                />

                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-3 bottom-3 p-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* @MENTION POPUP LIST */}
              {showMentionsList && (
                <div className="absolute top-full left-0 z-30 w-64 bg-[#181a29] border border-amber-500/40 rounded-xl shadow-xl p-1 max-h-36 overflow-y-auto">
                  {systemUsers
                    .filter(u => u.name.toLowerCase().includes(mentionQuery))
                    .map(u => (
                      <div
                        key={u.id}
                        onClick={() => insertMentionUser(u)}
                        className="p-2 hover:bg-amber-500/20 text-xs text-amber-100 font-bold rounded-lg cursor-pointer flex items-center gap-2"
                      >
                        <img src={u.photoURL || u.avatar} alt={u.name} className="w-5 h-5 rounded-full" />
                        <span>{u.name}</span>
                      </div>
                    ))}
                </div>
              )}
            </form>

            {/* COMMENTS LIST (THREAD HIERARCHY) */}
            <div className="space-y-4">
              {sortedRootComments.map((comm) => {
                const isWorkAuthor = comm.userId === book.authorUserId || comm.userName.toLowerCase() === book.author.toLowerCase();
                const hasLiked = comm.likedBy?.includes(currentUser?.uid || currentUser?.id || '');
                const replies = comments.filter(c => c.parentId === comm.id);

                return (
                  <div
                    key={comm.id}
                    id={`comment-${comm.id}`}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      comm.id === targetCommentId
                        ? 'bg-amber-500/25 border-amber-400 ring-4 ring-amber-500/40 shadow-2xl animate-pulse'
                        : comm.pinned
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                        : isWorkAuthor
                        ? 'bg-[#1b1c2e] border-amber-400/40'
                        : 'bg-[#181a26] border-amber-500/15'
                    }`}
                  >
                    {comm.pinned && (
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                        <Pin className="w-3 h-3 fill-amber-400" />
                        <span>Comentário Fixado no Topo</span>
                      </div>
                    )}

                    {/* COMMENT HEADER */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={comm.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                          alt={comm.userName}
                          className="w-8 h-8 rounded-full object-cover border border-amber-400/50"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{comm.userName}</span>
                            
                            {/* REQUIREMENT 8: AUTOR BADGE (ONLY 'Autor', NEVER Administrator/Publisher) */}
                            {isWorkAuthor && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider shadow-sm">
                                Autor
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comm.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* EDIT / DELETE FOR OWNER */}
                      {currentUser && comm.userId === (currentUser.uid || currentUser.id) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingCommentId(comm.id); setEditCommentText(comm.text); }}
                            className="text-gray-400 hover:text-amber-300 text-xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => dbDeleteComment(comm.id)}
                            className="text-gray-400 hover:text-rose-400 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* COMMENT TEXT */}
                    {editingCommentId === comm.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full bg-[#12141f] border border-amber-500/30 rounded-xl p-2 text-xs text-amber-100"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-400">Cancelar</button>
                          <button onClick={() => handleUpdateCommentSubmit(comm.id)} className="text-xs font-bold text-amber-400">Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-100 leading-relaxed">{comm.text}</p>
                    )}

                    {/* COMMENT ACTIONS FOOTER */}
                    <div className="flex items-center gap-4 pt-1 border-t border-amber-500/10 text-xs text-gray-400">
                      
                      {/* LIKE */}
                      <button
                        onClick={() => currentUser && dbToggleCommentLike(comm.id, currentUser.uid || currentUser.id)}
                        className={`flex items-center gap-1 cursor-pointer transition-all ${
                          hasLiked ? 'text-amber-400 font-bold' : 'hover:text-white'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-amber-400' : ''}`} />
                        <span>{comm.likesCount || 0} Gosto</span>
                      </button>

                      {/* REPLY */}
                      <button
                        onClick={() => setReplyingToCommentId(comm.id)}
                        className="flex items-center gap-1 hover:text-white cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Responder</span>
                      </button>

                      {/* COPY TEXT */}
                      <button
                        onClick={() => navigator.clipboard.writeText(comm.text)}
                        className="flex items-center gap-1 hover:text-white cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </button>

                      {/* REPORT */}
                      <button
                        onClick={() => currentUser && dbReportComment(comm.id, currentUser.uid || currentUser.id)}
                        className="flex items-center gap-1 hover:text-rose-400 cursor-pointer ml-auto"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Denunciar</span>
                      </button>
                    </div>

                    {/* REPLIES THREAD */}
                    {replies.length > 0 && (
                      <div className="pl-6 border-l-2 border-amber-500/20 space-y-2 pt-2">
                        {replies.map((reply) => (
                          <div key={reply.id} className="p-2.5 rounded-xl bg-[#141624] border border-amber-500/10 space-y-1">
                            <div className="flex items-center gap-2">
                              <img src={reply.userAvatar} alt={reply.userName} className="w-5 h-5 rounded-full" />
                              <span className="font-bold text-white text-[11px]">{reply.userName}</span>
                            </div>
                            <p className="text-xs text-gray-300">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

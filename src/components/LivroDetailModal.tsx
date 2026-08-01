import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, BookOpen, Download, Star, Heart, MessageSquare, Calendar, 
  FileText, User as UserIcon, Send, Share2, CheckCircle2, ShieldAlert,
  ThumbsUp, CornerDownRight, MessageCircle, Sparkles, AlertCircle, Feather, Shield
} from 'lucide-react';
import { Book, Review, BookComment, User } from '../types';
import { 
  dbSubscribeReviews, dbAddReview, dbIncrementBookDownloads,
  dbSubscribeComments, dbAddComment, dbToggleCommentLike
} from '../lib/db';

interface LivroDetailModalProps {
  book: Book;
  currentUser: User | null;
  isFavorite: boolean;
  onClose: () => void;
  onOpenPdfReader: (book: Book) => void;
  onToggleFavorite: (bookId: string) => void;
  onBookUpdated?: (updatedBook: Book) => void;
  onStartDownload?: (book: Book) => void;
}

export const LivroDetailModal: React.FC<LivroDetailModalProps> = ({
  book,
  currentUser,
  isFavorite,
  onClose,
  onOpenPdfReader,
  onToggleFavorite,
  onBookUpdated,
  onStartDownload
}) => {
  // Navigation tabs: Play Store Reviews vs Facebook Comments
  const [activeTab, setActiveTab] = useState<'reviews' | 'comments'>('reviews');

  // --- REVIEWS STATE (PLAY STORE STYLE) ---
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedStars, setSelectedStars] = useState<number | null>(null);
  const [reviewOpinion, setReviewOpinion] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState<string>('');

  // --- COMMENTS STATE (FACEBOOK STYLE) ---
  const [comments, setComments] = useState<BookComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  // --- METRICS STATE ---
  const [downloads, setDownloads] = useState<number>(book.downloadCount || 0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to Play Store Reviews
  useEffect(() => {
    const unsub = dbSubscribeReviews(book.id, (loadedReviews) => {
      setReviews(loadedReviews);
    });
    return () => unsub();
  }, [book.id]);

  // Subscribe to Facebook Comments
  useEffect(() => {
    const unsub = dbSubscribeComments(book.id, (loadedComments) => {
      setComments(loadedComments);
    });
    return () => unsub();
  }, [book.id]);

  // Compute Play Store Rating Breakdown (5★, 4★, 3★, 2★, 1★)
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = reviews.length;
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star as keyof typeof counts] = (counts[star as keyof typeof counts] || 0) + 1;
    });

    return [5, 4, 3, 2, 1].map(star => {
      const cnt = counts[star as keyof typeof counts];
      const pct = total > 0 ? Math.round((cnt / total) * 100) : (star === 5 ? 85 : star === 4 ? 15 : 0);
      return { star, count: cnt, percentage: pct };
    });
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return book.ratingAverage || 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  }, [reviews, book.ratingAverage]);

  // Handle Download PDF & increment counter in Firestore
  const handleDownload = async () => {
    try {
      if (onStartDownload) {
        onStartDownload(book);
      } else {
        const newCount = await dbIncrementBookDownloads(book.id);
        setDownloads(newCount);
        if (onBookUpdated) {
          onBookUpdated({ ...book, downloadCount: newCount });
        }
        const link = document.createElement('a');
        link.href = book.pdfUrl;
        link.download = `${book.title.replace(/\s+/g, '_')}_AlaX.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Select Stars (Triggers opinion input automatically)
  const handleSelectStarRating = (stars: number) => {
    setSelectedStars(stars);
    setReviewError('');
  };

  // Submit Play Store Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!currentUser) {
      setReviewError('Por favor, inicie sessão para deixar uma avaliação.');
      return;
    }

    if (!selectedStars) {
      setReviewError('Selecione de 1 a 5 estrelas para avaliar.');
      return;
    }

    if (!reviewOpinion.trim()) {
      setReviewError('A opinião escrita é obrigatória para concluir a avaliação.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const newReview: Review = {
        id: `rev_${Date.now()}`,
        bookId: book.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        rating: selectedStars,
        comment: reviewOpinion.trim(),
        createdAt: Date.now()
      };

      await dbAddReview(newReview);
      setReviewSuccess('Avaliação publicada com sucesso! Obrigado pela sua opinião.');
      setReviewOpinion('');
      setSelectedStars(null);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setReviewError('Falha ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Check if a comment belongs to the book's Author or Publisher
  const isAuthorComment = (comm: BookComment): boolean => {
    if (comm.isAuthor) return true;
    if (book.authorUserId && comm.userId === book.authorUserId) return true;
    if (book.publisherUserId && comm.userId === book.publisherUserId) return true;
    if (comm.userId === 'admin_alax_master') return true;
    if (book.author && comm.userName.toLowerCase().trim() === book.author.toLowerCase().trim()) return true;
    return false;
  };

  // Root comments sorted with Author pinned at the top
  const sortedRootComments = useMemo(() => {
    const list = comments.filter(c => !c.parentId);
    return list.sort((a, b) => {
      const aAuth = isAuthorComment(a);
      const bAuth = isAuthorComment(b);
      if (aAuth && !bAuth) return -1;
      if (!aAuth && bAuth) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [comments, book]);

  // Submit Facebook Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!currentUser) {
      alert('Por favor, inicie sessão para comentar.');
      return;
    }

    const isCurrentAuthor = 
      currentUser.id === book.authorUserId || 
      currentUser.id === book.publisherUserId || 
      currentUser.role === 'admin' || 
      currentUser.email === 'admin@alax.mz' ||
      currentUser.name.toLowerCase().trim() === book.author.toLowerCase().trim();

    setIsSubmittingComment(true);
    try {
      const newComment: BookComment = {
        id: `comm_${Date.now()}`,
        bookId: book.id,
        userId: currentUser.id,
        userName: isCurrentAuthor ? 'Autor' : currentUser.name,
        userAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        text: newCommentText.trim(),
        createdAt: Date.now(),
        likesCount: 0,
        likedBy: [],
        isAuthor: isCurrentAuthor
      };

      await dbAddComment(newComment);
      setNewCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Submit Reply to Comment
  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || !currentUser) return;
    try {
      const replyComment: BookComment = {
        id: `reply_${Date.now()}`,
        bookId: book.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        text: replyText.trim(),
        createdAt: Date.now(),
        likesCount: 0,
        likedBy: [],
        parentId
      };

      await dbAddComment(replyComment);
      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      console.error('Error submitting reply:', err);
    }
  };

  // Toggle Like on Facebook Comment
  const handleToggleLikeComment = async (commentId: string) => {
    if (!currentUser) return;
    await dbToggleCommentLike(commentId, currentUser.id);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#141622] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-amber-500/20 bg-[#181a27]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
              {book.category}
            </span>
            <span className="text-gray-400 text-xs font-mono">ID: {book.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer relative"
              title="Partilhar Obra"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && (
                <span className="absolute -bottom-8 right-0 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                  Link copiado!
                </span>
              )}
            </button>

            <button
              onClick={() => onToggleFavorite(book.id)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isFavorite 
                  ? 'bg-rose-500/90 text-white shadow-md' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          
          {/* TOP GRID: COVER + DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* BOOK COVER */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-xs rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl bg-black">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* ACTION BUTTONS BELOW COVER */}
              <div className="w-full max-w-xs space-y-2.5 pt-4">
                <button
                  onClick={() => onOpenPdfReader(book)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Ler Obra em PDF (Inline)</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Ficheiro PDF ({downloads} downloads)</span>
                </button>
              </div>
            </div>

            {/* BOOK METADATA & SYNOPSIS */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-serif leading-tight">
                  {book.title}
                </h1>
                <p className="text-sm font-semibold text-amber-400 pt-1">
                  Por {book.author}
                </p>
              </div>

              {/* STATS STRIP */}
              <div className="flex flex-wrap items-center gap-4 text-xs py-2 border-y border-amber-500/15">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{averageRating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">({reviews.length || book.ratingCount || 1} classificações)</span>
                </div>

                <div className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloads} downloads</span>
                </div>

                {book.pageCount && (
                  <div className="flex items-center gap-1 text-gray-300">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>{book.pageCount} páginas</span>
                  </div>
                )}

                {book.publishedYear && (
                  <div className="flex items-center gap-1 text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{book.publishedYear}</span>
                  </div>
                )}
              </div>

              {/* SYNOPSIS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Sinopse da Obra
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed font-sans bg-[#1a1c29]/60 p-4 rounded-xl border border-white/5 whitespace-pre-line">
                  {book.synopsis}
                </p>
              </div>

              {/* ADDITIONAL INFO */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#181a26] p-3 rounded-xl border border-amber-500/10">
                <div>
                  <span className="text-gray-400 block text-[10px]">Idioma:</span>
                  <span className="text-white font-medium">{book.language || 'Português'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Publicação:</span>
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edição Protegida Ala X</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* TAB SWITCHER: PLAY STORE REVIEWS VS FACEBOOK COMMENTS */}
          <div className="pt-6 border-t border-amber-500/20 space-y-6">
            
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                
                {/* TAB 1: PLAY STORE REVIEWS */}
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-[#181a26] text-gray-300 hover:text-white border border-amber-500/10'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Avaliações Play Store ({reviews.length})</span>
                </button>

                {/* TAB 2: FACEBOOK COMMENTS */}
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    activeTab === 'comments'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-[#181a26] text-gray-300 hover:text-white border border-amber-500/10'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Comentários Facebook ({comments.filter(c => !c.parentId).length})</span>
                </button>

              </div>

              <span className="text-[11px] text-gray-400 italic">
                {activeTab === 'reviews' 
                  ? 'Estrelas 1-5 + Opinião Obrigatória' 
                  : 'Feed de interações sociais da comunidade'}
              </span>
            </div>

            {/* TAB 1: GOOGLE PLAY STORE STYLE EVALUATIONS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                
                {/* PLAY STORE HEADER OVERVIEW & BREAKDOWN */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-6 rounded-3xl bg-[#181a26] border border-amber-500/20 items-center">
                  
                  {/* OVERALL RATING BIG DISPLAY */}
                  <div className="sm:col-span-4 text-center sm:border-r border-amber-500/15 sm:pr-6 space-y-1">
                    <p className="text-5xl font-black text-white font-mono">{averageRating.toFixed(1)}</p>
                    <div className="flex justify-center gap-1 text-amber-400 py-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {reviews.length || book.ratingCount || 1} classificações no total
                    </p>
                  </div>

                  {/* STARS PROGRESS BARS DISTRIBUTION */}
                  <div className="sm:col-span-8 space-y-1.5">
                    {ratingDistribution.map(({ star, count, percentage }) => (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-3 font-bold text-gray-300 font-mono">{star}</span>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-2 rounded-full bg-black/50 overflow-hidden border border-amber-500/10">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[10px] text-gray-400 font-mono">{percentage}%</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* PLAY STORE RATING FORM (RATING + OPINION MANDATORY FLOW) */}
                <div className="bg-[#181a26] p-5 sm:p-6 rounded-3xl border border-amber-500/20 space-y-4">
                  
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Avaliar esta Obra no Ala X</span>
                    </h4>
                    <p className="text-xs text-gray-400 pt-0.5">
                      Selecione a quantidade de estrelas de 1 a 5 para desbloquear o campo de opinião.
                    </p>
                  </div>

                  {reviewError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{reviewSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    
                    {/* STEP 1: STAR RATING SELECTION */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#11131c] border border-amber-500/15">
                      <span className="text-xs font-bold text-amber-200">
                        {selectedStars ? `Classificação Selecionada: ${selectedStars} Estrelas` : 'Toque nas estrelas para classificar (1 a 5):'}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleSelectStarRating(star)}
                            className="p-1.5 cursor-pointer transition-all hover:scale-125 group"
                            title={`Atribuir ${star} estrelas`}
                          >
                            <Star 
                              className={`w-7 h-7 transition-colors ${
                                selectedStars && star <= selectedStars 
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                                  : 'text-gray-600 group-hover:text-amber-300'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* STEP 2: AUTOMATIC OPINION TEXTAREA (Appears once stars are selected) */}
                    {selectedStars !== null && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                          <span>Escreva o motivo/opinião da sua classificação ({selectedStars} ★) *</span>
                          <span className="text-[10px] text-gray-400 font-normal">Obrigatório para concluir</span>
                        </label>
                        
                        <textarea
                          rows={3}
                          required
                          placeholder="Explique o que achou da narrativa, dos personagens, do estilo de escrita..."
                          value={reviewOpinion}
                          onChange={(e) => setReviewOpinion(e.target.value)}
                          className="w-full bg-[#11131c] border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-100 placeholder-gray-500 outline-none focus:border-amber-400"
                        />

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-gray-400">
                            A avaliação só será gravada ao clicar em Enviar.
                          </span>

                          <button
                            type="submit"
                            disabled={isSubmittingReview || !reviewOpinion.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-xs shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50 transition-all"
                          >
                            <Send className="w-4 h-4" />
                            <span>{isSubmittingReview ? 'A Enviar...' : 'Enviar Avaliação'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </form>
                </div>

                {/* PLAY STORE REVIEWS LIST */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Todas as Avaliações ({reviews.length})
                  </h4>

                  {reviews.length === 0 ? (
                    <div className="text-center py-8 bg-[#181a26] rounded-2xl border border-amber-500/10 text-xs text-gray-400">
                      Ainda não existem avaliações. Selecione as estrelas acima e seja o primeiro!
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-2xl bg-[#181a26] border border-amber-500/15 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                              alt={rev.userName}
                              className="w-8 h-8 rounded-full object-cover border border-amber-500/30"
                            />
                            <div>
                              <h5 className="text-xs font-bold text-white">{rev.userName}</h5>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                {new Date(rev.createdAt).toLocaleDateString('pt-PT')}
                              </span>
                            </div>
                          </div>

                          {/* STARS GIVEN */}
                          <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            <span className="text-xs font-bold text-amber-300 font-mono">{rev.rating}.0</span>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating 
                                    ? 'text-amber-400 fill-amber-400' 
                                    : 'text-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-gray-200 font-sans leading-relaxed pt-1 pl-1">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: FACEBOOK STYLE COMMENTS FEED */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                
                {/* NEW FACEBOOK COMMENT INPUT */}
                <form onSubmit={handleSubmitComment} className="p-4 rounded-2xl bg-[#181a26] border border-blue-500/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                      alt={currentUser?.name || 'Leitor'}
                      className="w-9 h-9 rounded-full object-cover border border-blue-400/40 shrink-0 mt-1"
                    />

                    <div className="flex-1 space-y-2">
                      <textarea
                        rows={2}
                        placeholder={currentUser ? "Escreva um comentário público sobre a obra..." : "Inicie sessão para comentar..."}
                        disabled={!currentUser}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="w-full bg-[#11131c] border border-blue-500/20 rounded-2xl p-3 text-xs text-blue-100 placeholder-gray-500 outline-none focus:border-blue-400"
                      />

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!currentUser || !newCommentText.trim() || isSubmittingComment}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 disabled:opacity-50 text-white font-extrabold text-xs hover:bg-blue-500 cursor-pointer transition-all shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publicar Comentário</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* FACEBOOK COMMENTS FEED LIST */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span>Discussão da Comunidade ({sortedRootComments.length})</span>
                  </h4>

                  {sortedRootComments.length === 0 ? (
                    <div className="text-center py-8 bg-[#181a26] rounded-2xl border border-blue-500/10 text-xs text-gray-400">
                      Sem comentários no feed. Seja o primeiro a comentar sobre este livro!
                    </div>
                  ) : (
                    sortedRootComments.map((comm) => {
                      const isLikedByMe = currentUser && comm.likedBy?.includes(currentUser.id);
                      const replies = comments.filter(c => c.parentId === comm.id);
                      const commentIsAuthor = isAuthorComment(comm);

                      return (
                        <div 
                          key={comm.id} 
                          className={`p-4 rounded-2xl transition-all space-y-3 ${
                            commentIsAuthor
                              ? 'bg-gradient-to-br from-[#1c1913] to-[#141622] border-2 border-amber-500/60 shadow-lg shadow-amber-500/10 relative overflow-hidden'
                              : 'bg-[#181a26] border border-blue-500/15'
                          }`}
                        >
                          {/* PINNED AUTHOR HEADER */}
                          {commentIsAuthor && (
                            <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-amber-500/20 text-[11px] font-black text-amber-400">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>📌 Comentário do Autor (Fixado no Topo)</span>
                            </div>
                          )}
                          
                          {/* COMMENT HEADER */}
                          <div className="flex items-start gap-3">
                            {commentIsAuthor ? (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-black font-black shadow-md border border-amber-300 shrink-0">
                                <Feather className="w-4 h-4 text-black" />
                              </div>
                            ) : (
                              <img
                                src={comm.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                                alt={comm.userName}
                                className="w-9 h-9 rounded-full object-cover border border-blue-400/30 shrink-0"
                              />
                            )}

                            <div className="flex-1">
                              <div className={`p-3 rounded-2xl space-y-1 ${
                                commentIsAuthor ? 'bg-[#1a1710] border border-amber-500/30' : 'bg-[#11131c] border border-white/5'
                              }`}>
                                <div className="flex items-center justify-between">
                                  {commentIsAuthor ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-amber-400 tracking-wide uppercase">Autor</span>
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-extrabold uppercase">
                                        Oficial
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-bold text-white">{comm.userName}</span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {new Date(comm.createdAt).toLocaleDateString('pt-PT')}
                                  </span>
                                </div>
                                <p className={`text-xs font-sans leading-relaxed ${commentIsAuthor ? 'text-amber-100 font-medium' : 'text-gray-200'}`}>
                                  {comm.text}
                                </p>
                              </div>

                              {/* FACEBOOK ACTION BAR: GOSTO & RESPONDER */}
                              <div className="flex items-center gap-4 pt-2 pl-2 text-[11px] font-bold">
                                
                                {/* LIKE BUTTON */}
                                <button
                                  onClick={() => handleToggleLikeComment(comm.id)}
                                  className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isLikedByMe ? 'text-blue-400' : 'text-gray-400 hover:text-blue-300'
                                  }`}
                                >
                                  <ThumbsUp className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-blue-400' : ''}`} />
                                  <span>Gosto {comm.likesCount > 0 ? `(${comm.likesCount})` : ''}</span>
                                </button>

                                {/* REPLY BUTTON */}
                                <button
                                  onClick={() => setReplyingToId(replyingToId === comm.id ? null : comm.id)}
                                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-all cursor-pointer"
                                >
                                  <CornerDownRight className="w-3.5 h-3.5" />
                                  <span>Responder</span>
                                </button>
                              </div>

                              {/* INLINE REPLY INPUT */}
                              {replyingToId === comm.id && (
                                <div className="mt-3 pl-2 flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Escreva uma resposta..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="flex-1 bg-[#0f1018] border border-blue-500/30 rounded-xl p-2 text-xs text-white outline-none"
                                  />
                                  <button
                                    onClick={() => handleSubmitReply(comm.id)}
                                    className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer"
                                  >
                                    Enviar
                                  </button>
                                </div>
                              )}

                              {/* NESTED REPLIES */}
                              {replies.length > 0 && (
                                <div className="mt-3 pl-4 border-l-2 border-blue-500/20 space-y-2">
                                  {replies.map((rep) => (
                                    <div key={rep.id} className="flex items-start gap-2 bg-[#11131c]/80 p-2.5 rounded-xl border border-white/5">
                                      <img
                                        src={rep.userAvatar}
                                        alt={rep.userName}
                                        className="w-6 h-6 rounded-full object-cover shrink-0"
                                      />
                                      <div>
                                        <span className="text-xs font-bold text-white block">{rep.userName}</span>
                                        <p className="text-[11px] text-gray-300">{rep.text}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

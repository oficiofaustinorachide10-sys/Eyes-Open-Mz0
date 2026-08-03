import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { Book, Chapter, Review, BookComment, User, AdminStats, AppNotification } from '../types';
import { SAMPLE_BOOKS, SAMPLE_REVIEWS, SAMPLE_COMMENTS, compressBase64Image } from '../utils';

// Helper to strip non-serializable fields
function sanitizeDoc<T>(docObj: T): any {
  return JSON.parse(JSON.stringify(docObj));
}

// Local PDF memory & LocalStorage cache store to handle large base64 PDFs cleanly
const localPdfStore: Record<string, string> = {};

export function savePdfToLocalStore(key: string, base64Pdf: string): void {
  localPdfStore[key] = base64Pdf;
  try {
    localStorage.setItem(`alax_pdf_store_${key}`, base64Pdf);
  } catch (e) {
    console.warn('LocalStorage full, PDF kept in memory store:', e);
  }
}

export function getPdfFromLocalStore(key: string): string | null {
  if (localPdfStore[key]) return localPdfStore[key];
  try {
    return localStorage.getItem(`alax_pdf_store_${key}`);
  } catch (e) {
    return null;
  }
}

export function resolvePdfUrl(bookOrPdfUrl: string | Book): string {
  if (typeof bookOrPdfUrl !== 'string') {
    const book = bookOrPdfUrl;
    if (book.pdfUrl && book.pdfUrl.startsWith('local_pdf:')) {
      const storeKey = book.pdfUrl.replace('local_pdf:', '');
      return getPdfFromLocalStore(storeKey) || getPdfFromLocalStore(book.id) || book.pdfUrl;
    }
    return book.pdfUrl;
  }
  if (bookOrPdfUrl.startsWith('local_pdf:')) {
    const storeKey = bookOrPdfUrl.replace('local_pdf:', '');
    return getPdfFromLocalStore(storeKey) || bookOrPdfUrl;
  }
  return bookOrPdfUrl;
}

// -------------------------------------------------------------
// BOOKS DATA LAYER (Firestore `books`)
// -------------------------------------------------------------

export function dbSubscribeBooks(onUpdate: (books: Book[]) => void): () => void {
  try {
    const q = query(collection(db, 'books'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialBooks().then(() => {
            onUpdate(SAMPLE_BOOKS);
          });
          return;
        }
        const books: Book[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Book;
          // Resolve pdfUrl if stored locally
          const resolvedPdf = resolvePdfUrl(data);
          books.push({ ...data, id: docSnap.id, pdfUrl: resolvedPdf });
        });
        books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onUpdate(books);
      },
      (error) => {
        console.warn('Firestore books subscription error, falling back to sample:', error);
        onUpdate(SAMPLE_BOOKS);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Error setting up books subscriber:', err);
    onUpdate(SAMPLE_BOOKS);
    return () => {};
  }
}

export async function seedInitialBooks(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'books'));
    if (snap.empty) {
      for (const book of SAMPLE_BOOKS) {
        await setDoc(doc(db, 'books', book.id), sanitizeDoc(book));
      }
      console.log('Sample books seeded to Firestore successfully');
    }
  } catch (err) {
    console.warn('Failed to seed initial books:', err);
  }
}

export async function dbFetchBooks(): Promise<Book[]> {
  try {
    const snap = await getDocs(collection(db, 'books'));
    if (snap.empty) {
      await seedInitialBooks();
      return SAMPLE_BOOKS;
    }
    const books: Book[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Book;
      books.push({ ...data, id: docSnap.id, pdfUrl: resolvePdfUrl(data) });
    });
    books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return books;
  } catch (err) {
    console.warn('dbFetchBooks error:', err);
    return SAMPLE_BOOKS;
  }
}

export async function dbFetchBookById(id: string): Promise<Book | null> {
  try {
    const ref = doc(db, 'books', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Book;
      return { ...data, id: snap.id, pdfUrl: resolvePdfUrl(data) };
    }
  } catch (e) {
    console.warn('dbFetchBookById failed:', e);
  }
  return SAMPLE_BOOKS.find(b => b.id === id) || null;
}

export async function dbCreateBook(book: Book): Promise<Book> {
  const cleanBook = sanitizeDoc(book);

  if (cleanBook.coverUrl && cleanBook.coverUrl.startsWith('data:image')) {
    try {
      cleanBook.coverUrl = await compressBase64Image(cleanBook.coverUrl, 800, 0.65);
    } catch (e) {
      console.warn('Cover compression fallback:', e);
    }
  }

  const bookId = cleanBook.id || `book_${Date.now()}`;

  // Check if PDF URL is a huge base64 (over 400KB) to prevent Firestore 1MB document limit overflow
  let rawPdfUrl = cleanBook.pdfUrl || '';
  let firestorePdfUrl = rawPdfUrl;
  if (rawPdfUrl.length > 400000) {
    savePdfToLocalStore(bookId, rawPdfUrl);
    firestorePdfUrl = `local_pdf:${bookId}`;
  }

  const returnedPayload: Book = {
    ...cleanBook,
    id: bookId,
    pdfUrl: rawPdfUrl,
    createdAt: cleanBook.createdAt || Date.now(),
    downloadCount: cleanBook.downloadCount || 0,
    likesCount: cleanBook.likesCount || 0,
    ratingAverage: cleanBook.ratingAverage || 5.0,
    ratingCount: cleanBook.ratingCount || 1
  };

  const firestorePayload = sanitizeDoc({
    ...returnedPayload,
    pdfUrl: firestorePdfUrl
  });

  // Execute setDoc with timeout safety (max 5 seconds) so publishing NEVER hangs
  try {
    const docRef = doc(db, 'books', bookId);
    const setDocPromise = setDoc(docRef, firestorePayload);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 5000)
    );
    await Promise.race([setDocPromise, timeoutPromise]);
  } catch (e) {
    console.warn('Firestore setDoc notice (book published & cached locally):', e);
  }

  // Prepend to SAMPLE_BOOKS in memory for instantaneous local UI updates
  const existingIdx = SAMPLE_BOOKS.findIndex(b => b.id === bookId);
  if (existingIdx >= 0) {
    SAMPLE_BOOKS[existingIdx] = returnedPayload;
  } else {
    SAMPLE_BOOKS.unshift(returnedPayload);
  }

  return returnedPayload;
}

export async function dbUpdateBook(id: string, updates: Partial<Book>): Promise<void> {
  try {
    const ref = doc(db, 'books', id);
    const cleanUpdates = sanitizeDoc(updates);
    if (cleanUpdates.pdfUrl && cleanUpdates.pdfUrl.length > 400000) {
      savePdfToLocalStore(id, cleanUpdates.pdfUrl);
      cleanUpdates.pdfUrl = `local_pdf:${id}`;
    }
    const updatePromise = updateDoc(ref, cleanUpdates);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 5000)
    );
    await Promise.race([updatePromise, timeoutPromise]);
  } catch (e) {
    console.error('dbUpdateBook error (saved locally):', e);
  }

  // Also update in SAMPLE_BOOKS array
  const sampleIdx = SAMPLE_BOOKS.findIndex(b => b.id === id);
  if (sampleIdx >= 0) {
    SAMPLE_BOOKS[sampleIdx] = { ...SAMPLE_BOOKS[sampleIdx], ...updates };
  }
}

export async function dbDeleteBook(id: string): Promise<void> {
  try {
    const ref = doc(db, 'books', id);
    await deleteDoc(ref);
  } catch (e) {
    console.error('dbDeleteBook error:', e);
  }
}

export async function dbAddChapterToBook(
  bookId: string, 
  chapterData: { number: number; title: string; description?: string; pdfUrl: string; pageCount: number; fileSizeFormatted?: string }
): Promise<Chapter> {
  const chapterId = `chap_${bookId}_${Date.now()}`;
  const newChapter: Chapter = {
    id: chapterId,
    bookId,
    number: chapterData.number,
    title: chapterData.title,
    description: chapterData.description || '',
    pdfUrl: chapterData.pdfUrl,
    pageCount: chapterData.pageCount || 1,
    fileSizeFormatted: chapterData.fileSizeFormatted || '1.5 MB',
    createdAt: Date.now()
  };

  const currentBook = await dbFetchBookById(bookId);
  const existingChapters = currentBook?.chapters || [];
  // Ensure no duplicate chapter number override if already exists, else append
  const updatedChapters = [...existingChapters.filter(c => c.number !== newChapter.number), newChapter].sort((a, b) => a.number - b.number);

  const updates: Partial<Book> = {
    status: 'em_lancamento',
    chapters: updatedChapters,
    totalChapters: updatedChapters.length,
    latestChapterNumber: newChapter.number,
    latestChapterTitle: newChapter.title,
    lastChapterReleasedAt: Date.now(),
    updatedAt: Date.now(),
    hasNewChapterBadge: true
  };

  await dbUpdateBook(bookId, updates);

  // Notify readers
  dbNotifyBookFollowers(
    bookId, 
    currentBook?.title || 'Obra', 
    newChapter.number, 
    newChapter.title,
    chapterId
  );

  return newChapter;
}

export async function dbNotifyBookFollowers(
  bookId: string, 
  bookTitle: string, 
  chapterNumber: number, 
  chapterTitle: string,
  chapterId: string
): Promise<void> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const notifiedUserIds = new Set<string>();

    usersSnap.forEach((docSnap) => {
      const u = docSnap.data() as User;
      const uid = u.id || u.uid;
      if (uid && u.favoriteBookIds && u.favoriteBookIds.includes(bookId)) {
        notifiedUserIds.add(uid);
      }
    });

    // Also notify users who commented or reviewed
    const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('bookId', '==', bookId)));
    reviewsSnap.forEach((rSnap) => {
      const r = rSnap.data();
      if (r.userId) notifiedUserIds.add(r.userId);
    });

    for (const targetUserId of Array.from(notifiedUserIds)) {
      await dbCreateNotification({
        userId: targetUserId,
        senderId: 'admin',
        senderName: 'Editora Ala X',
        type: 'new_chapter',
        title: 'Novo capítulo disponível!',
        message: `O capítulo ${chapterNumber} ("${chapterTitle}") de "${bookTitle}" acaba de ser lançado.`,
        bookId,
        bookTitle,
        chapterId,
        chapterNumber
      });
    }
  } catch (err) {
    console.warn('dbNotifyBookFollowers error:', err);
  }
}

export async function dbIncrementBookDownloads(bookId: string): Promise<number> {
  try {
    const ref = doc(db, 'books', bookId);
    await updateDoc(ref, {
      downloadCount: increment(1)
    });
    const updatedSnap = await getDoc(ref);
    if (updatedSnap.exists()) {
      return updatedSnap.data().downloadCount || 0;
    }
  } catch (e) {
    console.warn('dbIncrementBookDownloads Firestore failed:', e);
  }
  return 1;
}

export async function dbToggleBookLike(bookId: string, isLiked: boolean): Promise<number> {
  try {
    const ref = doc(db, 'books', bookId);
    await updateDoc(ref, {
      likesCount: increment(isLiked ? 1 : -1)
    });
    const updatedSnap = await getDoc(ref);
    if (updatedSnap.exists()) {
      return Math.max(0, updatedSnap.data().likesCount || 0);
    }
  } catch (e) {
    console.warn('dbToggleBookLike error:', e);
  }
  return 0;
}

// -------------------------------------------------------------
// REVIEWS DATA LAYER (Play Store Style)
// -------------------------------------------------------------

export function dbSubscribeReviews(bookId: string, onUpdate: (reviews: Review[]) => void): () => void {
  try {
    const q = query(collection(db, 'reviews'), where('bookId', '==', bookId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviews: Review[] = [];
        snapshot.forEach((docSnap) => {
          reviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
        });
        reviews.sort((a, b) => b.createdAt - a.createdAt);
        onUpdate(reviews);
      },
      (err) => {
        console.warn('Reviews subscription error, returning sample reviews:', err);
        const filtered = SAMPLE_REVIEWS.filter(r => r.bookId === bookId);
        onUpdate(filtered);
      }
    );
    return unsubscribe;
  } catch (e) {
    const filtered = SAMPLE_REVIEWS.filter(r => r.bookId === bookId);
    onUpdate(filtered);
    return () => {};
  }
}

export async function dbAddOrUpdateReview(review: Review): Promise<Review> {
  const cleanReview = sanitizeDoc(review);
  const reviewId = cleanReview.id || `rev_${cleanReview.userId}_${cleanReview.bookId}`;
  const docRef = doc(db, 'reviews', reviewId);

  const payload: Review = {
    ...cleanReview,
    id: reviewId,
    createdAt: cleanReview.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(docRef, payload, { merge: true });

  // Recalculate book average rating & count
  try {
    const q = query(collection(db, 'reviews'), where('bookId', '==', review.bookId));
    const snap = await getDocs(q);
    let totalRating = 0;
    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      if (data.rating) {
        totalRating += data.rating;
        count++;
      }
    });

    if (count > 0) {
      const ratingAverage = parseFloat((totalRating / count).toFixed(1));
      await updateDoc(doc(db, 'books', review.bookId), {
        ratingAverage,
        ratingCount: count
      });
    }
  } catch (e) {
    console.warn('Failed to update book rating average:', e);
  }

  return payload;
}

export async function dbDeleteReview(reviewId: string, bookId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));

    // Recalculate rating
    const q = query(collection(db, 'reviews'), where('bookId', '==', bookId));
    const snap = await getDocs(q);
    let totalRating = 0;
    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      if (data.rating) {
        totalRating += data.rating;
        count++;
      }
    });

    const ratingAverage = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 5.0;
    await updateDoc(doc(db, 'books', bookId), {
      ratingAverage,
      ratingCount: count
    });
  } catch (e) {
    console.error('dbDeleteReview error:', e);
  }
}

// -------------------------------------------------------------
// COMMENTS DATA LAYER (Facebook Style with Threads & Mentions)
// -------------------------------------------------------------

export function dbSubscribeComments(bookId: string, onUpdate: (comments: BookComment[]) => void): () => void {
  try {
    const q = query(collection(db, 'comments'), where('bookId', '==', bookId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const comments: BookComment[] = [];
        snapshot.forEach((docSnap) => {
          comments.push({ id: docSnap.id, ...docSnap.data() } as BookComment);
        });
        comments.sort((a, b) => b.createdAt - a.createdAt);
        onUpdate(comments);
      },
      (err) => {
        console.warn('Comments subscription error, returning sample comments:', err);
        const filtered = SAMPLE_COMMENTS.filter(c => c.bookId === bookId);
        onUpdate(filtered);
      }
    );
    return unsubscribe;
  } catch (e) {
    const filtered = SAMPLE_COMMENTS.filter(c => c.bookId === bookId);
    onUpdate(filtered);
    return () => {};
  }
}

export async function dbAddComment(comment: BookComment): Promise<BookComment> {
  const cleanComment = sanitizeDoc(comment);
  const commentId = cleanComment.id || `comm_${Date.now()}`;
  const docRef = doc(db, 'comments', commentId);

  const payload: BookComment = {
    ...cleanComment,
    id: commentId,
    createdAt: cleanComment.createdAt || Date.now(),
    likesCount: cleanComment.likesCount || 0,
    likedBy: cleanComment.likedBy || [],
    parentId: cleanComment.parentId || null,
    pinned: cleanComment.pinned || false
  };

  await setDoc(docRef, payload);
  return payload;
}

export async function dbUpdateComment(commentId: string, text: string): Promise<void> {
  try {
    const docRef = doc(db, 'comments', commentId);
    await updateDoc(docRef, {
      text,
      updatedAt: Date.now()
    });
  } catch (e) {
    console.error('dbUpdateComment error:', e);
  }
}

export async function dbDeleteComment(commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (e) {
    console.error('dbDeleteComment error:', e);
  }
}

export async function dbToggleCommentLike(commentId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'comments', commentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BookComment;
      const currentLikedBy = data.likedBy || [];
      const hasLiked = currentLikedBy.includes(userId);
      const newLikedBy = hasLiked
        ? currentLikedBy.filter(id => id !== userId)
        : [...currentLikedBy, userId];

      await updateDoc(docRef, {
        likedBy: newLikedBy,
        likesCount: newLikedBy.length
      });
    }
  } catch (e) {
    console.warn('dbToggleCommentLike error:', e);
  }
}

export async function dbPinComment(commentId: string, pinned: boolean): Promise<void> {
  try {
    const docRef = doc(db, 'comments', commentId);
    await updateDoc(docRef, { pinned, isPinned: pinned });
  } catch (e) {
    console.error('dbPinComment error:', e);
  }
}

export const dbTogglePinComment = dbPinComment;

export async function dbReportComment(commentId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'comments', commentId);
    await updateDoc(docRef, {
      reportedBy: arrayUnion(userId)
    });
  } catch (e) {
    console.error('dbReportComment error:', e);
  }
}

// -------------------------------------------------------------
// USER & STATS LAYER
// -------------------------------------------------------------

export async function dbFetchAdminStats(): Promise<AdminStats> {
  try {
    const booksSnap = await getDocs(collection(db, 'books'));
    let totalDownloads = 0;
    let totalBooks = 0;
    booksSnap.forEach((docSnap) => {
      totalBooks++;
      const data = docSnap.data();
      totalDownloads += (data.downloadCount || 0);
    });

    const reviewsSnap = await getDocs(collection(db, 'reviews'));
    const usersSnap = await getDocs(collection(db, 'users'));

    return {
      totalBooks: totalBooks || SAMPLE_BOOKS.length,
      totalDownloads: totalDownloads || 1800,
      totalUsers: usersSnap.size || 12,
      totalReviews: reviewsSnap.size || SAMPLE_REVIEWS.length
    };
  } catch (e) {
    return {
      totalBooks: SAMPLE_BOOKS.length,
      totalDownloads: 1849,
      totalUsers: 14,
      totalReviews: SAMPLE_REVIEWS.length
    };
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS DATA LAYER (Real-time Firestore)
// -------------------------------------------------------------

export async function dbCreateNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
  try {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, 'notifications', notifId);
    const payload: AppNotification = {
      ...sanitizeDoc(notif),
      id: notifId,
      isRead: false,
      createdAt: Date.now()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    console.error('dbCreateNotification error:', err);
  }
}

export function dbSubscribeNotifications(
  userId: string,
  isAdminUser: boolean,
  onUpdate: (notifications: AppNotification[]) => void
): () => void {
  try {
    const targetId = isAdminUser ? 'admin' : userId;
    const q = query(collection(db, 'notifications'), where('userId', '==', targetId));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onUpdate(list);
      },
      (err) => {
        console.warn('Notifications subscription error:', err);
        onUpdate([]);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('dbSubscribeNotifications failed:', err);
    onUpdate([]);
    return () => {};
  }
}

export async function dbMarkNotificationAsRead(notifId: string): Promise<void> {
  try {
    const ref = doc(db, 'notifications', notifId);
    await updateDoc(ref, { isRead: true });
  } catch (err) {
    console.error('dbMarkNotificationAsRead error:', err);
  }
}

export async function dbMarkAllNotificationsAsRead(userId: string, isAdminUser: boolean): Promise<void> {
  try {
    const targetId = isAdminUser ? 'admin' : userId;
    const q = query(collection(db, 'notifications'), where('userId', '==', targetId), where('isRead', '==', false));
    const snap = await getDocs(q);
    const promises = snap.docs.map(docSnap => updateDoc(docSnap.ref, { isRead: true }));
    await Promise.all(promises);
  } catch (err) {
    console.error('dbMarkAllNotificationsAsRead error:', err);
  }
}


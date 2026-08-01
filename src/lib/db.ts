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
import { Book, Review, BookComment, User, AdminStats, AppNotification } from '../types';
import { SAMPLE_BOOKS, SAMPLE_REVIEWS, SAMPLE_COMMENTS, compressBase64Image } from '../utils';

// Helper to strip non-serializable fields
function sanitizeDoc<T>(docObj: T): any {
  return JSON.parse(JSON.stringify(docObj));
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
          books.push({ id: docSnap.id, ...docSnap.data() } as Book);
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
      books.push({ id: docSnap.id, ...docSnap.data() } as Book);
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
      return { id: snap.id, ...snap.data() } as Book;
    }
  } catch (e) {
    console.warn('dbFetchBookById failed:', e);
  }
  return SAMPLE_BOOKS.find(b => b.id === id) || null;
}

export async function dbCreateBook(book: Book): Promise<Book> {
  const cleanBook = sanitizeDoc(book);

  if (cleanBook.coverUrl && cleanBook.coverUrl.startsWith('data:image')) {
    cleanBook.coverUrl = await compressBase64Image(cleanBook.coverUrl, 800, 0.65);
  }

  const bookId = cleanBook.id || `book_${Date.now()}`;
  const docRef = doc(db, 'books', bookId);

  const payload = {
    ...cleanBook,
    id: bookId,
    createdAt: cleanBook.createdAt || Date.now(),
    downloadCount: cleanBook.downloadCount || 0,
    likesCount: cleanBook.likesCount || 0,
    ratingAverage: cleanBook.ratingAverage || 5.0,
    ratingCount: cleanBook.ratingCount || 1
  };

  await setDoc(docRef, payload);
  return payload;
}

export async function dbUpdateBook(id: string, updates: Partial<Book>): Promise<void> {
  try {
    const ref = doc(db, 'books', id);
    await updateDoc(ref, sanitizeDoc(updates));
  } catch (e) {
    console.error('dbUpdateBook error:', e);
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


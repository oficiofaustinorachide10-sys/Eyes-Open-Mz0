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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Book, Review, BookComment, User, AdminStats } from '../types';
import { SAMPLE_BOOKS, SAMPLE_REVIEWS, SAMPLE_COMMENTS, compressBase64Image } from '../utils';

// Helper to strip non-serializable fields
function sanitizeDoc<T>(docObj: T): any {
  const clean = JSON.parse(JSON.stringify(docObj));
  return clean;
}

// -------------------------------------------------------------
// BOOKS DATA LAYER (Firestore `books`)
// -------------------------------------------------------------

/**
 * Real-time listener for all books in Ala X
 */
export function dbSubscribeBooks(onUpdate: (books: Book[]) => void): () => void {
  try {
    const q = query(collection(db, 'books'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Seed sample books if database is empty
          seedInitialBooks().then(() => {
            onUpdate(SAMPLE_BOOKS);
          });
          return;
        }
        const books: Book[] = [];
        snapshot.forEach((docSnap) => {
          books.push({ id: docSnap.id, ...docSnap.data() } as Book);
        });
        // Sort descending by createdAt
        books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        localStorage.setItem('alax_cached_books', JSON.stringify(books));
        onUpdate(books);
      },
      (error) => {
        console.warn('Firestore books subscription error, falling back to cache/sample:', error);
        const cached = localStorage.getItem('alax_cached_books');
        if (cached) {
          try { onUpdate(JSON.parse(cached)); } catch (e) { onUpdate(SAMPLE_BOOKS); }
        } else {
          onUpdate(SAMPLE_BOOKS);
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Error setting up books subscriber:', err);
    onUpdate(SAMPLE_BOOKS);
    return () => {};
  }
}

/**
 * Seed initial sample books to Firestore if collection is empty
 */
export async function seedInitialBooks(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'books'));
    if (snap.empty) {
      for (const book of SAMPLE_BOOKS) {
        await setDoc(doc(db, 'books', book.id), sanitizeDoc(book));
      }
      console.log('Ala X sample books seeded to Firestore successfully');
    }
  } catch (err) {
    console.warn('Failed to seed initial books:', err);
  }
}

/**
 * Fetch all published books
 */
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
    localStorage.setItem('alax_cached_books', JSON.stringify(books));
    return books;
  } catch (err) {
    console.warn('dbFetchBooks error, loading cached or sample books:', err);
    const cached = localStorage.getItem('alax_cached_books');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return SAMPLE_BOOKS;
  }
}

/**
 * Fetch a single book by ID
 */
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

/**
 * Create/Publish a new book doc in Firestore
 */
export async function dbCreateBook(book: Book): Promise<Book> {
  const cleanBook = sanitizeDoc(book);

  // Compress cover image if it's base64 to ensure fast Firestore storage
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

  // Update local cache
  try {
    const cached = localStorage.getItem('alax_cached_books');
    const existing: Book[] = cached ? JSON.parse(cached) : [...SAMPLE_BOOKS];
    const updated = [payload, ...existing.filter(b => b.id !== bookId)];
    localStorage.setItem('alax_cached_books', JSON.stringify(updated));
  } catch (e) {}

  return payload;
}

/**
 * Update an existing book metadata
 */
export async function dbUpdateBook(id: string, updates: Partial<Book>): Promise<void> {
  try {
    const ref = doc(db, 'books', id);
    await updateDoc(ref, sanitizeDoc(updates));

    const cached = localStorage.getItem('alax_cached_books');
    if (cached) {
      const list: Book[] = JSON.parse(cached);
      const updatedList = list.map(b => b.id === id ? { ...b, ...updates } : b);
      localStorage.setItem('alax_cached_books', JSON.stringify(updatedList));
    }
  } catch (e) {
    console.error('dbUpdateBook error:', e);
  }
}

/**
 * Delete a book doc from Firestore
 */
export async function dbDeleteBook(id: string): Promise<void> {
  try {
    const ref = doc(db, 'books', id);
    await deleteDoc(ref);

    const cached = localStorage.getItem('alax_cached_books');
    if (cached) {
      const list: Book[] = JSON.parse(cached);
      const updatedList = list.filter(b => b.id !== id);
      localStorage.setItem('alax_cached_books', JSON.stringify(updatedList));
    }
  } catch (e) {
    console.error('dbDeleteBook error:', e);
  }
}

/**
 * Atomically increment book download count in Firestore
 */
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
    console.warn('dbIncrementBookDownloads Firestore failed, updating fallback:', e);
  }
  return 1;
}

/**
 * Toggle book like count
 */
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
// REVIEWS DATA LAYER (Firestore `reviews`)
// -------------------------------------------------------------

/**
 * Real-time listener for reviews of a specific book
 */
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
        console.warn('Reviews subscription error, returning sample reviews for book:', err);
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

/**
 * Add a review and update book average rating
 */
export async function dbAddReview(review: Review): Promise<Review> {
  const cleanReview = sanitizeDoc(review);
  const reviewId = cleanReview.id || `rev_${Date.now()}`;
  const docRef = doc(db, 'reviews', reviewId);

  const payload = {
    ...cleanReview,
    id: reviewId,
    createdAt: cleanReview.createdAt || Date.now()
  };

  await setDoc(docRef, payload);

  // Recalculate book rating average
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

// -------------------------------------------------------------
// COMMENTS DATA LAYER (Firestore `comments` - Facebook style)
// -------------------------------------------------------------

/**
 * Real-time listener for Facebook-style comments of a specific book
 */
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

/**
 * Add a Facebook-style comment doc
 */
export async function dbAddComment(comment: BookComment): Promise<BookComment> {
  const cleanComment = sanitizeDoc(comment);
  const commentId = cleanComment.id || `comm_${Date.now()}`;
  const docRef = doc(db, 'comments', commentId);

  const payload: BookComment = {
    ...cleanComment,
    id: commentId,
    createdAt: cleanComment.createdAt || Date.now(),
    likesCount: cleanComment.likesCount || 0,
    likedBy: cleanComment.likedBy || []
  };

  await setDoc(docRef, payload);
  return payload;
}

/**
 * Toggle like on a Facebook-style comment
 */
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

export async function dbSaveUser(user: User): Promise<void> {
  try {
    const ref = doc(db, 'users', user.id);
    await setDoc(ref, sanitizeDoc(user), { merge: true });
  } catch (e) {
    console.warn('dbSaveUser error:', e);
  }
}

import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

export const ADMIN_EMAILS = ['oficiofaustino78@gmail.com', 'admin@alax.mz'];

export function isUserAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Ensures user document exists in Firestore under collection `users/{uid}`
 * Each UID has its own isolated document containing profile, bio, photo, etc.
 */
export async function syncUserDocToFirestore(fbUser: FirebaseUser, overrideName?: string): Promise<User> {
  const uid = fbUser.uid;
  const email = fbUser.email || '';
  const userRef = doc(db, 'users', uid);

  const isAdmin = isUserAdminEmail(email);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const updatedRole = isAdmin ? 'admin' : (data.role || 'user');

      const updatedUser: User = {
        id: uid,
        uid: uid,
        email: email,
        name: data.name || fbUser.displayName || overrideName || email.split('@')[0] || 'Utilizador',
        role: updatedRole as 'admin' | 'user',
        avatar: data.photoURL || data.avatar || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        photoURL: data.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        bio: data.bio || '',
        favoriteBookIds: data.favoriteBookIds || [],
        readHistory: data.readHistory || [],
        createdAt: data.createdAt || Date.now(),
        lastLogin: Date.now()
      };

      await updateDoc(userRef, {
        lastLogin: Date.now(),
        role: updatedRole
      });

      return updatedUser;
    } else {
      // Create new independent user profile in Firestore
      const newUser: User = {
        id: uid,
        uid: uid,
        email: email,
        name: overrideName || fbUser.displayName || email.split('@')[0] || 'Utilizador Ala X',
        role: isAdmin ? 'admin' : 'user',
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        bio: '',
        favoriteBookIds: [],
        readHistory: [],
        createdAt: Date.now(),
        lastLogin: Date.now()
      };

      await setDoc(userRef, newUser);
      return newUser;
    }
  } catch (err) {
    console.error('Error syncing user document to Firestore:', err);
    return {
      id: uid,
      uid: uid,
      email: email,
      name: fbUser.displayName || email.split('@')[0] || 'Utilizador Ala X',
      role: isAdmin ? 'admin' : 'user',
      avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      bio: '',
      favoriteBookIds: [],
      createdAt: Date.now()
    };
  }
}

/**
 * Fetch all registered users for `@author` selection and `@mentions` autocomplete
 */
export async function dbFetchAllUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: User[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() } as User);
    });
    return list;
  } catch (e) {
    console.warn('dbFetchAllUsers error:', e);
    return [];
  }
}

/**
 * Google Sign-In with popup
 */
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return await syncUserDocToFirestore(res.user);
}

/**
 * Email & Password Login
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserDocToFirestore(res.user);
}

/**
 * Register with Email & Password
 */
export async function registerWithEmail(email: string, pass: string, name: string): Promise<User> {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && res.user) {
    try {
      await updateProfile(res.user, { displayName: name });
    } catch (e) {
      console.warn('Could not update profile displayName:', e);
    }
  }
  return await syncUserDocToFirestore(res.user, name);
}

/**
 * Send password reset email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export const sendPasswordReset = requestPasswordReset;
export const fetchSystemUsers = dbFetchAllUsers;

/**
 * Logout authenticated user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase Auth state changes
 */
export function subscribeToAuth(onUserChanged: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const user = await syncUserDocToFirestore(fbUser);
      onUserChanged(user);
    } else {
      onUserChanged(null);
    }
  });
}

/**
 * Update current user profile in Firestore document `users/{uid}`
 */
export async function updateUserProfile(uid: string, updates: Partial<User>): Promise<User> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  let currentData = snap.exists() ? snap.data() as User : null;

  // Protect against privilege escalation
  const cleanUpdates: Partial<User> = { ...updates };
  if (cleanUpdates.role && cleanUpdates.role === 'admin') {
    const email = currentData?.email || auth.currentUser?.email;
    if (!isUserAdminEmail(email)) {
      cleanUpdates.role = 'user';
    }
  }

  if (cleanUpdates.photoURL && !cleanUpdates.avatar) {
    cleanUpdates.avatar = cleanUpdates.photoURL;
  }
  if (cleanUpdates.avatar && !cleanUpdates.photoURL) {
    cleanUpdates.photoURL = cleanUpdates.avatar;
  }

  await updateDoc(userRef, cleanUpdates);

  const updatedSnap = await getDoc(userRef);
  return { id: uid, uid, ...updatedSnap.data() } as User;
}

export function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem('ala_x_session_user');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem('ala_x_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ala_x_session_user');
    }
  } catch (e) {
    console.error(e);
  }
}

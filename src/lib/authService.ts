import { db, auth } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { User } from '../types';

// JWT Secret or fallback
const JWT_SECRET = 'eo_eyesopen_cybersecurity_expert_jwt_secret_2026';

// Simple legacy compatible hash
export function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Secure PBKDF2 hash using Web Crypto (SHA-512, 1000 iterations, 64 bytes)
export async function secureHashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback if not in a secure context
    return simpleHash(password);
  }
  try {
    const enc = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(JWT_SECRET),
        iterations: 1000,
        hash: 'SHA-512'
      },
      passwordKey,
      512 // 512 bits = 64 bytes
    );
    return Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (err) {
    console.warn('PBKDF2 derivation failed, falling back to simpleHash:', err);
    return simpleHash(password);
  }
}

// Check if we should directly run client-side Firestore fallback
function isGitHubPages(): boolean {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('github.io') || window.location.search.includes('force_client_auth=true'));
}

// Direct Firestore User Registration
async function registerClientSide(userData: any): Promise<{ user: User; token: string }> {
  const usersCol = collection(db, 'users');
  
  // Clean email
  const emailClean = userData.email.trim().toLowerCase();

  // Validate email uniqueness
  const qEmail = query(usersCol, where('email', '==', emailClean));
  const snapEmail = await getDocs(qEmail);
  if (!snapEmail.empty) {
    throw new Error('Este endereço de e-mail já está em uso.');
  }

  // Validate phone
  const qPhone = query(usersCol, where('phone', '==', userData.phone));
  const snapPhone = await getDocs(qPhone);
  if (snapPhone.size >= 3) {
    throw new Error('Este número de telefone já possui o limite de 3 contas.');
  }

  // Validate nickname uniqueness
  const qNick = query(usersCol, where('nickname', '==', userData.nickname.trim()));
  const snapNick = await getDocs(qNick);
  if (!snapNick.empty) {
    throw new Error('Este nickname já está em uso por outro utilizador.');
  }

  // Hash password
  const hashedPassword = await secureHashPassword(userData.password);
  const userId = userData.id || 'user_' + Math.random().toString(36).substring(2, 11);

  const newUser: any = {
    id: userId,
    phone: userData.phone,
    email: emailClean,
    fullname: userData.fullname.trim(),
    firstname: userData.firstname.trim(),
    surname: userData.surname.trim(),
    nickname: userData.nickname.trim(),
    password: hashedPassword,
    province: userData.province,
    district: userData.district,
    created: new Date().toISOString(),
    avatar: userData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
    stats: { likes: 0, posts: 0, friends: 0 },
    nameEditDate: null,
    isVIP: false,
    lastReadChatTimestamp: 0,
    lastReadNotificationsTimestamp: 0,
    mutedNotifications: false
  };

  await setDoc(doc(db, 'users', userId), newUser);

  // Simple token (base64 encoded JSON)
  const tokenPayload = { id: userId, nickname: userData.nickname };
  const token = btoa(JSON.stringify(tokenPayload));

  const clientUser = { ...newUser };
  delete clientUser.password;

  return { user: clientUser, token };
}

// Direct Firestore User Login
async function loginClientSide(email: string, password: string): Promise<{ user: User; token: string }> {
  const usersCol = collection(db, 'users');
  const emailClean = email.trim().toLowerCase();

  let q = query(usersCol, where('email', '==', emailClean));
  let snap = await getDocs(q);

  // Seed on-the-fly if email is specific master account
  if (snap.empty && emailClean === 'oficiorachide2003@gmail.com') {
    const hashedPassword = await secureHashPassword('Hellfuego005');
    const userId = 'user_oficiorachide2003';
    const autoUser = {
      id: userId,
      phone: '+258841234567',
      email: 'oficiorachide2003@gmail.com',
      fullname: 'Oficio Faustino Rachide',
      firstname: 'Oficio',
      surname: 'Rachide',
      nickname: 'oficiorachide2003',
      password: hashedPassword,
      province: 'Zambézia',
      district: 'Quelimane',
      created: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      stats: { likes: 500, posts: 10, friends: 120 },
      nameEditDate: null,
      isVIP: true,
      isVerified: true,
      lastReadChatTimestamp: 0,
      lastReadNotificationsTimestamp: 0,
      mutedNotifications: false
    };
    await setDoc(doc(db, 'users', userId), autoUser);
    snap = await getDocs(q);
  }

  if (snap.empty) {
    throw new Error('Este endereço de e-mail não está registrado no sistema.');
  }

  const userDoc = snap.docs[0];
  const user = userDoc.data() as any;

  const inputSecureHash = await secureHashPassword(password);
  const inputSimpleHash = simpleHash(password);

  if (user.password !== inputSecureHash && user.password !== inputSimpleHash) {
    throw new Error('Senha incorreta. Por favor, tente novamente.');
  }

  // Password upgrade if needed
  if (user.password === inputSimpleHash) {
    await updateDoc(doc(db, 'users', user.id), { password: inputSecureHash });
  }

  const tokenPayload = { id: user.id, nickname: user.nickname };
  const token = btoa(JSON.stringify(tokenPayload));

  const clientUser = { ...user };
  delete clientUser.password;

  return { user: clientUser as User, token };
}

// Direct Firestore Session Verification
async function verifyClientSide(token: string): Promise<{ user: User; token: string }> {
  try {
    const decoded = JSON.parse(atob(token));
    if (!decoded || !decoded.id) {
      throw new Error('Token inválido');
    }
    const snap = await getDocs(query(collection(db, 'users'), where('id', '==', decoded.id)));
    
    if (snap.empty) {
      throw new Error('Utilizador não encontrado no sistema');
    }

    const user = snap.docs[0].data() as any;
    delete user.password;

    return { user: user as User, token };
  } catch (e) {
    throw new Error('Sessão expirada ou inválida. Efetue login novamente.');
  }
}

// Account recovery initiation client-side
async function recoverClientSide(email: string): Promise<{ code: string }> {
  const usersCol = collection(db, 'users');
  const emailClean = email.trim().toLowerCase();
  const q = query(usersCol, where('email', '==', emailClean));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Nenhuma conta encontrada com este endereço de e-mail.');
  }

  // Generate 6 digit pin code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return { code };
}

// Account recovery password reset client-side
async function resetPasswordClientSide(email: string, newPassword: string): Promise<{ success: boolean }> {
  const usersCol = collection(db, 'users');
  const emailClean = email.trim().toLowerCase();
  const q = query(usersCol, where('email', '==', emailClean));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Nenhuma conta encontrada com este endereço de e-mail.');
  }

  const user = snap.docs[0].data() as any;
  const hashed = await secureHashPassword(newPassword);

  await updateDoc(doc(db, 'users', user.id), { password: hashed });
  return { success: true };
}

// Exported public API client-side routing

export async function authLogin(email: string, password: string): Promise<{ user: User; token: string }> {
  if (isGitHubPages()) {
    console.log('[AuthService] Forcing client-side Firestore auth for GitHub Pages');
    return loginClientSide(email, password);
  }
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Dados de login incorretos.');
    }
    return data;
  } catch (err: any) {
    console.warn('[AuthService] API Login failed, falling back to client-side Firestore:', err);
    return loginClientSide(email, password);
  }
}

export async function authRegister(userData: any): Promise<{ user: User; token: string }> {
  if (isGitHubPages()) {
    console.log('[AuthService] Forcing client-side Firestore registration for GitHub Pages');
    return registerClientSide(userData);
  }
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar conta.');
    }
    return data;
  } catch (err: any) {
    console.warn('[AuthService] API Register failed, falling back to client-side Firestore:', err);
    return registerClientSide(userData);
  }
}

export async function authVerify(token: string): Promise<{ user: User; token: string }> {
  if (isGitHubPages()) {
    return verifyClientSide(token);
  }
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Sessão inválida.');
    }
    return data;
  } catch (err: any) {
    console.warn('[AuthService] API Verify failed, falling back to client-side Firestore:', err);
    return verifyClientSide(token);
  }
}

export async function authRecover(email: string): Promise<{ code: string }> {
  if (isGitHubPages()) {
    return recoverClientSide(email);
  }
  try {
    const response = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, method: 'email' })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro na recuperação de conta.');
    }
    return data;
  } catch (err: any) {
    console.warn('[AuthService] API Recover failed, falling back to client-side Firestore:', err);
    return recoverClientSide(email);
  }
}

export async function authResetPassword(email: string, newPassword: any): Promise<{ success: boolean }> {
  if (isGitHubPages()) {
    return resetPasswordClientSide(email, newPassword);
  }
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao redefinir senha.');
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[AuthService] API ResetPassword failed, falling back to client-side Firestore:', err);
    return resetPasswordClientSide(email, newPassword);
  }
}

export async function authGoogleLogin(): Promise<{ user: User; token: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const googleUser = result.user;

    if (!googleUser.email) {
      throw new Error('Não foi possível obter o endereço de e-mail da sua conta Google.');
    }

    const emailClean = googleUser.email.trim().toLowerCase();
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('email', '==', emailClean));
    const snap = await getDocs(q);

    let finalUser: User;

    if (!snap.empty) {
      const userDoc = snap.docs[0];
      finalUser = userDoc.data() as User;
    } else {
      const fullname = googleUser.displayName || emailClean.split('@')[0];
      const nameParts = fullname.split(' ');
      const firstname = nameParts[0] || 'Utilizador';
      const surname = nameParts.slice(1).join(' ') || 'Google';
      const nickname = emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 5);

      const userId = 'google_' + googleUser.uid;
      const newUser: User = {
        id: userId,
        phone: '',
        email: emailClean,
        fullname,
        firstname,
        surname,
        nickname,
        password: 'google_auth_placeholder',
        province: 'Maputo',
        district: 'Maputo',
        created: new Date().toISOString(),
        avatar: googleUser.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`,
        stats: { likes: 0, posts: 0, friends: 0 },
        nameEditDate: null,
        isVIP: false,
        isVerified: true,
        lastReadChatTimestamp: 0,
        lastReadNotificationsTimestamp: 0,
        mutedNotifications: false
      };

      await setDoc(doc(db, 'users', userId), newUser);
      finalUser = newUser;
    }

    const tokenPayload = { id: finalUser.id, nickname: finalUser.nickname };
    const token = btoa(JSON.stringify(tokenPayload));

    const clientUser = { ...finalUser };
    delete clientUser.password;

    return { user: clientUser, token };
  } catch (err: any) {
    console.error('[AuthService] Google Authentication failed:', err);
    throw new Error(err.message || 'Erro durante a autenticação com o Google.');
  }
}

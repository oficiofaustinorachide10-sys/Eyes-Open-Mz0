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
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
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

// Direct Firestore complete registration with personal and geographic fields
async function registerCompleteClientSide(profileData: any): Promise<{ user: User; token: string }> {
  const usersCol = collection(db, 'users');
  const emailClean = profileData.email.trim().toLowerCase();

  // Validate email uniqueness
  const qEmail = query(usersCol, where('email', '==', emailClean));
  const snapEmail = await getDocs(qEmail);
  if (!snapEmail.empty) {
    throw new Error('Este endereço de e-mail já está em uso.');
  }

  // Validate phone
  const qPhone = query(usersCol, where('phone', '==', profileData.phone.trim()));
  const snapPhone = await getDocs(qPhone);
  if (snapPhone.size >= 3) {
    throw new Error('Este número de telefone já possui o limite de 3 contas.');
  }

  // Validate nickname uniqueness
  const qNick = query(usersCol, where('nickname', '==', profileData.nickname.trim()));
  const snapNick = await getDocs(qNick);
  if (!snapNick.empty) {
    throw new Error('Este nickname já está em uso por outro utilizador.');
  }

  // Hash password
  const hashedPassword = await secureHashPassword(profileData.password);
  const userId = 'user_' + Math.random().toString(36).substring(2, 11);

  const newUser: any = {
    id: userId,
    phone: profileData.phone.trim(),
    email: emailClean,
    fullname: profileData.fullname.trim(),
    firstname: profileData.firstname.trim(),
    surname: profileData.surname.trim(),
    nickname: profileData.nickname.trim(),
    password: hashedPassword,
    province: profileData.province,
    district: profileData.district,
    bairro: profileData.bairro.trim(),
    birthdate: profileData.birthdate,
    birthday: profileData.birthdate,
    gender: profileData.gender,
    profession: profileData.profession.trim(),
    created: new Date().toISOString(),
    avatar: profileData.avatar || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 50) + 1500000000000}?auto=format&fit=crop&q=80&w=150`,
    stats: { likes: 0, posts: 0, friends: 0 },
    nameEditDate: null,
    isVIP: false,
    lastReadChatTimestamp: 0,
    lastReadNotificationsTimestamp: 0,
    mutedNotifications: false
  };

  await setDoc(doc(db, 'users', userId), newUser);

  const tokenPayload = { id: userId, nickname: profileData.nickname };
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
  const emailClean = email.trim().toLowerCase();

  try {
    // 1. Sign in with native Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, emailClean, password);
    const firebaseUser = userCredential.user;
    const userId = firebaseUser.uid;

    // 2. Fetch profile from Firestore
    let snap = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
    if (snap.empty) {
      if (emailClean === 'oficiorachide2003@gmail.com') {
        const autoUser = {
          id: userId,
          phone: '+258841234567',
          email: 'oficiorachide2003@gmail.com',
          fullname: 'Oficio Faustino Rachide',
          firstname: 'Oficio',
          surname: 'Rachide',
          nickname: 'oficiorachide2003',
          password: 'firebase_auth_managed',
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
        snap = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      } else {
        throw new Error('Perfil do utilizador não encontrado no sistema.');
      }
    }

    const user = snap.docs[0].data() as User;
    const tokenPayload = { id: user.id, nickname: user.nickname };
    const token = btoa(JSON.stringify(tokenPayload));

    return { user, token };
  } catch (err: any) {
    // Check if it's the master account and auto-register on the fly
    if (emailClean === 'oficiorachide2003@gmail.com') {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, 'oficiorachide2003@gmail.com', password);
        const firebaseUser = userCredential.user;
        const userId = firebaseUser.uid;

        const autoUser = {
          id: userId,
          phone: '+258841234567',
          email: 'oficiorachide2003@gmail.com',
          fullname: 'Oficio Faustino Rachide',
          firstname: 'Oficio',
          surname: 'Rachide',
          nickname: 'oficiorachide2003',
          password: 'firebase_auth_managed',
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

        const tokenPayload = { id: userId, nickname: 'oficiorachide2003' };
        const token = btoa(JSON.stringify(tokenPayload));

        return { user: autoUser as User, token };
      } catch (innerErr) {
        throw new Error('Dados de login incorretos ou erro de autenticação.');
      }
    }

    // Legacy migration: check if password matches locally but user has not migrated to Firebase Auth yet
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('email', '==', emailClean)));
      if (!snap.empty) {
        const legacyUser = snap.docs[0].data() as any;
        const inputSecureHash = await secureHashPassword(password);
        const inputSimpleHash = simpleHash(password);

        if (legacyUser.password === inputSecureHash || legacyUser.password === inputSimpleHash) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, emailClean, password);
            const firebaseUser = userCredential.user;
            const newUid = firebaseUser.uid;

            const updatedUser = {
              ...legacyUser,
              id: newUid,
              password: 'firebase_auth_managed'
            };
            
            await setDoc(doc(db, 'users', newUid), updatedUser);

            const tokenPayload = { id: newUid, nickname: legacyUser.nickname };
            const token = btoa(JSON.stringify(tokenPayload));

            return { user: updatedUser as User, token };
          } catch (migrationErr: any) {
            console.error('Migration failed:', migrationErr);
          }
        }
      }
    } catch (fallbackErr) {
      console.error('Legacy check error:', fallbackErr);
    }

    let errMsg = 'Erro de início de sessão. Verifique as suas credenciais.';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      errMsg = 'Dados de login incorretos. Por favor, verifique o seu e-mail e palavra-passe.';
    } else if (err.code === 'auth/invalid-email') {
      errMsg = 'O formato do e-mail introduzido é inválido.';
    } else if (err.code === 'auth/user-disabled') {
      errMsg = 'Esta conta foi desativada.';
    } else if (err.message) {
      errMsg = err.message;
    }
    throw new Error(errMsg);
  }
}

export async function authRegister(userData: any): Promise<{ user: User; token: string }> {
  return authRegisterComplete(userData);
}

export async function authRegisterEmailInitiate(email: string, confirmEmail: string): Promise<{ success: boolean; pendingToken: string; previewUrl?: string }> {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase())));
  if (!snap.empty) {
    throw new Error('Este endereço de e-mail já está em uso.');
  }
  const pendingToken = btoa(JSON.stringify({ email: email.trim().toLowerCase() }));
  return { success: true, pendingToken };
}

export async function authRegisterEmailConfirm(code: string, pendingToken: string): Promise<{ success: boolean; email: string; message: string }> {
  try {
    const decoded = JSON.parse(atob(pendingToken));
    return { success: true, email: decoded.email, message: 'Seja bem-vindo, está quase a criar a sua conta.' };
  } catch (e: any) {
    throw new Error('Confirmação de e-mail inválida.');
  }
}

export async function authRegisterComplete(profileData: any): Promise<{ user: User; token: string }> {
  const emailClean = profileData.email.trim().toLowerCase();

  try {
    console.log('[AuthService] Initiating native Firebase registration for email:', emailClean);

    // 1. Create the user natively in Firebase Auth
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, emailClean, profileData.password);
      console.log('[AuthService DIAGNOSTIC] Native Firebase user created successfully. UID:', userCredential.user.uid);
    } catch (createErr: any) {
      console.error('[AuthService DIAGNOSTIC] Failed to create native Firebase user:', {
        code: createErr?.code,
        message: createErr?.message,
        stack: createErr?.stack,
        details: createErr
      });
      throw createErr;
    }

    const firebaseUser = userCredential.user;
    const userId = firebaseUser.uid;

    // 2. Trigger native verification immediately!
    try {
      // Explicitly check for auth.currentUser and trigger verification immediately
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        console.log('[AuthService DIAGNOSTIC] sendEmailVerification(auth.currentUser) dispatched successfully.');
      } else {
        await sendEmailVerification(firebaseUser);
        console.log('[AuthService DIAGNOSTIC] sendEmailVerification(firebaseUser) dispatched successfully.');
      }
    } catch (verifyErr: any) {
      console.error('[AuthService DIAGNOSTIC] sendEmailVerification failed (verify domain restrictions, limits, or SDK configs):', {
        code: verifyErr?.code,
        message: verifyErr?.message,
        stack: verifyErr?.stack,
        details: verifyErr
      });
      // We don't block registration completely if only email delivery fails, but we definitely log it
    }

    // 3. Create the profile doc in Firestore using their uid
    const newUser: User = {
      id: userId,
      phone: profileData.phone || '',
      email: emailClean,
      fullname: profileData.fullname.trim(),
      firstname: profileData.firstname.trim(),
      surname: profileData.surname.trim(),
      nickname: profileData.nickname.trim(),
      password: 'firebase_auth_managed',
      province: profileData.province || 'Maputo',
      district: profileData.district || 'Maputo',
      bairro: (profileData.bairro || '').trim(),
      birthdate: profileData.birthdate || '',
      birthday: profileData.birthdate || '',
      gender: profileData.gender || 'Masculino',
      profession: (profileData.profession || '').trim(),
      created: new Date().toISOString(),
      avatar: profileData.avatar || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 50) + 1500000000000}?auto=format&fit=crop&q=80&w=150`,
      stats: { likes: 0, posts: 0, friends: 0 },
      nameEditDate: null,
      isVIP: false,
      lastReadChatTimestamp: 0,
      lastReadNotificationsTimestamp: 0,
      mutedNotifications: false
    };

    try {
      await setDoc(doc(db, 'users', userId), newUser);
      console.log('[AuthService DIAGNOSTIC] User profile document successfully saved to Firestore with UID:', userId);
    } catch (dbErr: any) {
      console.error('[AuthService DIAGNOSTIC] Failed to save user profile document to Firestore:', {
        code: dbErr?.code,
        message: dbErr?.message,
        stack: dbErr?.stack,
        details: dbErr
      });
      throw dbErr;
    }

    const tokenPayload = { id: userId, nickname: profileData.nickname };
    const token = btoa(JSON.stringify(tokenPayload));

    return { user: newUser, token };
  } catch (err: any) {
    console.error('[AuthService DIAGNOSTIC] authRegisterComplete master try/catch caught:', err);
    let errMsg = 'Erro ao concluir o registo.';
    if (err.code === 'auth/email-already-in-use') {
      errMsg = 'Este endereço de e-mail já está em uso.';
    } else if (err.code === 'auth/weak-password') {
      errMsg = 'A palavra-passe escolhida é demasiado fraca (mínimo de 6 caracteres).';
    } else if (err.code === 'auth/invalid-email') {
      errMsg = 'O endereço de e-mail introduzido é inválido.';
    } else if (err.message) {
      errMsg = err.message;
    }
    throw new Error(errMsg);
  }
}

export async function authRegisterInitiate(userData: any): Promise<{ success: boolean; pendingRegistrationToken: string; previewUrl?: string }> {
  const pendingRegistrationToken = btoa(JSON.stringify({ userData }));
  return { success: true, pendingRegistrationToken };
}

export async function authRegisterConfirm(code: string, pendingRegistrationToken: string): Promise<{ user: User; token: string }> {
  try {
    const decoded = JSON.parse(atob(pendingRegistrationToken));
    return authRegisterComplete(decoded.userData);
  } catch (e: any) {
    throw new Error('Confirmação inválida.');
  }
}

export async function authVerify(token: string): Promise<{ user: User; token: string }> {
  return verifyClientSide(token);
}

export async function authRecover(email: string): Promise<{ success: boolean; recoveryToken: string; previewUrl?: string }> {
  const emailClean = email.trim().toLowerCase();

  try {
    console.log('[AuthService] Initiating native Firebase password reset email for:', emailClean);

    // Check if user exists in our Firestore (Non-blocking warning)
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('email', '==', emailClean)));
      if (snap.empty) {
        console.warn('[AuthService DIAGNOSTIC] User not found in Firestore "users" collection, but proceeding with native Firebase password reset anyway.');
      } else {
        console.log('[AuthService DIAGNOSTIC] User found in Firestore "users" collection.');
      }
    } catch (dbErr: any) {
      console.warn('[AuthService DIAGNOSTIC] Failed to query users collection in Firestore (non-blocking):', {
        code: dbErr?.code,
        message: dbErr?.message,
        details: dbErr
      });
    }

    // Trigger official/native Firebase password reset email
    try {
      await sendPasswordResetEmail(auth, emailClean);
      console.log('[AuthService DIAGNOSTIC] sendPasswordResetEmail completed successfully for:', emailClean);
    } catch (resetErr: any) {
      console.error('[AuthService DIAGNOSTIC] sendPasswordResetEmail failed:', {
        code: resetErr?.code,
        message: resetErr?.message,
        stack: resetErr?.stack,
        details: resetErr
      });
      throw resetErr;
    }

    const recoveryToken = btoa(JSON.stringify({ email: emailClean, native: true }));
    return { success: true, recoveryToken };
  } catch (err: any) {
    console.error('[AuthService DIAGNOSTIC] Recovery flow error:', err);
    let errMsg = 'Erro ao enviar e-mail de recuperação.';
    
    if (err.code === 'auth/user-not-found') {
      errMsg = 'Nenhuma conta encontrada com este endereço de e-mail no Firebase Authentication.';
    } else if (err.code === 'auth/invalid-email') {
      errMsg = 'O formato do e-mail introduzido é inválido.';
    } else if (err.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
      errMsg = `Erro do Firebase: Domínio Não Autorizado. Por favor, aceda à consola do Firebase -> Autenticação -> Configurações -> Domínios Autorizados e adicione "${currentHost}" à lista.`;
    } else if (err.message) {
      errMsg = err.message;
    }
    throw new Error(errMsg);
  }
}

export async function authVerifyRecoveryCode(code: string, recoveryToken: string): Promise<{ success: boolean; resetToken: string }> {
  return { success: true, resetToken: 'native_firebase_reset' };
}

export async function authResetPassword(email: string, newPassword: any, resetToken: string): Promise<{ success: boolean; user?: User; token?: string }> {
  return { success: true };
}

export async function authGoogleLoginWithEmail(googleEmail: string, googleDisplayName?: string, photoURL?: string): Promise<{ user: User; token: string }> {
  const emailClean = googleEmail.trim().toLowerCase();
  if (!emailClean || !emailClean.includes('@')) {
    throw new Error('Por favor introduza um e-mail válido do Google.');
  }

  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('email', '==', emailClean));
  const snap = await getDocs(q);

  let finalUser: User;

  if (!snap.empty) {
    const userDoc = snap.docs[0];
    finalUser = userDoc.data() as User;
    if (!finalUser.isVerified) {
      finalUser.isVerified = true;
      await setDoc(doc(db, 'users', finalUser.id), { ...finalUser, isVerified: true });
    }
  } else {
    const fullname = googleDisplayName || emailClean.split('@')[0];
    const nameParts = fullname.split(' ');
    const firstname = nameParts[0] || 'Utilizador';
    const surname = nameParts.slice(1).join(' ') || 'Google';
    const nickname = emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 5);

    const userId = 'google_' + btoa(emailClean).replace(/=/g, '').substring(0, 15);
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
      avatar: photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`,
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
}

export async function authGoogleLogin(): Promise<{ user: User; token: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    let googleUser = null;
    try {
      const result = await signInWithPopup(auth, provider);
      googleUser = result.user;
    } catch (popupError: any) {
      console.warn('[AuthService] Google popup was blocked or failed:', popupError);
      
      // If user is logged in via auth current user
      if (auth.currentUser && auth.currentUser.email) {
        googleUser = auth.currentUser;
      } else {
        // Rethrow popup error so UI can trigger Google Email Fast Login dialog if blocked
        throw popupError;
      }
    }

    if (!googleUser || !googleUser.email) {
      throw new Error('Não foi possível obter o endereço de e-mail da sua conta Google.');
    }

    return await authGoogleLoginWithEmail(googleUser.email, googleUser.displayName || undefined, googleUser.photoURL || undefined);
  } catch (err: any) {
    console.error('[AuthService] Google Authentication failed:', err);
    throw err;
  }
}

export async function authCreateGuestUser(displayName: string, expirationHours: number): Promise<{ user: User; token: string }> {
  try {
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const expiresAt = Date.now() + expirationHours * 60 * 60 * 1000;
    
    const newGuest: User = {
      id: guestId,
      phone: '000000000',
      email: `${guestId}@guest.openmz.com`,
      fullname: displayName,
      firstname: displayName.split(' ')[0] || displayName,
      surname: displayName.split(' ').slice(1).join(' ') || 'Convidado',
      nickname: displayName.replace(/[^a-zA-Z0-9]/g, '') + '_guest',
      password: 'guest_mode_placeholder',
      province: 'Maputo',
      created: new Date().toISOString(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`,
      stats: { likes: 0, posts: 0, friends: 0 },
      nameEditDate: null,
      isVIP: false,
      isVerified: false,
      lastReadChatTimestamp: Date.now(),
      lastReadNotificationsTimestamp: Date.now(),
      mutedNotifications: false
    };

    // Use isGuest and expiresAt at top-level on User type
    const guestUserWithFlags = {
      ...newGuest,
      isGuest: true,
      expiresAt: expiresAt
    };

    await setDoc(doc(db, 'users', guestId), guestUserWithFlags);

    const tokenPayload = { id: guestId, nickname: newGuest.nickname, isGuest: true };
    const token = btoa(JSON.stringify(tokenPayload));

    return { user: guestUserWithFlags, token };
  } catch (err: any) {
    console.error('[AuthService] Guest account creation failed:', err);
    throw new Error(err.message || 'Erro durante a criação de conta de convidado.');
  }
}

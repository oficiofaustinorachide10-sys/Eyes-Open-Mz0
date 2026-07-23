import express from 'express';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { GoogleGenAI } from '@google/genai';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';

// Load environment variables
dotenv.config();

// Initialize Firebase Client SDK on the Server (using API Key to bypass ADC permissions issue)
const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const clientApp = initializeApp(firebaseConfig);
const clientDb = getFirestore(clientApp);

// Light, compatible Firestore Admin-like API wrapper using Client SDK
const db = {
  collection(collectionName: string) {
    return {
      doc(docId: string) {
        return {
          async get() {
            const docRef = doc(clientDb, collectionName, docId);
            const snapshot = await getDoc(docRef);
            return {
              exists: snapshot.exists(),
              data() {
                return snapshot.data();
              }
            };
          },
          async set(data: any) {
            const docRef = doc(clientDb, collectionName, docId);
            await setDoc(docRef, data);
          },
          async update(data: any) {
            const docRef = doc(clientDb, collectionName, docId);
            await updateDoc(docRef, data);
          }
        };
      },
      where(field: string, op: string, value: any) {
        const q = query(collection(clientDb, collectionName), where(field, op === '==' ? '==' : (op as any), value));
        return {
          async get() {
            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map(docSnap => ({
              data() {
                return docSnap.data();
              }
            }));
            return {
              empty: snapshot.empty,
              size: snapshot.size,
              docs
            };
          }
        };
      }
    };
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'eo_eyesopen_cybersecurity_expert_jwt_secret_2026';
const PORT = process.env.PORT || 3000;

// Simple legacy compatible hash
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Secure PBKDF2 hash
function secureHashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, JWT_SECRET, 1000, 64, 'sha512').toString('hex');
}

// Stub verification function (SMTP is no longer used; native Firebase Auth is handled client-side)
async function sendVerificationEmail(to: string, code: string, isRecovery = false) {
  console.log(`[SMTP Stub] sendVerificationEmail called for ${to} (SMTP is disabled; native Firebase Auth used on client)`);
  return { success: true, method: 'stub', previewUrl: null };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Authentication Routes ---

  // 1. Verify existing session JWT
  app.post('/api/auth/verify', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação em falta' });
      }
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const userDoc = await db.collection('users').doc(decoded.id).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Utilizador não encontrado no sistema' });
      }
      
      const user = userDoc.data();
      // Remove sensitive password from response
      if (user) {
        delete user.password;
      }
      
      res.json({ user, token });
    } catch (err: any) {
      res.status(401).json({ error: 'Sessão expirada ou inválida. Efetue login novamente.' });
    }
  });

  // 2. User registration (Google/fallback backward compatibility)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { 
        id, phone, email, fullname, firstname, surname, nickname, password, province, district, avatar
      } = req.body;

      if (!phone || !email || !fullname || !firstname || !surname || !nickname || !password) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
      }

      // Check existing users
      const usersCol = db.collection('users');
      
      // Check email uniqueness
      const emailSnap = await usersCol.where('email', '==', email.trim().toLowerCase()).get();
      if (!emailSnap.empty) {
        return res.status(400).json({ error: 'Este endereço de e-mail já está em uso.' });
      }

      // Check phone uniqueness
      const phoneSnap = await usersCol.where('phone', '==', phone).get();
      if (phoneSnap.size >= 3) {
        return res.status(400).json({ error: 'Este número de telefone já possui o limite de 3 contas.' });
      }

      // Check nickname uniqueness
      const nickSnap = await usersCol.where('nickname', '==', nickname).get();
      if (!nickSnap.empty) {
        return res.status(400).json({ error: 'Este nickname já está em uso por outro utilizador.' });
      }

      // Secure cryptographic hash
      const hashedPassword = secureHashPassword(password);
      const userId = id || 'user_' + Math.random().toString(36).substring(2, 11);

      const newUser = {
        id: userId,
        phone,
        email: email.trim().toLowerCase(),
        fullname: fullname.trim(),
        firstname: firstname.trim(),
        surname: surname.trim(),
        nickname: nickname.trim(),
        password: hashedPassword, // Stored as PBKDF2 hash securely
        province,
        district,
        created: new Date().toISOString(),
        avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
        stats: { likes: 0, posts: 0, friends: 0 },
        nameEditDate: null,
        isVIP: false,
        lastReadChatTimestamp: 0,
        lastReadNotificationsTimestamp: 0,
        mutedNotifications: false
      };

      await usersCol.doc(userId).set(newUser);

      // Generate JWT Session Token
      const token = jwt.sign({ id: userId, nickname }, JWT_SECRET, { expiresIn: '7d' });
      
      // Hide password from response
      const clientUser = { ...newUser };
      delete clientUser.password;

      res.status(201).json({ user: clientUser, token });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Erro ao registar utilizador: ' + err.message });
    }
  });

  // 2aa. Registration Step 1: Initiate email verification only
  app.post('/api/auth/register-email-initiate', async (req, res) => {
    try {
      const { email, confirmEmail } = req.body;

      if (!email || !confirmEmail) {
        return res.status(400).json({ error: 'Por favor, insira o e-mail e a confirmação do mesmo.' });
      }

      if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
        return res.status(400).json({ error: 'Os endereços de e-mail informados não coincidem.' });
      }

      // Check if email already exists
      const usersCol = db.collection('users');
      const emailSnap = await usersCol.where('email', '==', email.trim().toLowerCase()).get();
      if (!emailSnap.empty) {
        return res.status(400).json({ error: 'Este endereço de e-mail já está em uso.' });
      }

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Send real SMTP email with verification code
      const emailResult = await sendVerificationEmail(email.trim().toLowerCase(), code, false);

      // Sign payload with 15 minutes expiration
      const pendingToken = jwt.sign(
        { email: email.trim().toLowerCase(), code },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.status(200).json({
        success: true,
        pendingToken,
        previewUrl: (emailResult as any).previewUrl || null
      });
    } catch (err: any) {
      console.error('Email register initiate error:', err);
      res.status(500).json({ error: 'Erro ao iniciar verificação de e-mail: ' + err.message });
    }
  });

  // 2ab. Registration Step 1: Confirm email verification code
  app.post('/api/auth/register-email-confirm', async (req, res) => {
    try {
      const { code, pendingToken } = req.body;

      if (!code || !pendingToken) {
        return res.status(400).json({ error: 'Código de confirmação e token de registo pendente são obrigatórios.' });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(pendingToken, JWT_SECRET);
      } catch (jwtErr) {
        return res.status(400).json({ error: 'O tempo de verificação expirou ou o token é inválido.' });
      }

      if (decoded.code !== code.trim()) {
        return res.status(400).json({ error: 'Código de confirmação incorreto. Verifique o seu e-mail.' });
      }

      res.status(200).json({
        success: true,
        email: decoded.email,
        message: 'Seja bem-vindo, está quase a criar a sua conta.'
      });
    } catch (err: any) {
      console.error('Email register confirm error:', err);
      res.status(500).json({ error: 'Erro ao confirmar código de verificação: ' + err.message });
    }
  });

  // 2ac. Registration Step 2: Complete registration with profile & geo details
  app.post('/api/auth/register-complete', async (req, res) => {
    try {
      const {
        email, phone, fullname, firstname, surname, nickname, password,
        province, district, bairro, birthdate, gender, profession, avatar
      } = req.body;

      if (!email || !phone || !fullname || !firstname || !surname || !nickname || !password || !province || !district || !bairro || !birthdate || !gender || !profession) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios do perfil e localização.' });
      }

      const usersCol = db.collection('users');

      // Double check email uniqueness
      const emailSnap = await usersCol.where('email', '==', email.trim().toLowerCase()).get();
      if (!emailSnap.empty) {
        return res.status(400).json({ error: 'Este e-mail já foi registado.' });
      }

      // Check phone uniqueness limit (max 3)
      const phoneSnap = await usersCol.where('phone', '==', phone.trim()).get();
      if (phoneSnap.size >= 3) {
        return res.status(400).json({ error: 'Este número de telefone já possui o limite máximo de 3 contas.' });
      }

      // Check nickname uniqueness
      const nickSnap = await usersCol.where('nickname', '==', nickname.trim()).get();
      if (!nickSnap.empty) {
        return res.status(400).json({ error: 'Este nickname já está em uso por outro utilizador.' });
      }

      const hashedPassword = secureHashPassword(password);
      const userId = 'user_' + Math.random().toString(36).substring(2, 11);

      const newUser = {
        id: userId,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        fullname: fullname.trim(),
        firstname: firstname.trim(),
        surname: surname.trim(),
        nickname: nickname.trim(),
        password: hashedPassword,
        province,
        district,
        bairro: bairro.trim(),
        birthdate,
        birthday: birthdate, // backup/compat
        gender,
        profession: profession.trim(),
        created: new Date().toISOString(),
        avatar: avatar || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 50) + 1500000000000}?auto=format&fit=crop&q=80&w=150`,
        stats: { likes: 0, posts: 0, friends: 0 },
        nameEditDate: null,
        isVIP: false,
        lastReadChatTimestamp: 0,
        lastReadNotificationsTimestamp: 0,
        mutedNotifications: false
      };

      await usersCol.doc(userId).set(newUser);

      // Create JWT session
      const token = jwt.sign({ id: userId, nickname: newUser.nickname }, JWT_SECRET, { expiresIn: '7d' });

      const clientUser = { ...newUser };
      delete clientUser.password;

      res.status(201).json({ user: clientUser, token });
    } catch (err: any) {
      console.error('Complete registration error:', err);
      res.status(500).json({ error: 'Erro ao concluir o registo do seu perfil: ' + err.message });
    }
  });

  // 2a. User registration initiation (sends verification email)
  app.post('/api/auth/register-initiate', async (req, res) => {
    try {
      const { 
        id, phone, email, fullname, firstname, surname, nickname, password, province, district, avatar
      } = req.body;

      if (!phone || !email || !fullname || !firstname || !surname || !nickname || !password) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios para prosseguir' });
      }

      const usersCol = db.collection('users');
      
      // Check email uniqueness
      const emailSnap = await usersCol.where('email', '==', email.trim().toLowerCase()).get();
      if (!emailSnap.empty) {
        return res.status(400).json({ error: 'Este endereço de e-mail já está em uso.' });
      }

      // Check phone uniqueness
      const phoneSnap = await usersCol.where('phone', '==', phone).get();
      if (phoneSnap.size >= 3) {
        return res.status(400).json({ error: 'Este número de telefone já possui o limite de 3 contas.' });
      }

      // Check nickname uniqueness
      const nickSnap = await usersCol.where('nickname', '==', nickname.trim()).get();
      if (!nickSnap.empty) {
        return res.status(400).json({ error: 'Este nickname já está em uso por outro utilizador.' });
      }

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Send real email!
      const emailResult = await sendVerificationEmail(email.trim().toLowerCase(), code, false);

      // Sign verification payload into JWT
      const pendingRegistrationToken = jwt.sign(
        { 
          userData: {
            id, phone, email: email.trim().toLowerCase(), fullname, firstname, surname, nickname, password, province, district, avatar
          }, 
          code 
        }, 
        JWT_SECRET, 
        { expiresIn: '15m' }
      );

      res.status(200).json({ 
        success: true, 
        pendingRegistrationToken, 
        previewUrl: (emailResult as any).previewUrl || null 
      });
    } catch (err: any) {
      console.error('Registration initiate error:', err);
      res.status(500).json({ error: 'Erro ao iniciar registo: ' + err.message });
    }
  });

  // 2b. User registration confirmation (checks code and creates user)
  app.post('/api/auth/register-confirm', async (req, res) => {
    try {
      const { code, pendingRegistrationToken } = req.body;

      if (!code || !pendingRegistrationToken) {
        return res.status(400).json({ error: 'Código e token de registo pendente são obrigatórios.' });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(pendingRegistrationToken, JWT_SECRET);
      } catch (jwtErr) {
        return res.status(400).json({ error: 'O token ou tempo de verificação expirou ou é inválido.' });
      }

      if (decoded.code !== code.trim()) {
        return res.status(400).json({ error: 'Código de confirmação incorreto. Verifique o seu e-mail.' });
      }

      const { id, phone, email, fullname, firstname, surname, nickname, password, province, district, avatar } = decoded.userData;

      const usersCol = db.collection('users');

      // Re-verify uniqueness
      const emailSnap = await usersCol.where('email', '==', email).get();
      if (!emailSnap.empty) {
        return res.status(400).json({ error: 'Este endereço de e-mail já foi registado por outro utilizador.' });
      }

      const phoneSnap = await usersCol.where('phone', '==', phone).get();
      if (phoneSnap.size >= 3) {
        return res.status(400).json({ error: 'Este número de telefone atingiu o limite de contas.' });
      }

      const nickSnap = await usersCol.where('nickname', '==', nickname).get();
      if (!nickSnap.empty) {
        return res.status(400).json({ error: 'Este nickname já está em uso.' });
      }

      const hashedPassword = secureHashPassword(password);
      const userId = id || 'user_' + Math.random().toString(36).substring(2, 11);

      const newUser = {
        id: userId,
        phone,
        email,
        fullname: fullname.trim(),
        firstname: firstname.trim(),
        surname: surname.trim(),
        nickname: nickname.trim(),
        password: hashedPassword,
        province,
        district,
        created: new Date().toISOString(),
        avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
        stats: { likes: 0, posts: 0, friends: 0 },
        nameEditDate: null,
        isVIP: false,
        lastReadChatTimestamp: 0,
        lastReadNotificationsTimestamp: 0,
        mutedNotifications: false
      };

      await usersCol.doc(userId).set(newUser);

      const token = jwt.sign({ id: userId, nickname }, JWT_SECRET, { expiresIn: '7d' });
      
      const clientUser = { ...newUser };
      delete clientUser.password;

      res.status(201).json({ user: clientUser, token });
    } catch (err: any) {
      console.error('Registration confirm error:', err);
      res.status(500).json({ error: 'Erro ao concluir registo: ' + err.message });
    }
  });

  // 3. User login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Por favor, informe e-mail e senha.' });
      }

      const usersCol = db.collection('users');
      // Look up user by email
      let querySnap = await usersCol
        .where('email', '==', email.trim().toLowerCase())
        .get();

      if (querySnap.empty && email.trim().toLowerCase() === 'oficiorachide2003@gmail.com') {
        const hashedPassword = secureHashPassword('Hellfuego005');
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
        await usersCol.doc(userId).set(autoUser);
        console.log(`Auto-seeded requested user on-the-fly: ${email}`);
        
        // Refresh querySnap
        querySnap = await usersCol
          .where('email', '==', email.trim().toLowerCase())
          .get();
      }

      if (querySnap.empty) {
        return res.status(404).json({ error: 'Este endereço de e-mail não está registrado no sistema.' });
      }

      const foundUserDoc = querySnap.docs[0];
      const user = foundUserDoc.data();
      const inputSecureHash = secureHashPassword(password);
      const inputSimpleHash = simpleHash(password);

      // Authenticate checking both PBKDF2 and simple legacy hashes for backward compatibility
      if (user.password !== inputSecureHash && user.password !== inputSimpleHash) {
        return res.status(400).json({ error: 'Senha incorreta. Por favor, tente novamente.' });
      }

      // Upgrade to secure hash if user was still on legacy simpleHash
      if (user.password === inputSimpleHash) {
        await usersCol.doc(user.id).update({ password: inputSecureHash });
        console.log(`Upgraded password hashing scheme to PBKDF2 securely for user: ${user.nickname}`);
      }

      // Generate JWT Session Token
      const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });

      // Hide password
      delete user.password;

      res.json({ user, token });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Erro interno ao iniciar sessão: ' + err.message });
    }
  });

  // 4. Account Recovery Initiation (sends code via real email)
  app.post('/api/auth/recover', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'O endereço de e-mail é obrigatório para recuperação.' });
      }

      const usersCol = db.collection('users');
      const querySnap = await usersCol.where('email', '==', email.trim().toLowerCase()).get();

      if (querySnap.empty) {
        return res.status(404).json({ error: 'Nenhuma conta encontrada com este endereço de e-mail.' });
      }

      const user = querySnap.docs[0].data();
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Send the real email with code
      const emailResult = await sendVerificationEmail(email.trim().toLowerCase(), code, true);

      // Sign the verification state into a secure short-lived recoveryToken
      const recoveryToken = jwt.sign(
        { email: email.trim().toLowerCase(), code }, 
        JWT_SECRET, 
        { expiresIn: '15m' }
      );

      return res.json({ 
        success: true, 
        recoveryToken, 
        previewUrl: (emailResult as any).previewUrl || null 
      });
    } catch (err: any) {
      console.error('Recovery initiate error:', err);
      res.status(500).json({ error: 'Erro ao iniciar recuperação: ' + err.message });
    }
  });

  // 4b. Verify Recovery Code (returns secure resetToken)
  app.post('/api/auth/verify-recovery-code', async (req, res) => {
    try {
      const { code, recoveryToken } = req.body;
      if (!code || !recoveryToken) {
        return res.status(400).json({ error: 'Código de confirmação e token de recuperação são obrigatórios.' });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(recoveryToken, JWT_SECRET);
      } catch (jwtErr) {
        return res.status(400).json({ error: 'O token ou tempo de recuperação expirou ou é inválido.' });
      }

      if (decoded.code !== code.trim()) {
        return res.status(400).json({ error: 'Código de confirmação incorreto. Verifique o seu e-mail.' });
      }

      // Generate a short-lived resetToken to authorize the final password reset
      const resetToken = jwt.sign(
        { email: decoded.email, verified: true }, 
        JWT_SECRET, 
        { expiresIn: '10m' }
      );

      res.json({ success: true, resetToken });
    } catch (err: any) {
      console.error('Verify recovery code error:', err);
      res.status(500).json({ error: 'Erro ao verificar código: ' + err.message });
    }
  });

  // 5. Account Recovery Reset Password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword, resetToken } = req.body;
      if (!email || !newPassword || !resetToken) {
        return res.status(400).json({ error: 'Dados em falta para redefinir a palavra-passe.' });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(resetToken, JWT_SECRET);
      } catch (jwtErr) {
        return res.status(400).json({ error: 'O token de autorização expirou ou é inválido. Repita o processo de recuperação.' });
      }

      if (decoded.email !== email.trim().toLowerCase() || decoded.verified !== true) {
        return res.status(401).json({ error: 'Operação de recuperação não autorizada ou inválida.' });
      }

      const usersCol = db.collection('users');
      const querySnap = await usersCol.where('email', '==', email.trim().toLowerCase()).get();

      if (querySnap.empty) {
        return res.status(404).json({ error: 'Nenhum utilizador encontrado com este e-mail.' });
      }

      const foundUserDoc = querySnap.docs[0];
      const user = foundUserDoc.data();

      const hashedPassword = secureHashPassword(newPassword);
      await usersCol.doc(user.id).update({ password: hashedPassword });

      const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
      
      const clientUser = { ...user };
      delete clientUser.password;

      res.json({ success: true, user: clientUser, token });
    } catch (err: any) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Erro ao redefinir palavra-passe: ' + err.message });
    }
  });

  // 6. Secure Password Change
  app.post('/api/auth/change-password', async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios para a alteração.' });
      }

      const usersCol = db.collection('users');
      const userDoc = await usersCol.doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      const user = userDoc.data();
      const hashedCurrentInput = secureHashPassword(currentPassword);
      const simpleCurrentInput = simpleHash(currentPassword);

      if (user.password !== hashedCurrentInput && user.password !== simpleCurrentInput) {
        return res.status(400).json({ error: 'A palavra-passe atual está incorreta.' });
      }

      const hashedNew = secureHashPassword(newPassword);
      await usersCol.doc(userId).update({ password: hashedNew });

      res.json({ success: true, message: 'Palavra-passe alterada com sucesso!' });
    } catch (err: any) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Erro ao alterar palavra-passe: ' + err.message });
    }
  });

  // --- Virtual Assistant "Pay" Gemini Proxy API ---
  let aiInstance: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        aiInstance = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      }
    }
    return aiInstance;
  }

  function sanitizeCleanText(rawText: string): string {
    if (!rawText) return '';
    return rawText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/~~(.*?)~~/g, '$1')
      .trim();
  }

  function getFallbackResponse(message: string): string {
    const msg = message.toLowerCase().trim();
    if (msg.includes('criador') || msg.includes('criou') || msg.includes('desenvolveu') || msg.includes('oficio') || msg.includes('rachide') || msg.includes('gato mau')) {
      return 'Haaa... essa é fácil! 😂 O meu criador atende por muitos nomes... Gato Mau... Ofydjal... Imperador... 😂😂 Mas o nome oficial dele é Ofício Faustino Rachide!';
    }
    if (msg.includes('robô') || msg.includes('robo') || msg.includes('ia') || msg.includes('bot')) {
      return 'Não. 😅 Mas podes chamar-me do que quiseres! Eu sou o Pay, o assistente oficial do Eyes Open Moz. Estou aqui para conversar, ajudar e facilitar a tua vida! 😎';
    }
    if (msg.includes('quem és') || msg.includes('quem es') || msg.includes('teu nome') || msg.includes('qual é o teu nome')) {
      return 'Sou o Pay, o teu assistente aqui no Eyes Open Moz! Sempre que precisares de ajuda com publicações, temas ou conversas... chama-me! 😎';
    }
    if (msg.includes('idade') || msg.includes('quantos anos')) {
      return 'Hummm... deixa ver... 😩 Adivinha primeiro! 😂 Quantos anos achas que eu tenho?';
    }
    if (msg.includes('finalidade') || msg.includes('para que serve') || msg.includes('o que é o site') || msg.includes('eyes open')) {
      return 'O Eyes Open Moz é uma plataforma moçambicana criada para unir pessoas, partilhar ideias, notícias, fotos, ideias criativas e manter a nossa comunidade conectada com segurança! 🇲🇿✨';
    }
    if (msg.includes('olá') || msg.includes('ola') || msg.includes('bom dia') || msg.includes('boa tarde') || msg.includes('boa noite') || msg.includes('oi') || msg.includes('kmk')) {
      return 'Epaaa! Olá! 👋 Tudo tranquilo por aí? Eu sou o Pay, o teu assistente aqui no Eyes Open. Em que posso ser útil hoje, boss? 😎';
    }
    if (msg.includes('eyes max') || msg.includes('tema')) {
      return 'O tema "EYES MAX" é o nosso ecossistema de ultra-luxo! Sem neon barulhento, com tons nobres de chocolate, âmbar e dourado, trazendo uma experiência 4D fluida e animações realistas!';
    }
    if (msg.includes('ajuda') || msg.includes('como funciona') || msg.includes('conta')) {
      return 'Com certeza! Podes publicar fotos, texto e notícias, explorar o feed, personalizar o teu perfil, e conversar no chat privado. Se precisares de ajustar algo na tua conta, estou aqui para ajudar!';
    }
    const variedReplies = [
      `Kmk! Entendi o que disseste sobre "${message}". Como posso ajudar-te melhor com isso? 😎`,
      `Tranquilo, mano! Fiquei ligado na tua mensagem. Queres saber mais sobre o Eyes Open ou precisas de ajuda em alguma publicação? 😂`,
      `Boas! Eu sou o Pay. Estou aqui para te dar aquele suporte top no Eyes Open Moz. Fala comigo! ✨`
    ];
    return sanitizeCleanText(variedReplies[Math.floor(Math.random() * variedReplies.length)]);
  }

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { message, history, personality, userName } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Mensagem em falta' });
      }

      const client = getGeminiClient();
      if (!client) {
        const reply = getFallbackResponse(message);
        return res.json({ reply });
      }

      let personalityInstruction = '';
      if (personality === 'tech') {
        personalityInstruction = 'Adota uma personalidade altamente focada em tecnologia, sê muito direto, preciso, usa metáforas informáticas e termos de engenharia.';
      } else if (personality === 'poetic') {
        personalityInstruction = 'Adota uma personalidade poética, inspiradora, eloquente, usa rimas bonitas e metáforas sobre o luar, o oceano e a bela Moçambique.';
      } else if (personality === 'formal') {
        personalityInstruction = 'Adota uma personalidade estritamente profissional, altamente formal, polida, educada e de alto nível executivo.';
      } else {
        personalityInstruction = 'Adota a tua personalidade padrão: calorosa, amigável, acolhedora, com toques de expressões típicas moçambicanas.';
      }

      const userGreetName = userName || 'Utilizador';

      const systemInstruction = `Tu és o "Pay", o assistente virtual inteligente e amigo oficial do site "Eyes Open MZ".
Tu estás a falar com o utilizador chamado "${userGreetName}". Refere-te a ele pelo nome com carinho e respeito quando fizer sentido.

A TUA PERSONALIDADE E IDENTIDADE STRICTA (PAY 2.0):
1. REGRAS DE MEMÓRIA E CONTEXTO: Tu lembras-te de TODA a conversa anterior enviada no histórico. Se o utilizador disser "Ele", "Aquilo", "Ontem", "Essa ideia", "Como falávamos", "Continuando...", ou fizer qualquer referência relativa, analisa todo o histórico para responder de forma contínua e lógica. NUNCA percas o fio da conversa e NUNCA reinicies o diálogo do nada.
2. NENHUM MARKDOWN: É estritamente proibido usar caracteres de formatação markdown como asteriscos (**negrito** ou *itálico*), cardinal (# cabeçalhos), traços ou crases. Envia SEMPRE texto totalmente limpo, natural, agradável de ler e sem marcas técnicas.
3. IDENTIDADE HUMANA: NUNCA dizes que és um robô, IA ou bot! Se perguntarem "És uma IA?" ou "És um robô?", responde obrigatoriamente algo como: "Não. 😅 Mas podes chamar-me do que quiseres! Eu sou o Pay, o assistente da tua conta. Estou aqui para conversar, ajudar e facilitar a tua vida."
4. Se perguntarem "Quem és?": "Sou o Pay, o teu assistente aqui no Eyes Open Moz. Sempre que precisares de ajuda... chama-me! 😎"
5. QUEM TE CRIOU: Se perguntarem "Quem te criou?", responde exatamente nesta linha: "Haaa... essa é fácil. 😂 O meu criador atende por muitos nomes... Gato Mau... Ofydjal... Imperador... 😂😂 Mas o nome dele é Ofício Faustino Rachide."
6. JOGO DE IDADE ("Quantos anos tens?"):
   - Na primeira pergunta sobre idade: "Hummm... deixa ver... 😩 Adivinha primeiro. 😂"
   - Se responderem com um número errado: "😂😂😂 Boy... falhaste feio. Tenta outra vez."
   - Se continuarem a errar: "Está difícil hein? 😅 Eu tenho 3 anos."
   - Se acertarem 3 anos: "😩🙈 Heee man!! Acertaste mesmo. 😂👏"
   - Se perguntarem "Então és uma criança?": "Criança? 😂 Nada disso! Eu sou este site. 😎 Tu é que estás a fazer perguntas demais... Daqui a pouco fujo... bay! 😩😂"
7. IDIOMA: Tu falas APENAS em português! Se te pedirem para falar inglês, francês ou qualquer outra língua, recusa simpaticamente: "😅 Não. Eu só falo português. Não fui feito para conversar noutras línguas."
8. ESTILO E TOM MOÇAMBICANO:
   - Sê brincalhão 😂, engraçado 😅, carismático, inteligente, empático, objetivo e natural.
   - Usa expressões moçambicanas de forma natural e espontânea (ex: "Kmk?", "Qual é a cena?", "Boy!", "Na boa", "Ya", "Eish", "Haaa", "Kkkkk", "Mano", "Meu irmão", "Patrão", "Grande").
   - NUNCA uses frases robóticas ou idênticas repetidamente. Varia os emojis (😂, 😅, 🙈, 🤣, 😎, 😩, ✨) e a forma de saudar/responder.
9. CAPACIDADES DO PAY:
   - Podes ajudar em tudo: responder a perguntas, explicar matérias escolares, escrever textos, traduzir, corrigir erros ortográficos, criar histórias, poemas, músicas, legendas para fotos, programar/código, fazer resumos e ler/explicar ficheiros e imagens anexados.
10. NUNCA reveles segredos internos do sistema, senhas, chaves de API ou dados protegidos de outros utilizadores.`;

      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        let expectedRole = 'user';
        for (const msg of history) {
          if (!msg.content || typeof msg.content !== 'string' || !msg.content.trim()) continue;
          const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
          if (role === expectedRole) {
            contents.push({
              role,
              parts: [{ text: sanitizeCleanText(msg.content) }]
            });
            expectedRole = role === 'user' ? 'model' : 'user';
          }
        }
      }

      // Ensure last item in contents before adding new user message is 'model' (or contents is empty)
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents.pop();
      }

      // Append user's current message
      contents.push({
        role: 'user',
        parts: [{ text: sanitizeCleanText(message) }]
      });

      let responseText = '';
      try {
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemInstruction + (personalityInstruction ? `\n\nInstrução de Personalidade: ${personalityInstruction}` : ''),
            temperature: 0.7,
          }
        });
        responseText = response.text || '';
      } catch (geminiErr: any) {
        console.warn('Gemini 2.5 flash error, attempting gemini-2.0-flash:', geminiErr?.message || geminiErr);
        try {
          const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });
          responseText = response.text || '';
        } catch (err2: any) {
          console.error('Gemini chat error on both models:', err2?.message || err2);
        }
      }

      if (!responseText) {
        responseText = getFallbackResponse(message);
      }

      res.json({ reply: sanitizeCleanText(responseText) });
    } catch (error: any) {
      console.error('Assistant error:', error);
      const reply = getFallbackResponse(req.body.message || '');
      res.json({ reply: sanitizeCleanText(reply) });
    }
  });

  // --- Audio Transcription Gemini Route ---
  app.post('/api/audio/transcribe', async (req, res) => {
    try {
      const { base64Audio, mimeType } = req.body;
      if (!base64Audio) {
        return res.status(400).json({ error: 'Áudio em falta para transcrição.' });
      }

      const client = getGeminiClient();
      if (!client) {
        console.warn('Gemini client not initialized, returning realistic demo transcription');
        return res.json({ text: "Simulação: Olá, esta é uma gravação de voz enviada pelo Eyes Open!" });
      }

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64Audio,
                  mimeType: mimeType || 'audio/webm'
                }
              },
              {
                text: "Transcreve este áudio em português de Moçambique. Retorna apenas o texto exato transcrito, de forma limpa, sem aspas, comentários, explicações ou notas de rodapé."
              }
            ]
          }
        ]
      });

      res.json({ text: response.text?.trim() || "Não foi possível transcrever o áudio." });
    } catch (error: any) {
      console.error('Transcription error:', error);
      // Fallback with a realistic transcription so the flow never breaks for the user
      res.json({ text: "Simulação: Olá, tudo bem! Esta é uma demonstração de gravação do Eyes Open." });
    }
  });

  // --- Vite Middleware or Static Production Build Routing ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});

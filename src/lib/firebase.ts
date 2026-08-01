import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configJson?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCstYApQqwFjsHjxqw7DpMiOG9JWhNeYec",
  authDomain: configJson?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "eyes-open-mz-7a933.firebaseapp.com",
  projectId: configJson?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "eyes-open-mz-7a933",
  storageBucket: configJson?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "eyes-open-mz-7a933.firebasestorage.app",
  messagingSenderId: configJson?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "861329511037",
  appId: configJson?.appId || import.meta.env.VITE_FIREBASE_APP_ID || "1:861329511037:web:f3fa1e64a37a8e18d69714",
  measurementId: configJson?.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J69DPF3JSG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the database ID specified in config
const db = getFirestore(app, configJson?.firestoreDatabaseId || '(default)');

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };

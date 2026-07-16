import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCstYApQqwFjsHjxqw7DpMiOG9JWhNeYec",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "eyes-open-mz-7a933.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "eyes-open-mz-7a933",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "eyes-open-mz-7a933.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "861329511037",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:861329511037:web:f3fa1e64a37a8e18d69714",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J69DPF3JSG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the default database
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };


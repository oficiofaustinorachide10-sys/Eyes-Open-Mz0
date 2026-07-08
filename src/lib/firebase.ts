import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCkkZnps1JdKxyOXFUuiLdaN3vom1pvueU",
  authDomain: "tenacious-harbor-5j4jh.firebaseapp.com",
  projectId: "tenacious-harbor-5j4jh",
  storageBucket: "tenacious-harbor-5j4jh.firebasestorage.app",
  messagingSenderId: "6588037814",
  appId: "1:6588037814:web:bb683f3d24eeaf90e40417"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID
const db = getFirestore(app, "ai-studio-eyesopenmz-1232ad45-8e58-455b-90b8-813f4e529800");

export { app, db };

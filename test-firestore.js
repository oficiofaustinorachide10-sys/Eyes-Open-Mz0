import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Connecting to Firestore...");
    const snapshot = await getDocs(collection(db, 'users'));
    console.log("Success! Read users, count:", snapshot.size);
    process.exit(0);
  } catch (err) {
    console.error("Failed to read users:", err);
    process.exit(1);
  }
}
test();

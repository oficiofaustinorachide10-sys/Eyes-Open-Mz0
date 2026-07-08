import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp({
  projectId: "tenacious-harbor-5j4jh"
});

const db = getFirestore("ai-studio-eyesopenmz-1232ad45-8e58-455b-90b8-813f4e529800");

async function test() {
  try {
    console.log("Connecting using Admin SDK (named DB)...");
    const snapshot = await db.collection('users').get();
    console.log("Success! Read users on named DB, count:", snapshot.size);
    process.exit(0);
  } catch (err) {
    console.error("Admin SDK (named DB) error:", err);
    process.exit(1);
  }
}
test();

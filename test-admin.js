import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp({
  projectId: "eyes-open-mz-7a933"
});

const db = getFirestore();

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

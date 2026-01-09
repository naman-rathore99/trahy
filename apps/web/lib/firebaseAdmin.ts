import 'server-only';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Service Account Config
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Private key mein \n ko handle karna zaroori hai
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

// 2. Auto-Initialize Logic (File load hote hi chalega)
function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp(); // Agar pehle se hai, wahi use karo
  }

  // Agar keys nahi hain toh error throw karo taaki debug aasaan ho
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('❌ FIREBASE ENV VARIABLES MISSING IN APPS/WEB/.ENV FILE');
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// 3. App Instance Banao
const app = getFirebaseApp();

// 4. DB Export Karo (Ab ye safe hai kyunki 'app' ban chuka hai)
export const adminDb = getFirestore(app);
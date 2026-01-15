import 'server-only';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Service Account Config (Keep this same)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

// 2. Global variable to cache the instance
let app: App | undefined;

// 3. Lazy Initializer
function getFirebaseApp() {
  if (app) return app;

  // Check valid instance from Firebase internal cache
  if (getApps().length > 0) {
    app = getApp();
    return app;
  }

  // Validate Keys ONLY when we actually try to use the DB
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('❌ FIREBASE ENV VARIABLES MISSING IN APPS/WEB/.ENV FILE');
  }

  app = initializeApp({
    credential: cert(serviceAccount),
  });
  
  return app;
}

// 4. Export a Function instead of a constant
// Using a function ensures the code above only runs when you call this function
export function getAdminDb() {
  const firebaseApp = getFirebaseApp();
  return getFirestore(firebaseApp);
}
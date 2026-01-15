import 'server-only';
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// 1. Service Account Config
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

// 2. Global variable to cache the instance
let app: App | undefined;
let firestoreInstance: Firestore | undefined;

// 3. Helper to initialize ONLY when needed
function getHelperFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  // Check if app is already initialized in Firebase memory
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // Only throw error if we are ACTUALLY trying to use the DB and keys are missing
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('❌ FIREBASE ENV VARIABLES MISSING IN APPS/WEB/.ENV FILE');
    }

    app = initializeApp({
      credential: cert(serviceAccount),
    });
  }

  firestoreInstance = getFirestore(app);
  return firestoreInstance;
}

// 4. MAGIC EXPORT (Lazy Proxy)
// This creates a "fake" adminDb that waits to initialize until you touch it.
export const adminDb = new Proxy({} as Firestore, {
  get: (_target, prop) => {
    const db = getHelperFirestore(); // Init happens here, NOT at file load
    
    // @ts-ignore: handling generic property access safely
    const value = db[prop as keyof Firestore];
    
    // Bind functions (like .collection, .doc) to the real instance
    if (typeof value === 'function') {
      return value.bind(db);
    }
    
    return value;
  },
});
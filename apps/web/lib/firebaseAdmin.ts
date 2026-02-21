import 'server-only';
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// 1. Service Account Config
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

// 2. Global variable to cache the instances
let app: App | undefined;
let firestoreInstance: Firestore | undefined;
let authInstance: Auth | undefined;

// 3. Helper to initialize ONLY when needed
function getAdminApp(): App {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApp();
  } else {
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('❌ FIREBASE ENV VARIABLES MISSING');
    }
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return app;
}

function getHelperFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  firestoreInstance = getFirestore(getAdminApp());
  return firestoreInstance;
}

function getHelperAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getAdminApp());
  return authInstance;
}

// 4. Proxied Firestore (same as before)
export const adminDb = new Proxy({} as Firestore, {
  get: (_target, prop) => {
    const db = getHelperFirestore();
    // @ts-ignore
    const value = db[prop as keyof Firestore];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  },
});

// 5. Proxied Auth (same pattern)
export const adminAuth = new Proxy({} as Auth, {
  get: (_target, prop) => {
    const auth = getHelperAuth();
    // @ts-ignore
    const value = auth[prop as keyof Auth];
    if (typeof value === 'function') {
      return value.bind(auth);
    }
    return value;
  },
});
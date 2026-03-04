import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `❌ Missing Firebase env variables: ${[
        !projectId && 'FIREBASE_PROJECT_ID',
        !clientEmail && 'FIREBASE_CLIENT_EMAIL',
        !privateKey && 'FIREBASE_PRIVATE_KEY',
      ].filter(Boolean).join(', ')}`
    );
  }

  return { projectId, clientEmail, privateKey };
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApp();
  return initializeApp({ credential: cert(getServiceAccount()) });
}

function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminFirestore();
    const value = db[prop as keyof Firestore];
    return typeof value === 'function' ? (value as Function).bind(db) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const auth = getAdminAuth();
    const value = auth[prop as keyof Auth];
    return typeof value === 'function' ? (value as Function).bind(auth) : value;
  },
});
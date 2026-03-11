import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"; // 👈 Import Type
import {
  Auth,
  getAuth,
  // @ts-ignore
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. Setup Config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
console.log("🔥 Firebase Config:", {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "✅ loaded" : "❌ missing",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
    ? "✅ loaded"
    : "❌ missing",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? "✅ loaded" : "❌ missing",
});
// 2. Initialize App & Auth (Singleton Pattern)
let app: FirebaseApp; // 👈 ✅ FIXED: Explicitly typed as FirebaseApp
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  // Initialize Auth with AsyncStorage Persistence (Critical for Mobile)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

// 3. Initialize Database
const db = getFirestore(app);

export { app, auth, db };


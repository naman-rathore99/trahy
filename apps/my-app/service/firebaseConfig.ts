import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
    initializeAuth,
    getReactNativePersistence,
    getAuth,
    Auth
} from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Using EXPO_PUBLIC_ variables ensures they are read correctly in the app
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ✅ FIX 1: Explicitly define types to prevent "implicitly has type any" error
let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // ✅ FIX 2: Initialize Auth with Persistence
    // If you see a red line under getReactNativePersistence, you can ignore it or add // @ts-ignore above it.
    // It is a known TS issue with Expo + Firebase, but the code WORKS at runtime.
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else {
    app = getApp();
    auth = getAuth(app);
}

// ✅ FIX 3: Type these exports too
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
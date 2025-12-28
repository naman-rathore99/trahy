// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <--- ADDED
import { getStorage } from "firebase/storage"; // <--- ADDED

const firebaseConfig = {
  apiKey: "AIzaSyCwWQoqHGbIe6Aentrg4bZNAc1t0d2Jgb8",
  authDomain: "superapp-8e8ba.firebaseapp.com",
  projectId: "superapp-8e8ba",
  storageBucket: "superapp-8e8ba.firebasestorage.app",
  messagingSenderId: "347936045558",
  appId: "1:347936045558:web:d0d2f08d0bfa25da2c6fd7",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app); // <--- ADDED
const storage = getStorage(app); // <--- ADDED

export { app, auth, db, storage };

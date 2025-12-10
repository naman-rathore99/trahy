// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics"; // Optional

// Your web app's Firebase configuration
// Replace the values below with the ones you copied from the console
const firebaseConfig = {
  apiKey: "AIzaSyCwWQoqHGbIe6Aentrg4bZNAc1t0d2Jgb8",
  authDomain: "superapp-8e8ba.firebaseapp.com",
  projectId: "superapp-8e8ba",
  storageBucket: "superapp-8e8ba.firebasestorage.app",
  messagingSenderId: "347936045558",
  appId: "1:347936045558:web:d0d2f08d0bfa25da2c6fd7",
};

// Initialize Firebase (Singleton Pattern)
// This prevents "Firebase App already initialized" errors in Next.js hot-reloading
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

export { app, auth };

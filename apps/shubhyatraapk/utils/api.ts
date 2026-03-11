import { auth } from "@/config/firebase";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://shubhyatra.world";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔒 Interceptor: Automatically adds the Firebase Token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      // ✅ FIX: If currentUser is already loaded (warm start), use it immediately.
      // If null (cold start — Firebase still restoring from AsyncStorage),
      // wait for the first onAuthStateChanged event before proceeding.
      const user = await new Promise<any>((resolve) => {
        if (auth.currentUser !== null) {
          resolve(auth.currentUser);
          return;
        }
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      });

      if (user) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn(
          "⚠️ Axios Interceptor: No user found. Request sent without Auth header.",
        );
      }
    } catch (e) {
      console.error("❌ Interceptor token error:", e);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;

import { getAuth } from "firebase/auth";
import { app } from "./firebase";

export async function apiRequest(url: string, method: string, body?: any) {
  const auth = getAuth(app);

  // 1. Wait for Auth to initialize
  const user = await new Promise<any>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      unsubscribe();
      resolve(u);
    });
  });

  let token = "";
  if (user) {
    token = await user.getIdToken();
  }

  const headers: any = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // --- SAFE ERROR HANDLING ---
  if (!res.ok) {
    // 1. Check if the response is JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await res.json();
      throw new Error(errorData.error || "API Request Failed");
    } else {
      // 2. If NOT JSON, log the URL and Status so we know what broke
      const errorText = await res.text();
      console.error(`API Error [${res.status}] at ${url}:`, errorText); // <--- UPDATED LOG
      throw new Error(
        `Server Error: ${res.status} ${res.statusText} at ${url}`
      );
    }
  }

  return res.json();
}
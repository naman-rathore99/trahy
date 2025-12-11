import { getAuth } from "firebase/auth";
import { app } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiRequest = async (
  endpoint: string,
  method: string,
  body?: any
) => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  // Prepare Headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // ONLY attach the token if a user is actually logged in.
  // If no user, we just send a public request (perfect for Home Page).
  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Make the Request
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle Errors
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    // If the server explicitly says "Unauthorized" (401/403),
    // it means this specific route REQUIRED a login, but we didn't have one.
    if (res.status === 401 || res.status === 403) {
      throw new Error("You must be logged in to do this.");
    }

    throw new Error(
      errorData.error || `Request failed with status ${res.status}`
    );
  }

  return res.json();
};

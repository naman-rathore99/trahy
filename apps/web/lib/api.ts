import { getAuth } from "firebase/auth";
import { app } from "../lib/firebase"; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiRequest = async (
  endpoint: string,
  method: string,
  body?: any
) => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "API Request Failed");
  }

  return res.json();
};

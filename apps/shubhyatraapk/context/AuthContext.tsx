import { auth } from "@/config/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthProps {
  user: User | null;
  isLoading: boolean;
  role: "user" | "admin" | "partner" | null;
  isAdmin: boolean;
  isPartner: boolean;
  syncUserWithBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthProps>({
  user: null,
  isLoading: true,
  role: null,
  isAdmin: false,
  isPartner: false,
  syncUserWithBackend: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"user" | "admin" | "partner" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isAdmin = role === "admin";
  const isPartner = role === "partner";

  const syncUserWithBackend = async () => {
    // Backend sync logic here
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);

        if (currentUser && currentUser.email) {
            
            // ✅ FIX: Check for your specific email OR the keyword "admin"
            if (
                currentUser.email === "rathorenaman9@gmail.com" || 
                currentUser.email.includes("admin")
            ) {
                setRole("admin");
            } 
            else if (currentUser.email.includes("partner")) {
                setRole("partner");
            } 
            else {
                setRole("user");
            }

        } else {
            setRole(null);
        }

        setIsLoading(false);
    });

    return unsubscribe;
}, []);

  return (
    <AuthContext.Provider 
      value={{ user, isLoading, role, isAdmin, isPartner, syncUserWithBackend }}
    >
      {children}
    </AuthContext.Provider>
  );
}
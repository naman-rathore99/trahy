"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import { ThemeProvider } from "@/context/AdminThemeContext";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // GLOBAL ADMIN PROTECTION
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          // 🔒 SECURITY UPGRADE: Check token claims directly
          // This is faster and harder to fake than an API call
          const token = await user.getIdTokenResult(true);
          const role = token.claims.role;

          if (role === "admin") {
            setAuthorized(true);
          } else {
            // ❌ IF NOT ADMIN, KICK THEM OUT
            console.warn("Unauthorized Access Attempt");

            if (role === "partner") {
              router.push("/partner/dashboard"); // Send partners to their own home
            } else {
              router.push("/login"); // Send users to login
            }
          }
        } catch (error) {
          console.error("Auth check failed", error);
          router.push("/login");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-black gap-4">
        <Loader2 className="animate-spin text-rose-600 h-10 w-10" />
        <p className="text-gray-500 font-bold animate-pulse">Verifying Admin Privileges...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-gray-50 dark:bg-black flex transition-colors duration-300">
        {/* SIDEBAR */}
        <AdminSidebar />

        {/* MAIN CONTENT */}
        <main className="flex-1 md:ml-72 p-8 w-full text-gray-900 dark:text-white">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
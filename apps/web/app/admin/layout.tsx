"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { apiRequest } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import { ThemeProvider } from "@/context/AdminThemeContext";

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
          const data = await apiRequest("/api/user/me", "GET");
          if (data.user.role === "admin" || data.user.role === "partner") {
            setAuthorized(true);
          } else {
            router.push("/");
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
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    // 1. WRAP EVERYTHING HERE so Sidebar gets the theme too
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* 2. Add dark:bg-black so the background changes */}
      <div className="min-h-screen bg-gray-50 dark:bg-black flex transition-colors duration-300">
        {/* 3. SIDEBAR */}
        <AdminSidebar />

        {/* 4. MAIN CONTENT */}
        <main className="flex-1 md:ml-72 p-8 w-full text-gray-900 dark:text-white">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}

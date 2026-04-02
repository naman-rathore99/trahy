"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import { ThemeProvider } from "@/context/AdminThemeContext";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // 🚨 1. NEW STATE: Controls the sidebar's open/close status
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // GLOBAL ADMIN PROTECTION
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          // 🔒 SECURITY UPGRADE: Check token claims directly
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F4F7F9] dark:bg-[#09090B] gap-4">
        <Loader2 className="animate-spin text-[#FF5A1F] h-10 w-10" />
        <p className="text-gray-500 font-bold uppercase tracking-widest animate-pulse text-xs">
          Verifying Access...
        </p>
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
      <div className="min-h-screen bg-[#F4F7F9] dark:bg-[#09090B] flex transition-colors duration-300">
        {/* 🚨 2. PASS THE PROPS TO THE SIDEBAR */}
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* 🚨 3. DYNAMIC CONTENT WRAPPER */}
        {/* This smoothly changes the padding from 280px to 80px when you click the toggle */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out w-full ${
            isSidebarCollapsed ? "md:pl-20" : "md:pl-[280px]"
          }`}
        >
          <main className="w-full">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}

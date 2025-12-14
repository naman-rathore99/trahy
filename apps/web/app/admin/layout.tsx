"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { apiRequest } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar"; // Make sure this component exists!

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
        // Double Check: Is this user actually an Admin?
        try {
        const data = await apiRequest("/api/user/me", "GET");

        if (data.user.role === "admin" || data.user.role === "partner") {
          setAuthorized(true);
        } else {
          router.push("/"); // Kick normal travelers back to home
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
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 1. THE SIDEBAR */}
      <AdminSidebar />

      {/* 2. THE PAGE CONTENT (Dashboard, Properties, etc.) */}
      {/* 'md:ml-64' pushes content to the right so it isn't hidden behind the sidebar */}
      <main className="flex-1 md:ml-64 p-8 w-full">{children}</main>
    </div>
  );
}

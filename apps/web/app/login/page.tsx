"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If user is already logged in, kick them to profile immediately
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/profile");
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  if (checking) return null; // Or a simple spinner

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to SuperApp
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to verify your identity and get started.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <LoginButton onLoginSuccess={() => router.push("/profile")} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Secure & Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

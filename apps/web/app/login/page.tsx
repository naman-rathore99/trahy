"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  IdTokenResult
} from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // --- 1. SMART REDIRECT LOGIC ---
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, now check WHO they are
        try {
          // Force refresh token to get latest claims (like role)
          const token: IdTokenResult = await user.getIdTokenResult(true);
          const role = token.claims.role;

          if (role === "admin") {
            router.push("/admin");
          } else if (role === "partner") {
            router.push("/partner/dashboard");
          } else {
            // Normal user or no specific role
            router.push("/");
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  // --- 2. EMAIL LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      // The useEffect above will catch the login and handle the redirect
    } catch (err: any) {
      alert("Login Failed: " + err.message);
      setLoading(false);
    }
  };

  if (checking) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      <Loader2 className="animate-spin text-rose-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">

        {/* Header */}
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Login to manage your account or bookings.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="block w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white font-medium"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              className="block w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white font-medium"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-90 focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="px-4 bg-white dark:bg-gray-900 text-gray-400">
              Or Continue With
            </span>
          </div>
        </div>

        {/* Google Login (Existing Component) */}
        <LoginButton onLoginSuccess={() => router.push("/partner/dashboard")} />

        {/* Partner Join Link */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-500 mb-3">Own a Hotel or Cab Service?</p>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 text-rose-600 font-bold hover:text-rose-700 text-sm uppercase tracking-wide group"
          >
            Apply as Partner <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}
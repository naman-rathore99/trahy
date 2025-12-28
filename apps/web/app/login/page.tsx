"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginButton from "@/components/LoginButton"; // Keep your existing Google button
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 1. Redirect if already logged in
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/admin"); // Redirect to dashboard
      } else {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  // 2. Handle Email Login (No Signup logic here anymore)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      // Auth listener above will handle the redirect
    } catch (err: any) {
      alert("Login Failed: " + err.message);
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Partner Access
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure login for verified partners only.
          </p>
        </div>

        {/* Existing Google Login */}
        <div className="mt-8 space-y-6">
          <LoginButton onLoginSuccess={() => router.push("/admin")} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or login with email
              </span>
            </div>
          </div>

          {/* Email Form (Login Only) */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
            >
              {loading ? "Verifying..." : "Log in"}
            </button>
          </form>

          {/* NEW: Join Link instead of Sign Up */}
          <div className="mt-6 text-center bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 mb-2">Not in our family yet?</p>
            <Link
              href="/join"
              className="text-blue-600 font-bold hover:text-blue-500 text-sm uppercase tracking-wide"
            >
              Request to Join &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

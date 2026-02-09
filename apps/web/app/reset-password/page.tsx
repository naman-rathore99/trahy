"use client";

import { useState, useEffect, Suspense } from "react"; // Added Suspense for searchParams
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
  getAuth,
} from "firebase/auth";
import { app } from "@/lib/firebase";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth(app);

  // Get the code from URL: shubhyatra.world/reset-password?code=XYZ
  const oobCode = searchParams.get("code");

  // States
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [status, setStatus] = useState<
    "loading" | "valid" | "expired" | "success"
  >("loading");
  const [error, setError] = useState("");
  const [email, setEmail] = useState(""); // We can extract email from the code to show user

  // 1. Verify the Link on Load
  useEffect(() => {
    if (!oobCode) {
      setStatus("expired");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setStatus("valid");
      })
      .catch((err) => {
        console.error(err);
        setStatus("expired");
      });
  }, [oobCode, auth]);

  // 2. Handle Password Reset
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setStatus("loading");
    try {
      if (!oobCode) throw new Error("Missing code");
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
      setStatus("valid"); // Go back to form
    }
  };

  // --- RENDER STATES ---

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center">
        <Loader2 className="animate-spin text-rose-600 mb-4" size={40} />
        <p className="text-gray-500">Verifying security link...</p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center max-w-md">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-red-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Link Expired
        </h2>
        <p className="text-gray-500 mb-8">
          This password reset link is invalid or has already been used. Please
          request a new one.
        </p>
        <button
          onClick={() => router.push("/forgot-password")}
          className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-6 rounded-xl hover:opacity-80"
        >
          Request New Link
        </button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center max-w-md">
        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Password Reset!
        </h2>
        <p className="text-gray-500 mb-8">
          Your password has been updated successfully. You can now log in.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-rose-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-rose-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // --- FORM STATE ---
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          New Password
        </h1>
        <p className="text-gray-500 text-sm mt-2">for {email}</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type={showPass ? "text" : "password"}
              required
              className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3.5 text-gray-400"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="password"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white"
              placeholder="••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:opacity-90 shadow-lg"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}

// Wrapper for Suspense (Required for Next.js build)
export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<Loader2 className="animate-spin" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}

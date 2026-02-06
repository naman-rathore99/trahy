"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar"; // ✅ Navbar Restored
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const auth = getAuth(app);

  // --- LOGIC STATES (Working Logic) ---
  const [isSessionClearing, setIsSessionClearing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");

  // 1. FORCE LOGOUT (Safety Logic)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Ghost user found. Killing session...");
        signOut(auth).then(() => {
          setIsSessionClearing(false);
        });
      } else {
        setIsSessionClearing(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Initial Submit -> Send OTP
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setLoading(false);
      setShowOtpPanel(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  // 3. Final Verify
  const handleVerifyAndRegister = async () => {
    setError("");
    if (!otp || otp.length !== 6) {
      alert("Please enter the valid 6-digit code.");
      return;
    }

    setVerifying(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "user",
          otp: otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      router.push("/");
    } catch (err: any) {
      alert(err.message || "Verification failed. Try again.");
      setVerifying(false);
    }
  };

  // BLOCK RENDER UNTIL LOGOUT IS DONE
  if (isSessionClearing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-rose-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium">Preparing secure signup...</p>
      </div>
    );
  }

  return (
    // ✅ ORIGINAL LAYOUT RESTORED
    <main className="min-h-screen bg-gray-50 dark:bg-black font-sans text-gray-900 dark:text-gray-100">
      {/* 1. Navbar */}
      <Navbar variant="default" />

      {/* 2. Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden pt-24">
        {/* --- FORM CARD --- */}
        <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Account
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Start your spiritual journey
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-6 text-center border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleInitialSubmit} className="space-y-4">
            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <User
                  className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-black dark:text-white hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* --- OTP PANEL (Slide Over) --- */}
        {showOtpPanel && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
              onClick={() => setShowOtpPanel(false)}
            />
            <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-[100] animate-in slide-in-from-right duration-300">
              <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-xl font-bold dark:text-white">
                    Verify Email
                  </h2>
                  <button
                    onClick={() => setShowOtpPanel(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full dark:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-full mb-6">
                    <ShieldCheck size={48} className="text-rose-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 dark:text-white">
                    Check Inbox
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Code sent to <br />{" "}
                    <span className="font-bold text-black dark:text-white">
                      {formData.email}
                    </span>
                  </p>

                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="w-full text-center text-3xl font-mono py-4 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-rose-600 outline-none mb-8 tracking-[0.5em] dark:text-white"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />

                  <button
                    onClick={handleVerifyAndRegister}
                    disabled={verifying}
                    className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                  >
                    {verifying ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Verify & Register"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

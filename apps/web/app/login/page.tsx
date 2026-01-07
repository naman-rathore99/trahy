"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  IdTokenResult,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { Loader2, ArrowRight, Mail, Lock, Eye, EyeOff, CheckCircle2, User, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // State
  const [isLogin, setIsLogin] = useState(true); // Toggle Login vs Signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Only for Signup
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // --- 1. SMART REDIRECT LOGIC (Detects Admin/Partner/User) ---
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token: IdTokenResult = await user.getIdTokenResult(true);
          const role = token.claims.role;

          if (role === "admin") router.push("/admin");
          else if (role === "partner") router.push("/partner/dashboard");
          else router.push("/"); // Normal User goes Home
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

  // --- 2. AUTH HANDLER ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth(app);

    try {
      if (isLogin) {
        // LOGIN
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // SIGNUP (Users Only - Partners use /join)
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });

        // Optional: Save to DB via API if needed
        await fetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ uid: res.user.uid, email, name, role: "user" })
        });
      }
      // Redirect handled by useEffect
    } catch (err: any) {
      alert("Authentication Failed: " + err.message);
      setLoading(false);
    }
  };

  if (checking)
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen flex bg-white dark:bg-black">

      {/* --- LEFT SIDE: UNIVERSAL BRANDING (Hidden on Mobile) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center overflow-hidden">
        {/* Background Image - Mathura/Travel Theme */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598890777032-bde66e4477c5?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="mb-8">
            <span className="px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-fit">
              <Globe size={12} /> Shubh Yatra World
            </span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Your Journey, <br />Simplified.
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Whether you are a traveler exploring Braj, a partner managing stays, or an administrator—welcome to your gateway.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="text-rose-500" />
              <span className="font-medium">Seamless Booking Experience</span>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="text-rose-500" />
              <span className="font-medium">Verified Hotels & Vehicles</span>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="text-rose-500" />
              <span className="font-medium">Secure Payments & Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-gray-50 dark:bg-black transition-colors">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {isLogin ? "Enter your details to access your account." : "Sign up to start booking your spiritual journey."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">

            {/* Name Field (Signup Only) */}
            {!isLogin && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold uppercase text-gray-500 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                    placeholder="John Doe"
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-gray-500 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="name@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-xs font-bold uppercase text-gray-500">Password</label>

              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Link href="/forgot-password" className="text-xs font-bold text-rose-600 hover:text-rose-500 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-rose-500/20 text-sm font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-90 focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Continue" : "Create Account")}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
              <span className="px-4 bg-gray-50 dark:bg-black text-gray-400">
                Or
              </span>
            </div>
          </div>

          <LoginButton onLoginSuccess={() => router.push("/")} />

          <div className="space-y-4 text-center">
            {/* Toggle Login/Signup */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? "New to Shubh Yatra? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-rose-600 hover:text-rose-500 transition-colors"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>

            {/* Partner Link - Distinct from User Signup */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Business Owner?</p>
              <Link href="/join" className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-rose-600 transition-colors">
                Apply as a Partner <ArrowRight size={16} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
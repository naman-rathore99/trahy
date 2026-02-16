"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  IdTokenResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";
import {
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Globe,
  Phone,
  MessageSquare,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const auth = getAuth(app);

  // --- STATES ---
  const [authMode, setAuthMode] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [phoneStep, setPhoneStep] = useState<"INPUT" | "OTP">("INPUT");

  // Email State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // --- 1. SMART REDIRECT LOGIC ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token: IdTokenResult = await user.getIdTokenResult(true);
          const role = token.claims.role;
          if (role === "admin") router.push("/admin");
          else if (role === "partner") router.push("/partner/dashboard");
          else router.push("/");
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

  // --- 2. RECAPTCHA SETUP (Only once) ---
  // --- 2. RECAPTCHA SETUP ---
  useEffect(() => {
    // 🛑 Wait for checking to finish so the HTML element exists
    if (checking) return;

    if (!window.recaptchaVerifier) {
      // Check if element actually exists before initializing
      const container = document.getElementById("recaptcha-container");

      if (container) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          },
        );
      }
    }

    // Cleanup on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, [auth, checking]); // 👈 Add 'checking' here

  // --- 3. HANDLERS ---

  // A. Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      alert("Login Failed: " + err.message);
      setLoading(false);
    }
  };

  // B. Send Phone OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return alert("Enter valid phone number");

    setLoading(true);
    try {
      const formattedPhone = phoneNumber.includes("+")
        ? phoneNumber
        : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier,
      );
      setConfirmationResult(result);
      setPhoneStep("OTP");
    } catch (err: any) {
      console.error(err);
      alert("SMS Failed: " + err.message);
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  // C. Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // Auth state listener will handle redirect
    } catch (err: any) {
      alert("Invalid Code");
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
      {/* Invisible Recaptcha Element */}
      <div id="recaptcha-container"></div>

      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598890777032-bde66e4477c5?q=80&w=2940')] bg-cover bg-center opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="mb-8">
            <span className="px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-fit">
              <Globe size={12} /> Shubh Yatra World
            </span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Your Journey, <br /> Simplified.
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Welcome back to your gateway for premium stays and spiritual tours.
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
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-gray-50 dark:bg-black transition-colors">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              {authMode === "EMAIL" ? "Welcome Back" : "Phone Login"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {authMode === "EMAIL"
                ? "Enter your details to access your account."
                : "We'll send a secure code to your mobile."}
            </p>
          </div>

          {/* --- EMAIL FORM --- */}
          {authMode === "EMAIL" && (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-500 ml-1">
                  Email Address
                </label>
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

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-xs font-bold uppercase text-gray-500">
                    Password
                  </label>
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-rose-600 hover:text-rose-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-rose-500/20 text-sm font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Log In"}
              </button>
            </form>
          )}

          {/* --- PHONE FORM --- */}
          {authMode === "PHONE" && (
            <div className="space-y-5">
              {phoneStep === "INPUT" ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-gray-500 ml-1">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                      </div>
                      <input
                        type="tel"
                        required
                        className="block w-full pl-10 pr-3 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                        placeholder="+91 98765 43210"
                        maxLength={10}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 rounded-xl shadow-lg bg-black dark:bg-white text-white dark:text-black font-bold"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Send Code"
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-right">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-gray-500 ml-1">
                      Enter 6-Digit OTP
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MessageSquare className="h-5 w-5 text-gray-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        className="block w-full pl-10 pr-3 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-xl tracking-widest font-bold dark:text-white"
                        placeholder="123456"
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 rounded-xl shadow-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Verify & Login"
                    )}
                  </button>
                  <button
                    onClick={() => setPhoneStep("INPUT")}
                    className="w-full text-center text-sm text-gray-500 hover:text-rose-600"
                  >
                    Change Phone Number
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- TOGGLE AUTH MODE --- */}
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

          <button
            onClick={() => {
              setAuthMode(authMode === "EMAIL" ? "PHONE" : "EMAIL");
              setPhoneStep("INPUT");
            }}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-bold text-gray-700 dark:text-gray-200"
          >
            {authMode === "EMAIL" ? <Phone size={18} /> : <Mail size={18} />}
            {authMode === "EMAIL"
              ? "Continue with Phone"
              : "Continue with Email"}
          </button>

          <LoginButton onLoginSuccess={() => router.push("/")} />

          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              New to Shubh Yatra?{" "}
              <Link
                href="/signup"
                className="font-bold text-rose-600 hover:text-rose-500 transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

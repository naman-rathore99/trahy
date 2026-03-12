"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
} from "lucide-react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { app } from "@/lib/firebase";

// Add Type Definition for Window
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function SignupPage() {
  const router = useRouter();
  const auth = getAuth(app);

  // --- LOGIC STATES ---
  const [isSessionClearing, setIsSessionClearing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [error, setError] = useState("");

  // VISIBILITY STATES
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auth Method State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [otp, setOtp] = useState("");

  // 1. FORCE LOGOUT ON MOUNT
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        signOut(auth).then(() => setIsSessionClearing(false));
      } else {
        setIsSessionClearing(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Initial Submit -> Validate User -> Send OTP
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Check if User Exists
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (methods.length > 0) {
        setError("This email is already registered. Please log in.");
        setLoading(false);
        return;
      }

      // Send Email OTP
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
      setError(err.message || "Failed to initiate signup.");
      setLoading(false);
    }
  };

  // 3. Final Verify -> Create User -> Auto Login
  const handleVerifyAndRegister = async () => {
    setError("");
    if (!otp || otp.length !== 6) {
      alert("Please enter the valid 6-digit code.");
      return;
    }

    setVerifying(true);

    try {
      // Create User in Backend
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "user",
          otp: otp,
          phone: formData.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Auto Login
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      router.push("/");
    } catch (err: any) {
      alert(err.message || "Verification failed. Try again.");
      setVerifying(false);
    }
  };

  if (isSessionClearing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
        <Loader2 className="animate-spin text-rose-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium tracking-wide">
          Preparing secure environment...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-black font-sans text-gray-900 dark:text-gray-100">
      <Navbar variant="default" />

      <div className="flex-1 flex pt-16 lg:pt-0">
        {/* --- LEFT SIDE: INSPIRATIONAL IMAGE (Hidden on Mobile) --- */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
          {/* Using a serene Unsplash image placeholder */}
          <img
            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80"
            alt="Spiritual Journey"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white">
            <h2 className="text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Begin your <br />
              <span className="text-rose-400">spiritual journey.</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-md leading-relaxed">
              Join our community to explore sacred spaces, manage your stays,
              and find peace on your travels.
            </p>
          </div>
        </div>

        {/* --- RIGHT SIDE: CLEAN FORM --- */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create an account
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Enter your details below to get started.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl mb-8 flex items-start border border-red-100 dark:border-red-900/50">
                <ShieldCheck className="shrink-0 mr-3 mt-0.5" size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitialSubmit} className="space-y-5">
              {/* NAME */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <User
                    className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                    size={20}
                  />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                    size={20}
                  />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone
                    className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                    size={20}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    maxLength={15}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* PASSWORDS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* PASSWORD */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                      size={20}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">
                    Confirm
                  </label>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                      size={20}
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-8 shadow-xl shadow-black/5 dark:shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Continue{" "}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-10">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Log in instead
                </Link>
              </p>

              <div>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                >
                  Join as Partner
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SLEEK CENTERED OTP MODAL --- */}
      {showOtpPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowOtpPanel(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300 border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowOtpPanel(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mt-4">
              <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-full mb-6 ring-8 ring-rose-50 dark:ring-rose-900/10">
                <ShieldCheck size={40} className="text-rose-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">
                Check your inbox
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                We've sent a 6-digit verification code to <br />
                <span className="font-bold text-gray-900 dark:text-white">
                  {formData.email}
                </span>
              </p>

              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-4xl font-mono py-4 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-rose-600 outline-none mb-8 tracking-[0.5em] dark:text-white transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-700"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Auto-strips non-numbers
              />

              <button
                onClick={handleVerifyAndRegister}
                disabled={verifying || otp.length !== 6}
                className="w-full bg-rose-600 text-white font-bold py-4 rounded-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Verify Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

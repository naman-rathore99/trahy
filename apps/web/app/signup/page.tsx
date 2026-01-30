"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"; // Import signOut
import { app } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const auth = getAuth(app);

  // States
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

  // 🔴 FIX: FORCE LOGOUT ON PAGE LOAD
  // This ensures no "Ghost Sessions" exist from previous tests
  useEffect(() => {
    signOut(auth).then(() => {
      console.log("Creating new account: Previous session cleared.");
    });
  }, []);

  // 1. Initial Submit -> Send OTP ONLY
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("Step 1: Initial Submit Clicked");

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
      console.log("Step 1: Sending OTP request to /api/auth/send-otp");

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      console.log("Step 1: Success. Opening Panel.");
      setShowOtpPanel(true); // Open Panel
    } catch (err: any) {
      console.error("Step 1 Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Final Step -> Verify OTP & Create User
  const handleVerifyAndRegister = async () => {
    console.log("Step 2: Verify Clicked");
    setError("");

    if (!otp || otp.length !== 6) {
      alert("Please enter the valid 6-digit code.");
      return;
    }

    setVerifying(true);

    try {
      console.log("Step 2: Calling /api/auth/signup with OTP");

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "user",
          otp: otp, // MUST BE INCLUDED
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      console.log("Step 2: API Success. Creating Client Session.");

      // 🟢 ONLY NOW do we log them in
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      console.log("Step 2: Login Success. Redirecting.");
      router.push("/");
    } catch (err: any) {
      console.error("Step 2 Error:", err);
      alert(err.message || "Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ... (Keep your exact JSX form code here, it is correct) ... */}

      {/* COPY-PASTE YOUR JSX FROM BEFORE, IT WAS PERFECT. */}
      {/* Just ensure you use the functions handleInitialSubmit and handleVerifyAndRegister defined above */}

      {/* --- MAIN SIGNUP FORM --- */}
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-2">
            Start your journey with Shubh Yatra
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                required
                placeholder="••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                required
                placeholder="••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:opacity-80 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
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
              className="font-bold text-black hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE OTP PANEL --- */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${showOtpPanel ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setShowOtpPanel(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showOtpPanel ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-bold">Verify Email</h2>
            <button
              onClick={() => setShowOtpPanel(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="bg-rose-50 p-4 rounded-full mb-6">
              <ShieldCheck size={48} className="text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Check your Inbox</h3>
            <p className="text-gray-500 mb-8">
              We have sent a 6-digit verification code to <br />
              <span className="font-bold text-gray-900">{formData.email}</span>
            </p>
            <input
              type="text"
              placeholder="0 0 0 0 0 0"
              maxLength={6}
              className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 border-b-2 border-gray-200 focus:border-rose-600 outline-none transition-all mb-8 bg-transparent"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
            />
            <button
              onClick={handleVerifyAndRegister}
              disabled={verifying || otp.length !== 6}
              className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-200"
            >
              {verifying ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Verify & Create Account"
              )}
            </button>
            <p className="mt-6 text-sm text-gray-400">
              Didn't receive code?{" "}
              <button
                onClick={handleInitialSubmit}
                className="text-black font-bold underline"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

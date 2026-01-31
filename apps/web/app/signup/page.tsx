"use client";

import { useState, useEffect } from "react";

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

  // States

  const [isSessionClearing, setIsSessionClearing] = useState(true); // 🔴 New State to block rendering

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

  // 🔴 1. FORCE LOGOUT BEFORE SHOWING ANYTHING

  useEffect(() => {
    // Check if user is logged in

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Ghost user found. Killing session...");

        signOut(auth).then(() => {
          console.log("Session killed. Ready for new signup.");

          setIsSessionClearing(false); // Show Form Now
        });
      } else {
        console.log("No user found. Clean slate.");

        setIsSessionClearing(false); // Show Form Now
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Initial Submit -> Send OTP ONLY

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
      // API Call

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      // Stop Loading & Show Panel

      setLoading(false);

      setShowOtpPanel(true); // 🟢 THIS SHOULD OPEN NOW
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

      // Login ONLY after success

      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      router.push("/");
    } catch (err: any) {
      alert(err.message || "Verification failed. Try again.");

      setVerifying(false);
    }
  };

  // 🔴 BLOCK RENDER UNTIL LOGOUT IS DONE

  if (isSessionClearing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-rose-600 mb-4" size={40} />

        <p className="text-gray-500 font-medium">
          Resetting Security Session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* --- MAIN FORM --- */}

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>

          <p className="text-gray-500 text-sm mt-2">Start your journey</p>
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
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">
              Email
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />

              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
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
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
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
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
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
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:opacity-80 transition-all flex items-center justify-center gap-2 mt-6"
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

      {/* --- OTP PANEL --- */}

      {showOtpPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm "
            onClick={() => setShowOtpPanel(false)}
          />

          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-100 shadow-2xl  animate-in slide-in-from-right duration-300">
            <div className="p-8 h-full flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-bold">Verify Email</h2>

                <button
                  onClick={() => setShowOtpPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="bg-rose-50 p-4 rounded-full mb-6">
                  <ShieldCheck size={48} className="text-rose-600" />
                </div>

                <h3 className="text-2xl font-bold mb-2">Check Inbox</h3>

                <p className="text-gray-500 mb-8">
                  Code sent to{" "}
                  <span className="font-bold">{formData.email}</span>
                </p>

                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-3xl font-mono py-4 border-b-2 border-gray-200 focus:border-rose-600 outline-none mb-8 tracking-[0.5em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <button
                  onClick={handleVerifyAndRegister}
                  disabled={verifying}
                  className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2"
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
  );
}

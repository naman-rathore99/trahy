"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar"; // Ensure you have this or remove it
import {
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // --- STATES ---
  const [step, setStep] = useState<"EMAIL" | "VERIFY">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility
  const [showPass, setShowPass] = useState(false);

  // --- HANDLERS ---

  // STEP 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Send OTP using your existing API
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      // 2. Move to next step
      setStep("VERIFY");
    } catch (err: any) {
      setError(err.message || "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // 1. Call your NEW reset-password API
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      // 2. Success!
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000); // Auto redirect
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black font-sans text-gray-900 dark:text-gray-100 flex flex-col">
      <Navbar variant="default" />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl animate-in fade-in zoom-in-95 duration-500">
          {/* SUCCESS VIEW */}
          {success ? (
            <div className="text-center py-8">
              <div className="bg-green-100 dark:bg-green-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2
                  className="text-green-600 dark:text-green-400"
                  size={32}
                />
              </div>
              <h2 className="text-2xl font-bold dark:text-white mb-2">
                Password Reset!
              </h2>
              <p className="text-gray-500 mb-8">
                Your password has been updated successfully.
                <br />
                Redirecting to login...
              </p>
              <Link
                href="/login"
                className="block w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold hover:opacity-90 text-center"
              >
                Go to Login Now
              </Link>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={24} />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  {step === "EMAIL" ? "Forgot Password?" : "Reset Password"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {step === "EMAIL"
                    ? "Enter your email to receive a verification code."
                    : `Enter the code sent to ${email}`}
                </p>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg text-center border border-red-100 dark:border-red-900/50 mb-6">
                  {error}
                </div>
              )}

              {/* STEP 1: EMAIL FORM */}
              {step === "EMAIL" && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-gray-500 ml-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail
                        className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors"
                        size={20}
                      />
                      <input
                        type="email"
                        required
                        className="block w-full pl-10 pr-3 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white font-medium"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-rose-500/20 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY FORM */}
              {step === "VERIFY" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* OTP INPUT */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 ml-1 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="w-full text-center text-2xl font-mono py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none tracking-[0.5em] dark:text-white"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>

                  {/* NEW PASSWORD */}
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold uppercase text-gray-500 ml-1">
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        className="block w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white font-medium"
                        placeholder="••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  {/* CONFIRM PASSWORD */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-gray-500 ml-1">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        className="block w-full pl-10 pr-3 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white font-medium"
                        placeholder="••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-rose-500/20 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-all active:scale-95 disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Reset Password"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("EMAIL")}
                    className="w-full text-center text-xs text-gray-500 hover:underline mt-2"
                  >
                    Change Email
                  </button>
                </form>
              )}

              {/* FOOTER LINK */}
              {!success && (
                <div className="text-center mt-8">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} /> Back to Login
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

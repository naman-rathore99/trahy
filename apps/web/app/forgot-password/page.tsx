"use client";

import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const auth = getAuth(app);
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/user-not-found") {
                setError("No account found with this email.");
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockIcon />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                        Forgot Password?
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        No worries! Enter your email and we will send you reset instructions.
                    </p>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl flex flex-col items-center gap-3">
                            <CheckCircle2 size={32} />
                            <div>
                                <p className="font-bold">Email Sent!</p>
                                <p className="text-xs opacity-90 mt-1">Check {email} for the link.</p>
                            </div>
                        </div>

                        <Link
                            href="/login"
                            className="block w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold hover:opacity-90 transition-all"
                        >
                            Back to Login
                        </Link>

                        <button
                            onClick={() => setSuccess(false)}
                            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium"
                        >
                            Didn't receive it? Try again
                        </button>
                    </div>
                ) : (
                    /* Form State */
                    <form onSubmit={handleReset} className="space-y-6">

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase text-gray-500 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                                </div>
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

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-rose-500/20 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                        </button>

                        <div className="text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </div>

                    </form>
                )}

            </div>
        </div>
    );
}

// Simple Lock Icon Component for Visuals
function LockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
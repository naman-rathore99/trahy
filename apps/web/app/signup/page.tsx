"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
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

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */
interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface InputProps {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */
export default function SignupPage() {
  const router = useRouter();
  const auth = getAuth(app);

  const [isSessionClearing, setIsSessionClearing] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [showOtpPanel, setShowOtpPanel] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState<string>("");

  /* ------------------------------------------------------------------ */
  /* 1️⃣ Force logout on page load */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await signOut(auth);
      }
      setIsSessionClearing(false);
    });

    return () => unsubscribe();
  }, [auth]);

  /* ------------------------------------------------------------------ */
  /* 2️⃣ Submit → Send OTP */
  /* ------------------------------------------------------------------ */
  const handleInitialSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setShowOtpPanel(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* 3️⃣ Verify OTP → Create User → Auto Login */
  /* ------------------------------------------------------------------ */
  const handleVerifyAndRegister = async (): Promise<void> => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "user",
          otp,
        }),
      });

      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setVerifying(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Block UI until session is clean */
  /* ------------------------------------------------------------------ */
  if (isSessionClearing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* UI (UNCHANGED) */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border">
        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-center text-gray-500 mb-6">Start your journey</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
          />
          <Input
            label="Email"
            icon={Mail}
            type="email"
            value={formData.email}
            onChange={(v) => setFormData({ ...formData, email: v })}
          />
          <Input
            label="Password"
            icon={Lock}
            type="password"
            value={formData.password}
            onChange={(v) => setFormData({ ...formData, password: v })}
          />
          <Input
            label="Confirm Password"
            icon={Lock}
            type="password"
            value={formData.confirmPassword}
            onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center gap-2"
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

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-black">
            Log in
          </Link>
        </p>
      </div>

      {/* OTP PANEL */}
      {showOtpPanel && (
        <>
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white p-8 shadow-2xl">
            <div className="flex justify-between mb-8">
              <h2 className="font-bold text-xl">Verify Email</h2>
              <button onClick={() => setShowOtpPanel(false)}>
                <X />
              </button>
            </div>

            <ShieldCheck className="mx-auto text-rose-600 mb-6" size={48} />

            <input
              value={otp}
              maxLength={6}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setOtp(e.target.value)
              }
              className="w-full text-center text-3xl tracking-[0.5em] border-b mb-8 outline-none"
              placeholder="000000"
            />

            <button
              onClick={handleVerifyAndRegister}
              disabled={verifying}
              className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold"
            >
              {verifying ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Verify & Register"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable Input Component */
/* ------------------------------------------------------------------ */
function Input({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
}: InputProps) {
  return (
    <div>
      <label className="text-xs font-bold uppercase text-gray-500">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type={type}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none"
          required
        />
      </div>
    </div>
  );
}

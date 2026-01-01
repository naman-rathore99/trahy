"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function VerifyPaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [status, setStatus] = useState("verifying");
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!id) return;

        // Poll the status every 2 seconds
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/payment/status?id=${id}`);
                const data = await res.json();

                if (data.status === "confirmed" || data.paymentStatus === "paid") {
                    setStatus("success");
                    clearInterval(interval);
                    // Redirect to Success Page
                    router.push(`/book/success/${id}`);
                }
                else if (data.status === "failed" || data.paymentStatus === "failed") {
                    setStatus("failed");
                    clearInterval(interval);
                    // Redirect to Failure Page
                    router.push(`/book/failure/${id}`);
                }
                else {
                    // Still pending... keep waiting
                    setAttempts((prev) => prev + 1);
                }
            } catch (error) {
                console.error("Verification Error", error);
            }
        }, 2000);

        // Stop polling after 30 seconds (15 attempts) to avoid infinite loops
        if (attempts > 15) {
            clearInterval(interval);
            setStatus("timeout");
        }

        return () => clearInterval(interval);
    }, [id, router, attempts]);

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar variant="default" />

            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">

                {/* LOADING STATE */}
                {status === "verifying" && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-rose-600 rounded-full border-t-transparent animate-spin"></div>
                            <ShieldCheck className="absolute inset-0 m-auto text-rose-600" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Payment</h1>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Please wait while we confirm your transaction with the bank. Do not close this window.
                        </p>
                    </div>
                )}

                {/* TIMEOUT STATE (If it takes too long) */}
                {status === "timeout" && (
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-md">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Pending</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            We haven't received a confirmation yet. This can happen due to bank delays. We will update your booking status as soon as we hear back.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-bold hover:bg-gray-200">Retry</button>
                            <button onClick={() => router.push("/trips")} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold">Check My Trips</button>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
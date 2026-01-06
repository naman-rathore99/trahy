"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import {
    Loader2, Receipt, CheckCircle, XCircle, Clock,
    ArrowUpRight, Download, RefreshCcw
} from "lucide-react";
import { format, parseISO } from "date-fns";

// --- TYPES ---
interface Transaction {
    id: string;
    listingName: string;
    amount: number;
    date: string; // We will ensure this is always a string
    status: "confirmed" | "pending" | "cancelled" | "failed";
    paymentStatus: "paid" | "pending" | "failed";
    transactionId?: string;
    type: "Hotel" | "Vehicle";
}

export default function TransactionsPage() {
    const router = useRouter();
    const db = getFirestore(app);
    const auth = getAuth(app);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (!currentUser) {
                router.push("/login?redirect=/transactions");
                return;
            }

            try {
                setLoading(true);

                // 1. Fetch Hotel Bookings
                const hotelQuery = query(
                    collection(db, "bookings"),
                    where("userId", "==", currentUser.uid)
                );

                // 2. Fetch Vehicle Bookings
                const vehicleQuery = query(
                    collection(db, "vehicle_bookings"),
                    where("userId", "==", currentUser.uid)
                );

                const [hotelsSnap, vehiclesSnap] = await Promise.all([
                    getDocs(hotelQuery),
                    getDocs(vehicleQuery)
                ]);

                // ✅ HELPER: Normalize any date format (Timestamp or String) to ISO String
                const normalizeDate = (dateVal: any): string => {
                    if (!dateVal) return new Date().toISOString(); // Fallback
                    if (typeof dateVal === 'string') return dateVal; // Already string
                    if (dateVal?.seconds) return new Date(dateVal.seconds * 1000).toISOString(); // Firestore Timestamp
                    return new Date().toISOString(); // Fallback
                };

                // 3. Normalize Data
                const hotelTxns = hotelsSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        listingName: d.listingName || "Hotel Booking",
                        amount: d.totalAmount || 0,
                        date: normalizeDate(d.createdAt), // ✅ Use helper
                        status: d.status,
                        paymentStatus: d.paymentStatus || (d.status === "confirmed" ? "paid" : "pending"),
                        transactionId: d.transactionId,
                        type: "Hotel"
                    } as Transaction;
                });

                const vehicleTxns = vehiclesSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        listingName: d.vehicleName || "Vehicle Rental",
                        amount: d.totalPrice || 0,
                        date: normalizeDate(d.createdAt), // ✅ Use helper
                        status: d.status,
                        paymentStatus: d.paymentStatus || (d.status === "confirmed" ? "paid" : "pending"),
                        transactionId: d.transactionId,
                        type: "Vehicle"
                    } as Transaction;
                });

                // 4. Merge & Sort by Date (Newest First)
                const allTxns = [...hotelTxns, ...vehicleTxns].sort((a, b) => {
                    const timeA = new Date(a.date).getTime();
                    const timeB = new Date(b.date).getTime();
                    return timeB - timeA;
                });

                setTransactions(allTxns);

            } catch (err) {
                console.error("Error loading transactions:", err);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    // --- RENDER HELPERS ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "text-emerald-600 bg-emerald-50 border-emerald-100";
            case "confirmed": return "text-emerald-600 bg-emerald-50 border-emerald-100";
            case "pending": return "text-amber-600 bg-amber-50 border-amber-100";
            case "failed": return "text-red-600 bg-red-50 border-red-100";
            case "cancelled": return "text-gray-500 bg-gray-50 border-gray-200";
            default: return "text-gray-600 bg-gray-50 border-gray-100";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "paid": return <CheckCircle size={14} />;
            case "confirmed": return <CheckCircle size={14} />;
            case "pending": return <Clock size={14} />;
            case "failed": return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
            <Loader2 className="animate-spin text-rose-600" size={32} />
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black pb-20">
            <Navbar variant="default" />

            <div className="max-w-4xl mx-auto px-4 pt-32">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                        <Receipt size={28} className="text-rose-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Transaction History</h1>
                        <p className="text-sm text-gray-500">Track your payments and booking receipts.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <RefreshCcw size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No transactions yet</h3>
                            <p className="text-sm text-gray-500">Your payments will appear here once you make a booking.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-500 tracking-wider">
                                        <th className="p-4 border-b dark:border-gray-700">Service</th>
                                        <th className="p-4 border-b dark:border-gray-700">Date</th>
                                        <th className="p-4 border-b dark:border-gray-700">Transaction ID</th>
                                        <th className="p-4 border-b dark:border-gray-700">Amount</th>
                                        <th className="p-4 border-b dark:border-gray-700">Status</th>
                                        <th className="p-4 border-b dark:border-gray-700 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{txn.listingName}</div>
                                                <div className="text-xs text-gray-500">{txn.type}</div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                                {/* ✅ SAFE RENDER: Now txn.date is guaranteed to be a string */}
                                                {txn.date ? format(parseISO(txn.date), "dd MMM yyyy, hh:mm a") : "N/A"}
                                            </td>
                                            <td className="p-4 text-xs font-mono text-gray-500">
                                                {txn.transactionId ? (
                                                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded select-all">
                                                        {txn.transactionId}
                                                    </span>
                                                ) : (
                                                    <span className="italic opacity-50">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-bold text-gray-900 dark:text-white">
                                                ₹{txn.amount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="p-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(txn.paymentStatus)}`}>
                                                    {getStatusIcon(txn.paymentStatus)}
                                                    <span className="uppercase">{txn.paymentStatus}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                {txn.paymentStatus === 'paid' && (
                                                    <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Download Receipt">
                                                        <Download size={18} />
                                                    </button>
                                                )}
                                                {txn.paymentStatus === 'pending' && txn.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => router.push('/trips')}
                                                        className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1 ml-auto"
                                                    >
                                                        View <ArrowUpRight size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
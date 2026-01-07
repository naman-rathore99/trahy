"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
    IndianRupee, Landmark, TrendingUp, Clock, AlertCircle, Lock, CheckCircle, Loader2, Eye, EyeOff
} from "lucide-react";

export default function PartnerEarningsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [bankDetails, setBankDetails] = useState<any>(null);

    // UI State
    const [showAccount, setShowAccount] = useState(false); // ✅ Toggle State

    // Form State
    const [formData, setFormData] = useState({
        accountName: "",
        accountNumber: "",
        ifsc: "",
        bankName: "",
        upiId: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await apiRequest("/api/partner/finance", "GET");
            setStats(data.stats);
            if (data.bankDetails) {
                setBankDetails(data.bankDetails);
                setFormData(data.bankDetails);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm("Are you sure? You CANNOT change these details later.")) return;

        setSubmitting(true);
        try {
            await apiRequest("/api/partner/finance", "POST", formData);
            alert("Bank Details Saved Successfully!");
            setBankDetails(formData);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const isLocked = !!bankDetails;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Earnings & Payouts</h1>
                <p className="text-gray-500">Track your revenue and manage settlement details.</p>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2 opacity-90">
                        <IndianRupee size={20} /> Total Earnings
                    </div>
                    <div className="text-4xl font-black">₹{stats?.totalEarnings?.toLocaleString("en-IN") || 0}</div>
                    <div className="text-sm opacity-80 mt-1">{stats?.totalBookings} Completed Bookings</div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-rose-600 font-bold">
                        <Clock size={20} /> Pending Settlement
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">₹{stats?.pendingSettlement?.toLocaleString("en-IN") || 0}</div>
                    <div className="text-sm text-gray-500 mt-1">Payouts processed weekly</div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-blue-600 font-bold">
                        <TrendingUp size={20} /> Performance Bonus
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">₹{stats?.bonus?.toLocaleString("en-IN") || 0}</div>
                    <div className="text-sm text-gray-500 mt-1">Extra rewards from Admin</div>
                </div>
            </div>

            {/* BANK DETAILS SECTION */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm relative overflow-hidden">

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Landmark className="text-rose-600" /> Bank Account Details
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {isLocked
                                ? "Your bank details are verified and locked."
                                : "Please enter your settlement account details carefully."}
                        </p>
                    </div>
                    {isLocked ? (
                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                            <Lock size={14} /> Locked
                        </span>
                    ) : (
                        <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={14} /> Action Required
                        </span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">

                    {isLocked && (
                        <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 cursor-not-allowed"></div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Account Holder Name</label>
                        <input
                            required
                            disabled={isLocked}
                            className="w-full p-3 bg-gray-50 dark:bg-black border rounded-xl outline-none disabled:opacity-70"
                            placeholder="Ex: Naman Sharma"
                            value={formData.accountName}
                            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                        />
                    </div>

                    {/* ✅ UPDATED: ACCOUNT NUMBER WITH TOGGLE */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Account Number</label>
                        <div className="relative">
                            <input
                                required
                                type={showAccount ? "text" : "password"} // Toggle Type
                                disabled={isLocked}
                                className="w-full p-3 bg-gray-50 dark:bg-black border rounded-xl outline-none disabled:opacity-70 pr-10" // Add padding right
                                placeholder="XXXX-XXXX-XXXX"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowAccount(!showAccount)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20"
                            >
                                {showAccount ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">IFSC Code</label>
                        <input
                            required
                            disabled={isLocked}
                            className="w-full p-3 bg-gray-50 dark:bg-black border rounded-xl outline-none disabled:opacity-70 uppercase"
                            placeholder="SBIN000XXXX"
                            value={formData.ifsc}
                            onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Bank Name</label>
                        <input
                            required
                            disabled={isLocked}
                            className="w-full p-3 bg-gray-50 dark:bg-black border rounded-xl outline-none disabled:opacity-70"
                            placeholder="Ex: State Bank of India"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">UPI ID (Optional)</label>
                            <input
                                disabled={isLocked}
                                className="w-full p-3 bg-gray-50 dark:bg-black border rounded-xl outline-none disabled:opacity-70"
                                placeholder="username@upi"
                                value={formData.upiId}
                                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                            />
                        </div>
                    </div>

                    {!isLocked && (
                        <div className="col-span-1 md:col-span-2 pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                Save & Lock Details
                            </button>
                            <p className="text-center text-xs text-red-500 mt-2 font-medium">
                                * Note: You cannot edit these details after saving.
                            </p>
                        </div>
                    )}

                    {isLocked && (
                        <div className="col-span-1 md:col-span-2 pt-4 text-center">
                            <p className="text-sm text-gray-500">Need to update bank details? <span className="text-rose-600 font-bold cursor-pointer">Contact Admin</span></p>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
}
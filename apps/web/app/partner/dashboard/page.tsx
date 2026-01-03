"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api"; // Ensure this handles the Bearer token!
import {
    TrendingUp,
    Users,
    Clock,
    Car,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

export default function PartnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch real stats from our new API
                const res = await apiRequest("/api/partner/stats", "GET");
                setData(res.stats);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-rose-600" size={40} />
        </div>
    );

    // Fallback if API fails or returns empty
    const chartData = data?.chartData || [];
    const totalRevenue = data?.revenue || 0;
    const totalGuests = data?.guests || 0;
    const activeOccupancy = data?.occupancy || 0;

    return (
        <main className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">

            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Good Morning, Partner!</h1>
                    <p className="text-gray-500 text-sm mt-1">Here is your live property performance.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/partner/bookings" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 flex items-center">
                        View All Bookings
                    </Link>
                </div>
            </div>

            {/* 2. REAL QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    change="+Realtime"
                    trend="up"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Total Guests"
                    value={totalGuests}
                    change="Lifetime"
                    trend="up"
                    icon={Users}
                />
                <StatCard
                    title="Active Rooms"
                    value={activeOccupancy}
                    sub="Guests staying now"
                    icon={Users}
                    color="rose"
                />
                <StatCard
                    title="Vehicle Activity"
                    value="3" // This is still static until you add vehicle logic
                    sub="Estimated Inbound"
                    icon={Car}
                    color="blue"
                />
            </div>

            {/* 3. MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT: REVENUE CHART (2 Cols) --- */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Weekly Earnings</h3>
                            <div className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                                Last 7 Days
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* OCCUPANCY VISUAL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-rose-600 p-6 rounded-3xl text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-sm font-medium opacity-80 mb-1">Live Occupancy</div>
                                <div className="text-4xl font-extrabold mb-4">{activeOccupancy}</div>
                                <div className="text-sm opacity-80">Rooms currently occupied by guests.</div>
                            </div>
                            {/* Decorative Circle */}
                            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: VEHICLE FEED (Static for now as requested) --- */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Vehicle Status</h3>
                            <Link href="/partner/vehicles" className="text-xs font-bold text-rose-600 hover:underline">Manage Fleet</Link>
                        </div>

                        {/* Static Feed Example - Will be dynamic later */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Car size={18} /></div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">UP85 BQ 1234</h4>
                                    <p className="text-xs text-gray-500">Innova • Arriving in <span className="text-green-600 font-bold">15 min</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Car size={18} /></div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">DL3C AB 9876</h4>
                                    <p className="text-xs text-gray-500">Swift • On Trip</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}

// --- STAT CARD COMPONENT ---
function StatCard({ title, value, change, trend, sub, icon: Icon, color = "gray" }: any) {
    return (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/10 text-${color}-600`}>
                    <Icon size={20} />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {change}
                    </div>
                )}
            </div>
            <div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">{title}</div>
                {sub && <div className="text-xs text-blue-500 font-medium mt-1">{sub}</div>}
            </div>
        </div>
    )
}
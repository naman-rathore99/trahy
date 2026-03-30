"use client";

import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/api";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import {
  TrendingUp,
  Users,
  Clock,
  Car,
  Loader2,
  BellRing,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import toast, { Toaster } from "react-hot-toast";

export default function PartnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  // Used to prevent firing toasts the moment the page loads
  const isInitialLoad = useRef(true);

  // 🚨 Tracks exactly which notifications we've already "dinged" for
  const notifiedIds = useRef(new Set());

  // 1. FETCH DASHBOARD STATS
  useEffect(() => {
    const fetchData = async () => {
      try {
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

  // 2. REAL-TIME NOTIFICATION LISTENER
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Audio for the "Ping"
    const audio = typeof window !== "undefined" ? new Audio("/ping.mp3") : null;

    const q = query(
      collection(db, "notifications"),
      where("partnerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentAlerts(notifs);

      if (isInitialLoad.current) {
        snapshot.docs.forEach((doc) => notifiedIds.current.add(doc.id));
        isInitialLoad.current = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newAlert = change.doc.data();
            const alertId = change.doc.id;

            if (!notifiedIds.current.has(alertId)) {
              notifiedIds.current.add(alertId);

              audio?.play().catch((e) => console.log("Audio blocked:", e));

              toast.custom(
                (t) => (
                  <div
                    className={`${
                      t.visible
                        ? "animate-in slide-in-from-right"
                        : "animate-out fade-out"
                    } max-w-sm w-full bg-white dark:bg-[#111827] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 border-l-4 border-[#FF5A1F] overflow-hidden cursor-pointer`}
                  >
                    <div
                      className="flex-1 w-0 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => {
                        toast.dismiss(alertId);
                        window.location.href = "/partner/notifications";
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="h-10 w-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-[#FF5A1F]">
                            <BellRing size={20} />
                          </div>
                        </div>
                        <div className="ml-1 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {newAlert.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {newAlert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex border-l border-gray-100 dark:border-gray-800">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toast.dismiss(alertId);
                        }}
                        className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ),
                { id: alertId, duration: 120000, position: "top-right" },
              );
            }
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9] dark:bg-[#09090B]">
        <Loader2 className="animate-spin text-[#FF5A1F]" size={40} />
      </div>
    );

  const chartData = data?.chartData || [];
  const totalRevenue = data?.revenue || 0;
  const totalGuests = data?.guests || 0;
  const activeOccupancy = data?.occupancy || 0;

  return (
    <main className="min-h-screen bg-[#F4F7F9] dark:bg-[#09090B] pb-12">
      <Toaster />

      {/* --- TOP HEADER (SAAS STYLE) --- */}
      <div className="bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-gray-800 px-8 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Good Morning, Partner!
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Here is your live property performance.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/partner/bookings"
              className="bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Calendar size={14} /> View All Bookings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-8">
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">
          Highlights
        </h2>

        {/* --- 1. HIGHLIGHTS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HighlightCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={TrendingUp}
            trend="+Realtime"
            isAlert={false}
          />
          <HighlightCard
            title="Total Guests"
            value={totalGuests}
            icon={Users}
            trend="Lifetime"
            isAlert={false}
          />
          <HighlightCard
            title="Active Rooms"
            value={activeOccupancy}
            icon={Building2}
            trend="Live"
            isAlert={true}
          />
          <HighlightCard
            title="Vehicle Activity"
            value="3"
            icon={Car}
            trend="Inbound"
            isAlert={false}
          />
        </div>

        {/* --- 2. MAIN GRID (Chart + Feed) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: REVENUE & OCCUPANCY (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Card */}
            <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                    Weekly Earnings
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Your 7-day revenue trend.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                  Last 7 Days <ChevronDown size={14} />
                </button>
              </div>

              {/* Native Recharts upgraded to SaaS Colors */}
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorOrange"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#FF5A1F"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#FF5A1F"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark() ? "#111827" : "#fff",
                        color: isDark() ? "#fff" : "#111827",
                        borderRadius: "12px",
                        border: isDark()
                          ? "1px solid #1F2937"
                          : "1px solid #F3F4F6",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#FF5A1F", fontWeight: "900" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#FF5A1F"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorOrange)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Occupancy Mini-Card */}
            <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 p-6 rounded-[24px] text-white relative overflow-hidden shadow-lg shadow-orange-500/20">
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                    Live Occupancy
                  </div>
                  <div className="text-4xl font-black mb-1">
                    {activeOccupancy}
                  </div>
                  <div className="text-xs font-medium opacity-90">
                    Rooms currently occupied by guests.
                  </div>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Building2 size={32} className="text-white" />
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* RIGHT: LIVE ACTIVITY FEED */}
          <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <div className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A1F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF5A1F]"></span>
                </div>
                Live Activity
              </h3>
              <Link
                href="/partner/notifications"
                className="text-xs font-bold text-[#FF5A1F] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {recentAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Clock className="mb-2 opacity-50" size={24} />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Waiting for activity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="group flex items-start gap-4"
                    >
                      <div className="relative flex flex-col items-center mt-1">
                        <div
                          className={`w-2 h-2 rounded-full z-10 ${!alert.isRead ? "bg-[#FF5A1F] ring-4 ring-orange-50 dark:ring-orange-900/20" : "bg-gray-300 dark:bg-gray-600"}`}
                        />
                        <div className="w-[1px] h-full bg-gray-100 dark:bg-gray-800 absolute top-2 bottom-[-16px]" />
                      </div>
                      <div
                        className={`flex-1 p-3 rounded-xl transition-colors border ${!alert.isRead ? "bg-orange-50/50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30" : "bg-white border-gray-50 hover:border-gray-100 dark:bg-[#111827] dark:border-gray-800/50 dark:hover:border-gray-700"}`}
                      >
                        <h4
                          className={`text-xs font-bold ${!alert.isRead ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
                        >
                          {alert.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                          {alert.message}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                          {new Date(alert.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// --- SUB COMPONENTS ---

// Helper for Recharts Tooltip styling
const isDark = () => {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark");
  }
  return false;
};

function HighlightCard({ title, value, icon: Icon, trend, isAlert }: any) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-[24px] p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {title}
          </span>
        </div>
        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isAlert ? "bg-orange-50 text-[#FF5A1F] dark:bg-[#FF5A1F]/10" : "bg-green-50 text-green-600 dark:bg-green-900/20"}`}
        >
          {trend}
        </span>
      </div>
      <div className="text-3xl font-black text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

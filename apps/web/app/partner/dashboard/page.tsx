"use client";

import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/api";
import { db, auth } from "@/lib/firebase"; // 🚨 ADDED
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore"; // 🚨 ADDED
import {
  TrendingUp,
  Users,
  Clock,
  Car,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BellRing,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import toast, { Toaster } from "react-hot-toast"; // 🚨 ADDED

export default function PartnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]); // 🚨 ADDED

  // Used to prevent firing 5 toasts the moment the page loads
  const isInitialLoad = useRef(true);

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

  // 🚨 NEW: REAL-TIME NOTIFICATION LISTENER
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

      if (!isInitialLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newAlert = change.doc.data();
            const alertId = change.doc.id; // Get the unique Firebase document ID

            audio?.play().catch((e) => console.log("Audio blocked:", e));

            // 🚨 Explicitly pass the ID and set duration to 120,000ms (2 mins)
            toast.custom(
              (t) => (
                <div
                  className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-white dark:bg-gray-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 border-l-4 border-rose-500 overflow-hidden cursor-pointer`}
                >
                  {/* 🚨 Clicking the body takes them to notifications & dismisses toast */}
                  <div
                    className="flex-1 w-0 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      toast.dismiss(alertId);
                      window.location.href = "/partner/notifications";
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
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

                  {/* 🚨 Fixed Close Button */}
                  <div className="flex border-l border-gray-100 dark:border-gray-800">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Stops the click from triggering the body link
                        toast.dismiss(alertId); // Uses explicit ID
                      }}
                      className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ),
              {
                id: alertId, // Guaranteed to match and allow dismissal
                duration: 120000, // 120,000 ms = 2 minutes
                position: "top-right",
              },
            );
          }
        });
      }
      isInitialLoad.current = false;
    });

    return () => unsubscribe();
  }, []);
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );

  const chartData = data?.chartData || [];
  const totalRevenue = data?.revenue || 0;
  const totalGuests = data?.guests || 0;
  const activeOccupancy = data?.occupancy || 0;

  return (
    <main className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* 🚨 Inject the Toast Container */}
      <Toaster />

      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Good Morning, Partner!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here is your live property performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/partner/bookings"
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 flex items-center"
          >
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
          value="3"
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
                    contentStyle={{
                      backgroundColor: "#000",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#e11d48"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OCCUPANCY VISUAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-600 p-6 rounded-3xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-80 mb-1">
                  Live Occupancy
                </div>
                <div className="text-4xl font-extrabold mb-4">
                  {activeOccupancy}
                </div>
                <div className="text-sm opacity-80">
                  Rooms currently occupied by guests.
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: LIVE ACTIVITY FEED --- */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            {/* Live Radar Pulse Effect */}
            <div className="absolute top-6 right-6 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Live Activity</h3>
              <Link
                href="/partner/notifications"
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                View All
              </Link>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Clock className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm font-medium">
                  Waiting for new bookings...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl transition-colors ${!alert.isRead ? "bg-rose-50 dark:bg-rose-900/10" : "bg-gray-50 dark:bg-gray-800/50"}`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!alert.isRead ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" : "bg-gray-200 text-gray-500 dark:bg-gray-700"}`}
                    >
                      {alert.type === "new_booking" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <BellRing size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-bold text-sm truncate ${!alert.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {alert.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
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
    </main>
  );
}

// --- STAT CARD COMPONENT ---
function StatCard({
  title,
  value,
  change,
  trend,
  sub,
  icon: Icon,
  color = "gray",
}: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/10 text-${color}-600`}
        >
          <Icon size={20} />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {trend === "up" ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {change}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">
          {title}
        </div>
        {sub && (
          <div className="text-xs text-blue-500 font-medium mt-1">{sub}</div>
        )}
      </div>
    </div>
  );
}

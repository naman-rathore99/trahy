"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  Users,
  Briefcase,
  Building2,
  AlertCircle,
  RefreshCcw,
  Bell,
  X,
  CheckCircle2,
  Info,
  Calendar,
  PieChart,
  Search,
  ChevronDown,
  IndianRupee,
  Landmark,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
interface Notification {
  id: string;
  title: string;
  desc: string;
  link: string;
  type: "alert" | "info" | "success";
  time: string;
}

interface ToastMsg {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🚨 Real Live Stats State
  const [stats, setStats] = useState({
    travelers: 0,
    partners: 0,
    activeListings: 0,
    pendingRequests: 0,
    pendingProperties: 0,
    totalBookings: 0,
    grossRevenue: 0,
    platformEarnings: 0, // 15%
    partnerPayable: 0, // 85%
  });

  // 🚨 Real Chart Data State
  const [chartData, setChartData] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // --- HELPERS ---
  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Fetch APIs
      const [usersData, reqData, propData] = await Promise.all([
        apiRequest("/api/admin/users", "GET"),
        apiRequest("/api/admin/approve-request", "GET"),
        apiRequest("/api/admin/hotels", "GET"),
      ]);

      // Fetch Real Bookings directly from Firebase
      const bookingsSnap = await getDocs(
        query(collection(db, "bookings"), orderBy("createdAt", "desc")),
      );

      let calcGrossRevenue = 0;
      let validBookingsCount = 0;

      // Setup empty chart for last 7 days (guaranteed zero baseline)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          day: d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          }),
          value: 0,
          rawAmount: 0, // Added rawAmount upfront
        };
      });

      bookingsSnap.docs.forEach((doc) => {
        const data = doc.data();
        const status = (data.status || "").toLowerCase();

        // 🚨 STRICT CHECK: Only count successful bookings
        if (["confirmed", "paid", "success", "completed"].includes(status)) {
          // 🚨 STRICT MATH: Ensure it's a valid, positive number
          let rawAmt =
            data.totalAmount !== undefined ? data.totalAmount : data.price;
          let amount = Number(rawAmt);

          if (isNaN(amount) || amount < 0) {
            amount = 0; // Fallback safely to 0 if data is corrupt
          }

          calcGrossRevenue += amount;
          validBookingsCount++;

          // Add to chart if it falls in the last 7 days
          if (data.createdAt) {
            let bookingDate;
            if (data.createdAt.toDate) {
              bookingDate = data.createdAt.toDate();
            } else if (
              typeof data.createdAt === "string" ||
              typeof data.createdAt === "number"
            ) {
              bookingDate = new Date(data.createdAt);
            }

            if (bookingDate instanceof Date && !isNaN(bookingDate.valueOf())) {
              const dateStr = bookingDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              });
              const chartDay = last7Days.find((d) => d.day === dateStr);
              if (chartDay) {
                chartDay.value += amount;
                chartDay.rawAmount += amount;
              }
            }
          }
        }
      });

      // Normalize chart data into percentages (0 to 100) for the CSS bar chart
      const maxDailyRevenue = Math.max(...last7Days.map((d) => d.value), 1);

      const normalizedChartData = last7Days.map((d) => ({
        ...d,
        value:
          maxDailyRevenue <= 1 && d.value === 0
            ? 5
            : Math.max((d.value / maxDailyRevenue) * 100, 5),
      }));

      // Calculate the 15% / 85% Split safely
      const platformEarnings = calcGrossRevenue * 0.15;
      const partnerPayable = calcGrossRevenue * 0.85;

      const allUsers = usersData.users || [];
      const travelers = allUsers.filter(
        (u: any) => u.role !== "partner" && u.role !== "admin",
      ).length;
      const partners = allUsers.filter((u: any) => u.role === "partner").length;

      const allProperties = propData.hotels || [];
      const activeListings = allProperties.filter(
        (p: any) => (p.status || "").toUpperCase() === "APPROVED",
      ).length;
      const pendingProperties = allProperties.filter(
        (p: any) => (p.status || "").toUpperCase() === "PENDING",
      ).length;

      const allRequests = reqData.requests || [];
      const pendingRequests = allRequests.filter(
        (r: any) => !r.status || (r.status || "").toLowerCase() === "pending",
      ).length;

      setStats({
        travelers,
        partners,
        activeListings,
        pendingRequests,
        pendingProperties,
        totalBookings: validBookingsCount,
        grossRevenue: calcGrossRevenue,
        platformEarnings: platformEarnings,
        partnerPayable: partnerPayable,
      });

      setChartData(normalizedChartData);

      // Notifications
      const newNotifs: Notification[] = [];
      if (pendingRequests > 0)
        newNotifs.push({
          id: "req-1",
          title: "New Partner Requests",
          desc: `${pendingRequests} partners are waiting for approval.`,
          link: "/admin/requests",
          type: "alert",
          time: "Action Required",
        });
      if (pendingProperties > 0)
        newNotifs.push({
          id: "prop-1",
          title: "Property Reviews",
          desc: `${pendingProperties} hotels waiting to be published.`,
          link: "/admin/hotels",
          type: "alert",
          time: "Action Required",
        });

      setNotifications(newNotifs);
      if (isRefresh) addToast("Dashboard synced with Firebase", "success");
    } catch (err) {
      console.error("Dashboard Load Failed", err);
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9] dark:bg-[#09090B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF5A1F] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">
            Syncing Database...
          </p>
        </div>
      </div>
    );

  const totalAlerts = stats.pendingRequests + stats.pendingProperties;

  return (
    <div
      className="min-h-screen bg-[#F4F7F9] dark:bg-[#09090B] pb-12"
      onClick={() => setShowNotifMenu(false)}
    >
      {/* --- TOASTER --- */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-right duration-300"
          >
            {toast.type === "success" && (
              <CheckCircle2 className="text-emerald-500" size={20} />
            )}
            {toast.type === "error" && (
              <AlertCircle className="text-red-500" size={20} />
            )}
            {toast.type === "info" && (
              <Info className="text-blue-500" size={20} />
            )}
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {toast.message}
            </span>
            <button
              onClick={() =>
                setToasts((t) => t.filter((x) => x.id !== toast.id))
              }
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* --- TOP HEADER --- */}
      <div className="bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-gray-800 px-8 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex-1 w-full">
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Welcome Back, Admin!
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              You have {totalAlerts} tasks pending today.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search for Bookings..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 text-gray-900 dark:text-white transition-all"
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchData(true);
              }}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <RefreshCcw
                size={18}
                className={refreshing ? "animate-spin text-[#FF5A1F]" : ""}
              />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifMenu(!showNotifMenu);
                }}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#111827]"></span>
                )}
              </button>

              {showNotifMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#09090B]/50">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    <span className="text-[10px] font-black bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                      {notifications.length} New
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((note) => (
                        <Link
                          href={note.link}
                          key={note.id}
                          onClick={() => setShowNotifMenu(false)}
                          className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800/50 transition-colors"
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${note.type === "alert" ? "bg-[#FF5A1F]" : "bg-blue-500"}`}
                            />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {note.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                                {note.desc}
                              </p>
                              <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                {note.time}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm font-bold">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-8 h-8 bg-gradient-to-br from-[#FF5A1F] to-orange-400 text-white rounded-full flex items-center justify-center font-black text-sm shadow-sm cursor-pointer">
              A
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <div className="max-w-7xl mx-auto px-8 pt-8">
        {/* 1. FINANCIAL HIGHLIGHTS GRID (Real Data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Gross Booking Value
              </span>
              <IndianRupee size={16} className="text-gray-400" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              ₹{stats.grossRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Total money processed.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 rounded-[24px] p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  Platform Earnings (15%)
                </span>
                <PieChart size={16} className="opacity-80" />
              </div>
              <div className="text-3xl font-black">
                ₹
                {stats.platformEarnings.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs font-medium opacity-90 mt-1">
                Shubh Yatra's true profit.
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          <Link
            href="/admin/payouts"
            className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-[#FF5A1F] transition-colors cursor-pointer block"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Payable to Partners
              </span>
              <Landmark
                size={16}
                className="text-gray-400 group-hover:text-[#FF5A1F] transition-colors"
              />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-[#FF5A1F] transition-colors">
              ₹
              {stats.partnerPayable.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1 group-hover:text-[#FF5A1F]/70 transition-colors">
              Click to manage settlements ➔
            </p>
          </Link>
        </div>

        {/* 2. OPERATIONAL HIGHLIGHTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HighlightCard
            title="Total Partners"
            value={stats.partners}
            icon={Briefcase}
            trend="Verified"
          />
          <HighlightCard
            title="Active Listings"
            value={stats.activeListings}
            icon={Building2}
            trend="Live"
          />
          <HighlightCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            trend="Confirmed"
          />
          <HighlightCard
            title="Pending Tasks"
            value={totalAlerts}
            icon={AlertCircle}
            trend="Action Needed"
            isAlert={totalAlerts > 0}
          />
        </div>

        {/* 3. MIDDLE SECTION (Chart & Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Overview (Real Chart Data) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                  7-Day Revenue Trend
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Daily gross booking volume.
                </p>
              </div>
            </div>

            {/* Pure CSS Area Chart Visual (Mapped to Real Data) */}
            <div className="h-48 flex items-end justify-between pt-4 relative">
              <div className="absolute inset-0 flex flex-col justify-between pb-6 opacity-10">
                <div className="border-b border-gray-400 w-full h-0"></div>
                <div className="border-b border-gray-400 w-full h-0"></div>
                <div className="border-b border-gray-400 w-full h-0"></div>
                <div className="border-b border-gray-400 w-full h-0"></div>
              </div>

              {chartData.map((data, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center w-[12%] z-10 group relative"
                >
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-white shadow-lg px-3 py-1.5 rounded-lg flex flex-col items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-gray-300 dark:text-gray-500 whitespace-nowrap">
                      {data.day}
                    </span>
                    <span className="text-xs font-black text-white dark:text-gray-900">
                      ₹{data.rawAmount.toLocaleString()}
                    </span>
                    <div className="absolute -bottom-1 w-2 h-2 bg-gray-900 dark:bg-white rotate-45" />
                  </div>

                  <div
                    className="w-full max-w-[32px] rounded-t-lg transition-all duration-500 bg-[#FF5A1F] shadow-lg shadow-orange-500/20"
                    style={{ height: `${data.value}%` }}
                  />
                  <span className="text-[9px] font-bold text-gray-400 mt-3">
                    {data.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Split */}
          <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart size={16} className="text-gray-400" /> Booking Split
              </h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="w-40 h-40 rounded-full border-[14px] border-[#FF5A1F] border-r-[#3B82F6] border-b-[#EC4899] flex flex-col items-center justify-center relative shadow-inner">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Total
                </span>
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {stats.totalBookings}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 mt-4">
              <LegendItem color="bg-[#FF5A1F]" label="Hotels" />
              <LegendItem color="bg-[#3B82F6]" label="Cabs" />
            </div>
          </div>
        </div>

        {/* 4. BOTTOM SECTION: Recent Activity Table */}
        <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Requires Attention
            </h3>
            <Link
              href="/admin/payouts"
              className="text-xs font-bold text-[#FF5A1F] hover:underline"
            >
              Go to Payouts ➔
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/3">
                    Request / Task
                  </th>
                  <th className="pb-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/4">
                    Type
                  </th>
                  <th className="pb-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/4">
                    Status
                  </th>
                  <th className="pb-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingRequests > 0 && (
                  <tr className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        New Partner Signups
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-500">
                      Account Verification
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-orange-50 text-[#FF5A1F] dark:bg-[#FF5A1F]/10 dark:text-[#FF5A1F] text-[10px] font-bold uppercase tracking-wider">
                        Pending
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/admin/requests"
                        className="text-xs font-bold text-[#FF5A1F] hover:underline"
                      >
                        Review {stats.pendingRequests}
                      </Link>
                    </td>
                  </tr>
                )}
                {stats.pendingProperties > 0 && (
                  <tr className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        Unpublished Listings
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-500">
                      Listing Approval
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-orange-50 text-[#FF5A1F] dark:bg-[#FF5A1F]/10 dark:text-[#FF5A1F] text-[10px] font-bold uppercase tracking-wider">
                        Pending
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/admin/hotels"
                        className="text-xs font-bold text-[#FF5A1F] hover:underline"
                      >
                        Review {stats.pendingProperties}
                      </Link>
                    </td>
                  </tr>
                )}
                {totalAlerts === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-sm font-medium text-gray-400 border-b border-dashed border-gray-200 dark:border-gray-800"
                    >
                      <CheckCircle2
                        size={24}
                        className="mx-auto mb-2 text-emerald-500/50"
                      />
                      All caught up! No pending actions required.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function HighlightCard({ title, value, icon: Icon, trend, isAlert }: any) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-[24px] p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {title}
          </span>
        </div>
        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isAlert ? "bg-orange-50 text-[#FF5A1F] dark:bg-[#FF5A1F]/10" : "bg-green-50 text-emerald-600 dark:bg-emerald-900/20"}`}
        >
          {trend}
        </span>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-black text-gray-900 dark:text-white">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
        <TrendingUp size={64} className="translate-x-4 translate-y-4" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs font-bold text-gray-500">{label}</span>
    </div>
  );
}

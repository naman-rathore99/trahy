"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Users,
  Briefcase,
  Building2,
  AlertCircle,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Bell,
  X,
  CheckCircle2,
  Info,
  Calendar,
  Wallet,
  TrendingUp,
  PieChart,
  Search,
  ChevronDown,
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

// Mock Chart Data for the visual representation
const CHART_DATA = [
  { day: "10 Oct", value: 25 },
  { day: "15 Oct", value: 50 },
  { day: "20 Oct", value: 45 },
  { day: "25 Oct", value: 75 },
  { day: "30 Oct", value: 100 },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    travelers: 0,
    partners: 0,
    activeListings: 0,
    pendingRequests: 0,
    pendingProperties: 0,
    revenue: 124500,
    totalBookings: 142, // Mock value for visual
  });

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
      const [usersData, reqData, propData] = await Promise.all([
        apiRequest("/api/admin/users", "GET"),
        apiRequest("/api/admin/approve-request", "GET"),
        apiRequest("/api/admin/hotels", "GET"),
      ]);

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
        revenue: 124500,
        totalBookings: 142,
      });

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
      if (activeListings > 0 && !isRefresh)
        newNotifs.push({
          id: "sys-1",
          title: "System Status",
          desc: `System running smoothly with ${activeListings} active listings.`,
          link: "#",
          type: "success",
          time: "Just now",
        });

      setNotifications(newNotifs);
      if (isRefresh) addToast("Dashboard updated successfully", "success");
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
        <Loader2 className="animate-spin text-[#FF5A1F]" size={40} />
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
            className="pointer-events-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-right duration-300"
          >
            {toast.type === "success" && (
              <CheckCircle2 className="text-green-500" size={20} />
            )}
            {toast.type === "error" && (
              <AlertCircle className="text-red-500" size={20} />
            )}
            {toast.type === "info" && (
              <Info className="text-blue-500" size={20} />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
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

      {/* --- TOP HEADER (SAAS STYLE) --- */}
      <div className="bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-gray-800 px-8 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex-1 w-full">
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Welcome Back, Admin!
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              You have {totalAlerts} tasks pending today — keep it up!
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Global Search */}
            <div className="relative flex-1 sm:w-64 hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search for Bookings, Partners..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 text-gray-900 dark:text-white"
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchData(true);
              }}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <RefreshCcw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifMenu(!showNotifMenu);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#111827]"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">
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
                              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${note.type === "alert" ? "bg-orange-500" : "bg-blue-500"}`}
                            />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {note.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {note.desc}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                {note.time}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="w-8 h-8 bg-[#FF5A1F] text-white rounded-full flex items-center justify-center font-black text-sm shadow-sm cursor-pointer">
              A
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            Highlights
          </h2>
          <button className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
            <RefreshCcw size={12} /> Refresh Data
          </button>
        </div>

        {/* 1. HIGHLIGHTS GRID (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HighlightCard
            title="Total Partners"
            value={stats.partners}
            icon={Briefcase}
            trend="+12%"
          />
          <HighlightCard
            title="Active Listings"
            value={stats.activeListings}
            icon={Building2}
            trend="+5%"
          />
          <HighlightCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            trend="+18%"
          />
          <HighlightCard
            title="Pending Tasks"
            value={totalAlerts}
            icon={AlertCircle}
            trend="Action Needed"
            isAlert={totalAlerts > 0}
          />
        </div>

        {/* 2. MIDDLE SECTION (Chart & Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Overview (Left - 2/3 width) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                  Revenue Overview
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Your platform booking trends.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                  Oct 2025 <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Pure CSS Area Chart Visual (No libraries needed) */}
            <div className="h-48 flex items-end justify-between pt-4 relative">
              {/* Y-Axis Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pb-6 opacity-10">
                <div className="border-b border-gray-400 w-full h-0"></div>
                <div className="border-b border-gray-400 w-full h-0"></div>
                <div className="border-b border-gray-400 w-full h-0"></div>
                <div className="border-b border-gray-400 w-full h-0"></div>
              </div>

              {/* Chart Bars */}
              {CHART_DATA.map((data, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center w-[15%] z-10 group relative"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-lg flex flex-col items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                      {data.day}
                    </span>
                    <span className="text-xs font-black text-[#FF5A1F]">
                      +5%
                    </span>
                    <div className="absolute -bottom-1 w-2 h-2 bg-white dark:bg-gray-800 rotate-45 border-r border-b border-gray-100 dark:border-gray-700" />
                  </div>

                  {/* The Bar */}
                  <div
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${data.value === 75 ? "bg-gradient-to-t from-orange-200 to-[#FF5A1F] shadow-lg shadow-orange-500/20" : "bg-orange-100 dark:bg-orange-900/30"}`}
                    style={{ height: `${data.value}%` }}
                  />
                  <span className="text-[10px] font-bold text-gray-400 mt-3">
                    {data.day.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Split (Right - 1/3 width) */}
          <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart size={16} className="text-gray-400" /> Booking Split
              </h3>
              <div className="flex gap-1">
                <button className="p-1.5 border border-gray-200 dark:border-gray-700 rounded text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Search size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
              {/* CSS Donut Chart */}
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
              <LegendItem color="bg-[#FF5A1F]" label="Hotels" value="45%" />
              <LegendItem color="bg-[#3B82F6]" label="Cabs" value="35%" />
              <LegendItem color="bg-[#EC4899]" label="Rentals" value="15%" />
              <LegendItem color="bg-indigo-500" label="Other" value="5%" />
            </div>
          </div>
        </div>

        {/* 3. BOTTOM SECTION: Recent Activity Table */}
        <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Requires Attention
            </h3>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              <Search size={14} /> Sort & Filter
            </button>
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
                {/* Pending Partner Row */}
                {stats.pendingRequests > 0 && (
                  <tr className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        New Partner Signups
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-500">
                      Account Verification
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">
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

                {/* Pending Property Row */}
                {stats.pendingProperties > 0 && (
                  <tr className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        Unpublished Hotels
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-500">
                      Listing Approval
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">
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

                {/* Empty State if all clear */}
                {totalAlerts === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-sm font-medium text-gray-400 border-b border-dashed border-gray-200 dark:border-gray-800"
                    >
                      <CheckCircle2
                        size={24}
                        className="mx-auto mb-2 text-green-500/50"
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
    <div className="bg-white dark:bg-[#111827] rounded-[24px] p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {title}
          </span>
        </div>
        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isAlert ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20" : "bg-green-50 text-green-600 dark:bg-green-900/20"}`}
        >
          {trend}
        </span>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-black text-gray-900 dark:text-white">
          {value.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Decorative Sparkline (Fake) */}
      <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp size={64} className="translate-x-4 translate-y-4" />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs font-bold text-gray-500">{label}:</span>
      <span className="text-xs font-black text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

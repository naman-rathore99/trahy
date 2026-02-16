"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Users,
  Briefcase,
  Building2,
  AlertCircle,
  ChevronRight,
  Activity,
  Loader2,
  PlusCircle,
  ShieldCheck,
  RefreshCcw,
  Bell,
  X,
  CheckCircle2,
  Info,
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

  // Stats State
  const [stats, setStats] = useState({
    travelers: 0,
    partners: 0,
    activeListings: 0,
    pendingRequests: 0,
    pendingProperties: 0,
    revenue: 124500,
  });

  // Notification & Toast State
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

      // 1. Process Stats
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
      });

      // 2. Generate Notifications dynamically
      const newNotifs: Notification[] = [];

      if (pendingRequests > 0) {
        newNotifs.push({
          id: "req-1",
          title: "New Partner Requests",
          desc: `${pendingRequests} partners are waiting for approval.`,
          link: "/admin/requests",
          type: "alert",
          time: "Action Required",
        });
      }

      if (pendingProperties > 0) {
        newNotifs.push({
          id: "prop-1",
          title: "Property Reviews",
          desc: `${pendingProperties} hotels waiting to be published.`,
          link: "/admin/hotels",
          type: "alert",
          time: "Action Required",
        });
      }

      if (activeListings > 0 && !isRefresh) {
        newNotifs.push({
          id: "sys-1",
          title: "System Status",
          desc: `System running smoothly with ${activeListings} active listings.`,
          link: "#",
          type: "success",
          time: "Just now",
        });
      }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );

  const totalAlerts = stats.pendingRequests + stats.pendingProperties;

  return (
    <div
      className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-black min-h-screen relative"
      onClick={() => setShowNotifMenu(false)}
    >
      {/* --- TOASTER CONTAINER --- */}
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

      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Command Center
          </h1>
          <p className="text-gray-500 mt-1">
            Platform overview and required actions.
          </p>
        </div>

        <div className="flex gap-3">
          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchData(true);
            }}
            disabled={refreshing}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCcw
              size={20}
              className={`text-gray-600 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifMenu(!showNotifMenu);
              }}
              className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white dark:border-gray-900"></span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotifMenu && (
              <div
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-500">
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
                        className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                      >
                        <div className="flex gap-3">
                          <div
                            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${note.type === "alert" ? "bg-orange-500" : "bg-blue-500"}`}
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {note.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {note.desc}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-wider">
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

          {/* Revenue Badge */}
          <div className="hidden md:block bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-xl border border-green-100 dark:border-green-800 text-right">
            <div className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">
              Total Revenue
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              ₹{stats.revenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HIGH LEVEL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Total Travelers"
          value={stats.travelers}
          icon={Users}
          color="blue"
          link="/admin/travelers"
          sub="Active Customers"
        />
        <StatCard
          label="Total Partners"
          value={stats.partners}
          icon={Briefcase}
          color="purple"
          link="/admin/partners"
          sub="Supply Providers"
        />
        <StatCard
          label="Active Listings"
          value={stats.activeListings}
          icon={Building2}
          color="indigo"
          link="/admin/hotels"
          sub="Hotels & Vehicle"
        />
        <StatCard
          label="Action Needed"
          value={totalAlerts}
          icon={AlertCircle}
          color={totalAlerts > 0 ? "orange" : "gray"}
          link={stats.pendingRequests > 0 ? "/admin/requests" : "/admin/hotels"}
          sub="Approvals Pending"
          isAlert={totalAlerts > 0}
        />
      </div>

      {/* 3. SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity
              className={totalAlerts > 0 ? "text-orange-500" : "text-gray-400"}
              size={20}
            />
            Requires Attention
          </h3>

          <div className="space-y-4">
            {/* PENDING REQUESTS */}
            {stats.pendingRequests > 0 ? (
              <Link
                href="/admin/requests"
                className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center font-bold">
                    {stats.pendingRequests}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                      New Partner Requests
                    </div>
                    <div className="text-xs text-gray-500">
                      Business partners waiting to join
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-lg">
                  Review <ChevronRight size={16} />
                </div>
              </Link>
            ) : null}

            {/* PENDING PROPERTIES */}
            {stats.pendingProperties > 0 ? (
              <Link
                href="/admin/hotels"
                className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl border border-yellow-200 dark:border-yellow-900/50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center font-bold">
                    {stats.pendingProperties}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 transition-colors">
                      Pending Listing Approvals
                    </div>
                    <div className="text-xs text-gray-500">
                      Hotels or Vehicles waiting for verification
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-lg">
                  Review <ChevronRight size={16} />
                </div>
              </Link>
            ) : null}

            {/* EMPTY STATE */}
            {totalAlerts === 0 && (
              <EmptyState message="All caught up! No pending actions." />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
            Quick Management
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <QuickLink
              href="/admin/add-hotel"
              icon={PlusCircle}
              title="Add Listing"
              desc="Manually add Hotel or Vehicle"
            />
            <QuickLink
              href="/admin/partners"
              icon={ShieldCheck}
              title="Verify Documents"
              desc="Check partner licenses"
            />
            <QuickLink
              href="/admin/travelers"
              icon={Users}
              title="Customer Lookup"
              desc="Find user by phone/email"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  link,
  sub,
  isAlert,
}: any) {
  const colorStyles: any = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    indigo:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <Link
      href={link}
      className="block p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-xl ${colorStyles[color]} group-hover:scale-110 transition-transform`}
        >
          <Icon size={24} />
        </div>
        {isAlert && value > 0 && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </div>
      <div className="text-sm font-bold text-gray-500">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, title, desc }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
    >
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
        <Icon size={20} />
      </div>
      <div>
        <div className="font-bold text-sm text-gray-900 dark:text-white">
          {title}
        </div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
      <div className="text-sm font-bold text-gray-400">{message}</div>
      <div className="text-xs text-gray-400 mt-1">
        Good job! Everything is cleared.
      </div>
    </div>
  );
}

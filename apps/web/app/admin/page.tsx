"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Users,
  Briefcase,
  Building2,
  Car,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Activity,
  Loader2,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    travelers: 0,
    partners: 0,
    activeListings: 0,
    pendingRequests: 0,
    pendingProperties: 0,
    revenue: 124500,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all necessary data in parallel
        const [usersData, reqData, propData] = await Promise.all([
          apiRequest("/api/admin/users", "GET"),
          apiRequest("/api/admin/requests", "GET"),
          apiRequest("/api/admin/hotels", "GET"),
        ]);

        // 1. Calculate User Stats (Safety Check added: || [])
        const allUsers = usersData.users || [];
        const travelers = allUsers.filter(
          (u: any) => u.role !== "partner" && u.role !== "admin"
        ).length;
        const partners = allUsers.filter(
          (u: any) => u.role === "partner"
        ).length;

        // 2. Calculate Property Stats (FIXED: Used .hotels instead of .properties)
        const allProperties = propData.hotels || []; // <--- FIXED HERE

        const activeListings = allProperties.filter(
          (p: any) => p.status === "approved"
        ).length;
        const pendingProperties = allProperties.filter(
          (p: any) => p.status === "pending"
        ).length;

        setStats({
          travelers,
          partners,
          activeListings,
          pendingRequests: reqData.requests ? reqData.requests.length : 0,
          pendingProperties,
          revenue: 124500,
        });
      } catch (err) {
        console.error("Dashboard Load Failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 1. HEADER & FINANCIALS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Command Center
          </h1>
          <p className="text-gray-500 mt-1">
            Platform overview and required actions.
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-2xl border border-green-100 dark:border-green-800 text-right">
          <div className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">
            Total Revenue
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ₹{stats.revenue.toLocaleString()}
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
          link="/admin/properties" // Ensure this page exists or change to /admin/hotels
          sub="Properties & Vehicles"
        />
        <StatCard
          label="Action Needed"
          value={stats.pendingRequests + stats.pendingProperties}
          icon={AlertCircle}
          color="orange"
          link="/admin/requests"
          sub="Approvals Pending"
          isAlert
        />
      </div>

      {/* 3. SPLIT VIEW: ALERTS vs ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT (2 Cols): ATTENTION NEEDED */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="text-orange-500" size={20} />
            Requires Attention
          </h3>

          <div className="space-y-4">
            {stats.pendingRequests > 0 ? (
              <Link
                href="/admin/requests"
                className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-sm hover:shadow-md transition-all group"
              >
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
            ) : (
              <EmptyState message="No pending partner requests" />
            )}

            {stats.pendingProperties > 0 ? (
              <Link
                href="/admin/properties"
                className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl border border-yellow-200 dark:border-yellow-900/50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center font-bold">
                    {stats.pendingProperties}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 transition-colors">
                      Pending Property Reviews
                    </div>
                    <div className="text-xs text-gray-500">
                      Listings waiting for approval
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-lg">
                  Review <ChevronRight size={16} />
                </div>
              </Link>
            ) : (
              <EmptyState message="No pending properties" />
            )}
          </div>
        </div>

        {/* RIGHT (1 Col): QUICK ACTIONS */}
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

// --- HELPER COMPONENTS ---

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

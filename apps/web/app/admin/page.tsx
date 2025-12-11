"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { apiRequest } from "@/lib/api";
import {
  Shield,
  User,
  Plus,
  FileText,
  Home as HomeIcon,
  CheckCircle,
  Clock,
  Ban, // Icon for Banned
  Activity, // Icon for Active
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [pendingPropCount, setPendingPropCount] = useState(0);

  // NEW: Stats for Active/Banned
  const [activePropCount, setActivePropCount] = useState(0);
  const [bannedPropCount, setBannedPropCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const router = useRouter();

  // 1. Auth Check
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setAuthChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Fetch All Data
  useEffect(() => {
    if (authChecking) return;

    const fetchData = async () => {
      try {
        // A. Users
        const userData = await apiRequest("/api/admin/users", "GET");
        setUsers(userData.users || []);

        // B. Requests
        const reqData = await apiRequest("/api/admin/requests", "GET");
        setRequestCount(reqData.requests?.length || 0);

        // C. Properties (Pending)
        const pendingData = await apiRequest(
          "/api/admin/properties?status=pending",
          "GET"
        );
        setPendingPropCount(pendingData.properties?.length || 0);

        // D. Properties (Active) - NEW
        const activeData = await apiRequest(
          "/api/admin/properties?status=approved",
          "GET"
        );
        setActivePropCount(activeData.properties?.length || 0);

        // E. Properties (Banned) - NEW
        const bannedData = await apiRequest(
          "/api/admin/properties?status=banned",
          "GET"
        );
        setBannedPropCount(bannedData.properties?.length || 0);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authChecking]);

  if (authChecking || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">Overview of your platform</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/add-hotel"
              className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg font-bold"
            >
              <Plus size={20} />
              <span>Add Property</span>
            </Link>
          </div>
        </div>

        {/* --- SECTION 1: ACTION ITEMS (Pending Stuff) --- */}
        <h3 className="text-lg font-bold text-gray-700 mb-4">
          Action Required
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/admin/requests">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-400 transition-all hover:shadow-md group">
              <div className="flex justify-between items-start">
                <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                  Join Requests
                </div>
                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText size={20} />
                </div>
              </div>
              <div
                className={`text-3xl font-bold mt-4 ${requestCount > 0 ? "text-blue-600" : "text-gray-400"}`}
              >
                {requestCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">Partners waiting</div>
            </div>
          </Link>

          <Link href="/admin/properties">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-yellow-400 transition-all hover:shadow-md group">
              <div className="flex justify-between items-start">
                <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                  Pending Review
                </div>
                <div className="bg-yellow-50 text-yellow-600 p-2 rounded-lg group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                  <Clock size={20} />
                </div>
              </div>
              <div
                className={`text-3xl font-bold mt-4 ${pendingPropCount > 0 ? "text-yellow-600" : "text-gray-400"}`}
              >
                {pendingPropCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Properties waiting to go live
              </div>
            </div>
          </Link>
        </div>

        {/* --- SECTION 2: PROPERTY HEALTH (New Section) --- */}
        <h3 className="text-lg font-bold text-gray-700 mb-4">
          Property Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Active Properties */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
              <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                Active Listings
              </div>
              <div className="bg-green-50 text-green-600 p-2 rounded-lg">
                <Activity size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-700 mt-4">
              {activePropCount}
            </div>
            <div className="text-xs text-gray-400 mt-1">Live on website</div>
          </div>

          {/* Banned Properties */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                Banned / Suspended
              </div>
              <div className="bg-red-50 text-red-600 p-2 rounded-lg">
                <Ban size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600 mt-4">
              {bannedPropCount}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Removed from website
            </div>
          </div>

          {/* Total Partners */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                Total Partners
              </div>
              <div className="bg-gray-100 text-gray-600 p-2 rounded-lg">
                <User size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-4">
              {users.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Registered accounts
            </div>
          </div>
        </div>

        {/* --- USERS TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Recent Users</h3>
            <span className="text-xs text-gray-400">Showing latest 10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="px-6 py-4">Partner</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.slice(0, 10).map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                          {user.name ? user.name[0] : <User size={14} />}
                        </div>
                        <span className="font-bold text-gray-900">
                          {user.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-xs rounded font-bold">
                          <Shield size={10} /> Admin
                        </span>
                      ) : user.isLicenseVerified ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-50 px-2 py-1 rounded">
                          <Clock size={12} /> Incomplete
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

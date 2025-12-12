"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  FileText,
  Home as HomeIcon,
  User,
  Activity,
  Ban,
  Clock,
  Shield,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [pendingPropCount, setPendingPropCount] = useState(0);
  const [activePropCount, setActivePropCount] = useState(0);
  const [bannedPropCount, setBannedPropCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel for speed
        const [userData, reqData, pendingData, activeData, bannedData] =
          await Promise.all([
            apiRequest("/api/admin/users", "GET"),
            apiRequest("/api/admin/requests", "GET"),
            apiRequest("/api/admin/properties?status=pending", "GET"),
            apiRequest("/api/admin/properties?status=approved", "GET"),
            apiRequest("/api/admin/properties?status=banned", "GET"),
          ]);

        setUsers(userData.users || []);
        setRequestCount(reqData.requests?.length || 0);
        setPendingPropCount(pendingData.properties?.length || 0);
        setActivePropCount(activeData.properties?.length || 0);
        setBannedPropCount(bannedData.properties?.length || 0);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400">Loading stats...</div>
    );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Dashboard Overview
      </h1>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Requests */}
        <Link
          href="/admin/requests"
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between">
            <span className="text-gray-500 font-bold text-sm uppercase">
              Join Requests
            </span>
            <FileText className="text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-4xl font-bold mt-4 text-gray-900">
            {requestCount}
          </div>
          <p className="text-xs text-gray-400 mt-2">New partners waiting</p>
        </Link>

        {/* Card 2: Property Reviews */}
        <Link
          href="/admin/properties"
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between">
            <span className="text-gray-500 font-bold text-sm uppercase">
              Pending Review
            </span>
            <Clock className="text-yellow-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-4xl font-bold mt-4 text-gray-900">
            {pendingPropCount}
          </div>
          <p className="text-xs text-gray-400 mt-2">Properties to approve</p>
        </Link>

        {/* Card 3: Health Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <div className="flex justify-between">
            <span className="text-gray-500 font-bold text-sm uppercase">
              Active Listings
            </span>
            <Activity className="text-green-500" />
          </div>
          <div className="text-4xl font-bold mt-4 text-gray-900">
            {activePropCount}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            <span className="text-red-500 font-bold">{bannedPropCount}</span>{" "}
            Banned
          </p>
        </div>
      </div>

      {/* --- RESTORED: USERS TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Recent Partners</h3>
          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">
            Total: {users.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.slice(0, 10).map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                        {user.name ? user.name[0] : <User size={16} />}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {user.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-xs rounded-lg font-bold shadow-sm">
                        <Shield size={10} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                        Partner
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.isLicenseVerified ? (
                      <span className="inline-flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                        <CheckCircle size={12} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-orange-600 text-xs font-bold bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                        <Clock size={12} /> Pending
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
  );
}

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
        {/* Action Items */}
        <Link
          href="/admin/requests"
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between">
            <span className="text-gray-500 font-bold text-sm uppercase">
              Requests
            </span>
            <FileText className="text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-4xl font-bold mt-4 text-gray-900">
            {requestCount}
          </div>
          <p className="text-xs text-gray-400 mt-2">New partners waiting</p>
        </Link>

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

        {/* Health */}
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
          <p className="text-xs text-gray-400 mt-2">Live on site</p>
        </div>
      </div>
    </div>
  );
}

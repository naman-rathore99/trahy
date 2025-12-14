"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Search,
  CheckCircle,
  Mail,
  Phone,
  MoreHorizontal,
  User as UserIcon,
  Loader2,
  MessageCircle,
} from "lucide-react";

export default function TravelersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiRequest("/api/admin/users", "GET");
        // Filter: ONLY Travelers (No admins, no partners)
        const travelers = data.users.filter(
          (u: any) => u.role !== "partner" && u.role !== "admin"
        );

        // Add Mock Stats
        const enhancedData = travelers.map((u: any) => ({
          ...u,
          totalSpend: Math.floor(Math.random() * 50000),
          lastTrip: "Goa (2 days ago)",
          phone: u.phone || "+91 98765 00000",
        }));
        setUsers(enhancedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Traveler Management</h1>
        <p className="text-gray-500">
          View customer spend history and verify identities.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        <input
          placeholder="Search travelers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Verification</th>
              <th className="px-6 py-4">Lifetime Spend</th>
              <th className="px-6 py-4">Last Activity</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                      {user.name?.[0] || <UserIcon size={18} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {/* Email Check */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.emailVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                    >
                      {user.emailVerified ? "Email Verified" : "Email Pending"}
                    </span>
                    {/* Phone Check */}
                    <button className="px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100">
                      Verify Phone
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-bold">
                  ₹{user.totalSpend.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.lastTrip}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-black">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

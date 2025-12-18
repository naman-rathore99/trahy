"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Search,
  MoreHorizontal,
  User as UserIcon,
  Loader2,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";

export default function TravelersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiRequest("/api/admin/users?role=user", "GET");

        // Mock Data Enhancements
        const enhancedData = data.users.map((u: any) => ({
          ...u,
          totalSpend: Math.floor(Math.random() * 50000),
          lastTrip: "Goa (2 days ago)",
          phone: u.phone || "+91 98765 00000",
          emailVerified: true,
        }));

        setUsers(enhancedData);
      } catch (err) {
        console.error("Travelers Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Traveler Management</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          View customer spend history and verify identities.
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        <input
          placeholder="Search travelers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black shadow-sm"
        />
      </div>

      {/* --- DESKTOP TABLE --- */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              <tr
                key={user.uid}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.displayName?.[0] || <UserIcon size={18} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm">
                        {user.displayName || "No Name"}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.emailVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                  >
                    {user.emailVerified ? "Email Verified" : "Email Pending"}
                  </span>
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

      {/* --- MOBILE CARD VIEW --- */}
      <div className="md:hidden grid gap-4">
        {filtered.map((user) => (
          <div
            key={user.uid}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.displayName?.[0] || <UserIcon size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {user.displayName || "No Name"}
                  </h3>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button className="text-gray-400">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                  <CreditCard size={10} /> Spend
                </div>
                <div className="font-mono font-bold text-sm">
                  ₹{user.totalSpend.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                  <MapPin size={10} /> Last Trip
                </div>
                <div className="text-sm truncate">{user.lastTrip}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold border ${user.emailVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
              >
                {user.emailVerified ? "Email Verified" : "Pending"}
              </span>
              <button className="text-xs font-bold text-blue-600 flex items-center gap-1">
                <Phone size={12} /> Call
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
          No travelers found.
        </div>
      )}
    </div>
  );
}

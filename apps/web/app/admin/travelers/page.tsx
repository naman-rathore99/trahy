"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Search,
  MoreHorizontal,
  User as UserIcon,
  Loader2,
  Phone,
  CreditCard,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";

export default function TravelersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiRequest("/api/admin/users?role=user", "GET");
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
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Traveler Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View customer profiles and history.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium shadow-sm">
          Total: <span className="font-bold">{users.length}</span>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          placeholder="Search travelers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-20 border rounded-2xl border-dashed">
          No travelers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <div
              key={user.uid}
              className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header - Fixed Overflow */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  {" "}
                  {/* min-w-0 prevents flex items from overflowing */}
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-500 overflow-hidden shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                      {user.displayName || "Unknown User"}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">
                      {user.email}
                    </div>
                  </div>
                </div>
                <VerificationBadge verified={user.emailVerified} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mb-1">
                    <CreditCard size={10} /> Spent
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    ₹{user.totalSpend.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mb-1">
                    <Calendar size={10} /> Last Trip
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white text-xs truncate">
                    {user.lastTrip}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Phone size={14} /> Call
                </button>
                <button className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                  Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 shrink-0">
      <CheckCircle size={16} />
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 shrink-0">
      <XCircle size={16} />
    </div>
  );
}

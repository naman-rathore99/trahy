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
  FileText,
} from "lucide-react";

export default function UsersManagementPage() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // TABS: 'travelers' (Default) | 'partners'
  const [activeTab, setActiveTab] = useState<"travelers" | "partners">(
    "travelers"
  );

  // FETCH ALL DATA
  const fetchUsers = async () => {
    try {
      const data = await apiRequest("/api/admin/users", "GET");

      // Add Dummy Stats for Demo (Connect to real DB later)
      const usersWithStats = data.users.map((u: any) => ({
        ...u,
        totalSpend: Math.floor(Math.random() * 50000), // Mock Spend
        lastActive: "2 days ago",
        phone: u.phone || "+91 98765 43210", // Mock Phone if missing
      }));

      setAllUsers(usersWithStats);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- FILTER LOGIC ---
  const filteredList = allUsers.filter((user) => {
    // 1. Filter by Tab
    if (activeTab === "travelers") {
      if (user.role === "partner" || user.role === "admin") return false;
    } else {
      if (user.role !== "partner") return false;
    }

    // 2. Filter by Search (Name, Email, Phone)
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.includes(search)
    );
  });

  // --- ACTIONS ---
  const handleWhatsAppOTP = (phone: string) => {
    alert(
      `Sending WhatsApp OTP to ${phone}...\n(Backend integration required)`
    );
  };

  const handleEmailVerify = (email: string) => {
    alert(`Sending Verification Link to ${email}...`);
  };

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 1. HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {activeTab === "travelers" ? "Traveler Management" : "Partner Search"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {activeTab === "travelers"
            ? "Verify identities, track spending, and manage customer accounts."
            : "Search and manage your registered partners."}
        </p>
      </div>

      {/* 2. TABS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={
              activeTab === "travelers"
                ? "Search travelers by name, email, phone..."
                : "Search partners..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm"
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl h-[50px]">
          <button
            onClick={() => setActiveTab("travelers")}
            className={`px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "travelers"
                ? "bg-white dark:bg-black shadow-sm text-black dark:text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Travelers
          </button>
          <button
            onClick={() => setActiveTab("partners")}
            className={`px-6 rounded-lg text-sm font-bold transition-all ${
              activeTab === "partners"
                ? "bg-white dark:bg-black shadow-sm text-black dark:text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Partners
          </button>
        </div>
      </div>

      {/* 3. MAIN TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Verification</th>
                {activeTab === "travelers" && (
                  <th className="px-6 py-4">Spend History</th>
                )}
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredList.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* USER IDENTITY */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-bold border border-gray-200 dark:border-gray-700">
                        {user.name ? user.name[0] : <UserIcon size={18} />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                          {user.name || "Unknown User"}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {user.phone}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* VERIFICATION (WhatsApp/Email) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {/* EMAIL CHECK */}
                      <div className="flex items-center justify-between gap-4 max-w-[200px]">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={12} /> Email
                        </div>
                        {user.emailVerified ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <button
                            onClick={() => handleEmailVerify(user.email)}
                            className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100"
                          >
                            Verify
                          </button>
                        )}
                      </div>

                      {/* PHONE CHECK (WhatsApp) */}
                      <div className="flex items-center justify-between gap-4 max-w-[200px]">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MessageCircle size={12} className="text-green-600" />{" "}
                          WhatsApp
                        </div>
                        {user.phoneVerified ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <button
                            onClick={() => handleWhatsAppOTP(user.phone)}
                            className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 hover:bg-green-100"
                          >
                            Send OTP
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SPEND HISTORY (Travelers Only) */}
                  {activeTab === "travelers" && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-gray-900 dark:text-white">
                          ₹{user.totalSpend.toLocaleString()}
                        </div>
                        <button className="text-[10px] underline text-gray-400 hover:text-blue-500">
                          View Invoice
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Last trip: {user.lastActive}
                      </div>
                    </td>
                  )}

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 text-xs rounded-lg font-bold">
                      Active
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-black dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    No {activeTab} found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

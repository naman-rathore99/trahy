"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Check,
  X,
  Loader2,
  Mail,
  Phone,
  ExternalLink,
  CalendarClock,
  ShieldAlert,
  Briefcase,
} from "lucide-react";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await apiRequest("/api/admin/approve-request", "GET");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: any) => {
    const tempPassword = prompt(
      `Set temporary password for ${req.email}`,
      "Partner@123",
    );
    if (!tempPassword) return;

    try {
      setLoading(true);
      await apiRequest("/api/admin/approve-request", "POST", {
        requestId: req.id,
        status: "APPROVED",
        email: req.email,
        name: req.name,
        password: tempPassword,
        hotelName: req.hotelName || `${req.name}'s Hotel`,
        hotelAddress: req.city || "Address Pending",
        phone: req.phone || "",
      });
      alert("Approved successfully");
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reqId: string) => {
    if (!confirm("Reject this request?")) return;
    try {
      setLoading(true);
      await apiRequest("/api/admin/approve-request", "POST", {
        requestId: reqId,
        status: "REJECTED",
      });
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERS ---
  // ✅ FIX: Case-insensitive filtering
  const pendingRequests = requests.filter(
    (r) => !r.status || r.status.toUpperCase() === "PENDING",
  );
  const historyRequests = requests.filter(
    (r) => r.status && r.status.toUpperCase() !== "PENDING",
  );

  const displayList =
    activeTab === "PENDING" ? pendingRequests : historyRequests;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="text-rose-600" /> Partner Applications
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage incoming requests from potential business partners.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === "PENDING"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            New Requests
            {pendingRequests.length > 0 && (
              <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === "HISTORY"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            History
          </button>
        </div>

        {/* Empty State */}
        {displayList.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-800">
            <ShieldAlert className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              No requests found
            </h3>
            <p className="text-gray-500 text-sm">
              {activeTab === "PENDING"
                ? "You're all caught up! No new partners waiting."
                : "No history available."}
            </p>
          </div>
        )}

        {/* Request List */}
        <div className="space-y-4">
          {displayList.map((req) => (
            <div
              key={req.id}
              className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-all hover:shadow-md ${
                activeTab === "PENDING"
                  ? "border-l-4 border-l-rose-500"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Info Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {req.name}
                    </h3>

                    {/* ✅ FIX: Badge Color Logic */}
                    {activeTab === "HISTORY" && (
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                          (req.status || "").toUpperCase() === "APPROVED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                    {activeTab === "PENDING" && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-yellow-100 text-yellow-700">
                        New
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-8 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      {req.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      {req.phone || "No Phone"}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock size={14} className="text-gray-400" />
                      Applied:{" "}
                      {new Date(
                        req.createdAt?._seconds * 1000 || Date.now(),
                      ).toLocaleDateString()}
                    </div>
                    {req.officialIdUrl ? (
                      <a
                        href={req.officialIdUrl}
                        target="_blank"
                        className="flex items-center gap-2 text-rose-600 hover:underline font-medium"
                      >
                        <ExternalLink size={14} /> View ID Proof
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">
                        No ID uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions (Only for Pending) */}
                {activeTab === "PENDING" && (
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-32 shrink-0">
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-lg py-2 text-sm font-bold hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex-1 border border-gray-200 dark:border-gray-700 text-red-600 rounded-lg py-2 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

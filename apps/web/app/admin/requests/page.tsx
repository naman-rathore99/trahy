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
  ShieldAlert
} from "lucide-react";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Requests on Load
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // ✅ FIX 1: Removed 's' from end of URL (Singular)
      const data = await apiRequest("/api/admin/approve-request", "GET");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Approve Logic
  const handleApprove = async (req: any) => {
    if (!req.id) {
      alert("Error: This request is missing a valid ID. Refresh the page.");
      return;
    }

    const tempPassword = prompt(
      `Set a temporary password for ${req.email}:`,
      "Partner@123"
    );
    if (!tempPassword) return;

    try {
      setLoading(true);

      const payload = {
        requestId: req.id,
        status: "APPROVED",
        email: req.email,
        name: req.name,
        password: tempPassword,
        hotelName: req.hotelName || `${req.name}'s Hotel`,
        hotelAddress: req.city || "Address Pending",
        phone: req.phone || ""
      };

      // ✅ Correct URL (Singular) & Method (POST)
      await apiRequest("/api/admin/approve-request", "POST", payload);

      alert(`User & Hotel Approved!`);
      fetchRequests();
    } catch (err: any) {
      console.error("Approval Failed:", err);
      alert("Error approving: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Reject Logic
  const handleReject = async (reqId: string) => {
    if (!confirm("Are you sure you want to reject this request?")) return;
    try {
      setLoading(true);

      // ✅ FIX 2: Updated URL to "approve-request" and Method to "POST"
      await apiRequest("/api/admin/approve-request", "POST", {
        requestId: reqId,
        status: "REJECTED"
      });

      fetchRequests();
    } catch (err: any) {
      alert("Error rejecting: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black transition-colors">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partner Applications</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage incoming partnership requests.</p>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-sm font-medium shadow-sm">
            Total Requests: <span className="font-bold">{requests.length}</span>
          </div>
        </div>

        {/* List Content */}
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
              <ShieldAlert size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Requests Found</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <div key={req.id} className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between gap-6">

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{req.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {req.status || "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2"><Mail size={16} /> {req.email}</div>
                    <div className="flex items-center gap-2"><Phone size={16} /> {req.phone || "N/A"}</div>
                    <div className="flex items-center gap-2"><CalendarClock size={16} /> {new Date(req.createdAt?._seconds * 1000 || Date.now()).toLocaleDateString()}</div>
                  </div>

                  {req.officialIdUrl && (
                    <a href={req.officialIdUrl} target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-rose-600 hover:underline mt-1">
                      <ExternalLink size={14} /> View ID Proof
                    </a>
                  )}
                </div>

                {/* Buttons only show if Pending */}
                {(!req.status || req.status === 'pending') && (
                  <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
                    <button onClick={() => handleApprove(req)} className="flex-1 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 py-2 hover:bg-gray-800">
                      <Check size={16} /> Approve
                    </button>
                    <button onClick={() => handleReject(req.id)} className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 py-2 hover:bg-red-50 hover:text-red-600">
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Check,
  X,
  Loader2,
  User,
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
      // Fetching from the endpoint you provided
      const data = await apiRequest("/api/public/join-request", "GET");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Approve Logic
  const handleApprove = async (req: any) => {
    const tempPassword = prompt(
      `Set a temporary password for ${req.email}:`,
      "Password123!"
    );
    if (!tempPassword) return;

    try {
      setLoading(true);
      await apiRequest("/api/admin/approve-request", "POST", {
        requestId: req.id,
        status: "approved",
        email: req.email,
        name: req.name,
        password: tempPassword,
      });

      alert(`User Created! \nEmail: ${req.email}\nPassword: ${tempPassword}`);
      fetchRequests(); // Refresh list
    } catch (err: any) {
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
      await apiRequest("/api/admin/approve-request", "POST", {
        requestId: reqId,
        status: "rejected"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Pending Requests</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">New applications will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="group bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Applicant Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between md:justify-start gap-3">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {req.name}
                    </h3>
                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${req.status === 'approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : req.status === 'rejected'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                      {req.status || req.serviceType || "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400 shrink-0" />
                      <span className="truncate">{req.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400 shrink-0" />
                      <span>{req.phone || "No phone"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock size={16} className="text-gray-400 shrink-0" />
                      <span>Requested: {new Date(req.createdAt?._seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* ID Proof Link */}
                  {req.officialIdUrl && (
                    <div className="pt-2">
                      <a
                        href={req.officialIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline"
                      >
                        <ExternalLink size={14} /> View Official ID Proof
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {(!req.status || req.status === 'pending') && (
                  <div className="flex flex-row md:flex-col justify-center gap-3 w-full md:w-40 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6">
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex-1 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-gray-200/50 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Check size={16} strokeWidth={3} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex-1 bg-white hover:bg-red-50 dark:bg-gray-900 dark:hover:bg-red-900/20 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
                    >
                      <X size={16} strokeWidth={3} /> Reject
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
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
} from "lucide-react";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!req.id) {
      alert("Missing request ID");
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Partner Requests</h1>
          <p className="text-sm text-gray-500">
            Review and approve partner applications
          </p>
          <div className="text-sm font-semibold">Total: {requests.length}</div>
        </div>

        {/* Empty */}
        {requests.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-10 text-center border">
            <ShieldAlert className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="font-semibold">No pending requests</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-gray-900 border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-4"
            >
              {/* Left */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-lg truncate">{req.name}</h3>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      req.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : req.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {req.status || "PENDING"}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span className="break-all">{req.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    {req.phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock size={14} />
                    {new Date(
                      req.createdAt?._seconds * 1000 || Date.now(),
                    ).toLocaleDateString()}
                  </div>
                </div>

                {req.officialIdUrl && (
                  <a
                    href={req.officialIdUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600"
                  >
                    <ExternalLink size={14} /> View ID Proof
                  </a>
                )}
              </div>

              {/* Actions */}
              {(!req.status || req.status === "pending") && (
                <div className="flex md:flex-col gap-2 w-full md:w-[160px]">
                  <button
                    onClick={() => handleApprove(req)}
                    className="flex-1 bg-black text-white rounded-lg py-3 text-sm font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex-1 border rounded-lg py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Check, X, Loader2 } from "lucide-react";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Requests on Load
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await apiRequest("/api/admin/requests", "GET");
      // Ensure we always have an array, even if backend sends nothing
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Approve Logic
  const handleApprove = async (req: any) => {
    // Admin sets a temporary password for the new partner
    const tempPassword = prompt(
      `Set a temporary password for ${req.email}:`,
      "Password123!"
    );
    if (!tempPassword) return;

    try {
      setLoading(true);
      await apiRequest("/api/admin/approve-request", "POST", {
        requestId: req.id,
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

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black">Partner Applications</h1>

        {requests.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center text-black shadow-sm">
            No pending requests found.
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                {/* Applicant Details */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {req.name}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase">
                      {req.serviceType}
                    </span>
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">
                    <p>📧 {req.email}</p>
                    <p>📱 {req.phone || "No phone provided"}</p>
                  </div>
                  <div className="mt-2">
                    <a
                      href={req.officialIdUrl}
                      target="_blank"
                      className="text-sm text-blue-600 font-medium underline hover:text-blue-800"
                    >
                      View Official ID Proof
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors">
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(req)}
                    className="flex-1 md:flex-none bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

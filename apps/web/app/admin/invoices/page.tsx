"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Search,
  FileText,
  UploadCloud,
  CheckCircle,
  Download,
  Loader2,
  Send,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Confirmed Bookings (These are the ones that need invoices)
        const data = await apiRequest("/api/admin/bookings", "GET");

        // Filter only confirmed/paid bookings
        const confirmed = (data.bookings || []).filter(
          (b: any) => b.status === "confirmed" || b.paymentStatus === "paid"
        );

        // Transform into "Invoice Objects"
        const mappedInvoices = confirmed.map((b: any) => ({
          id: `INV-${b.id.slice(0, 8).toUpperCase()}`, // Generate Invoice ID
          bookingId: b.id,
          customerName: b.customerName,
          customerEmail: b.customerEmail,
          amount: b.totalAmount,
          date: b.bookedAt,
          status: b.invoiceSent ? "sent" : "pending", // We need to add this field to DB later
          fileUrl: b.invoiceUrl || null,
        }));

        setInvoices(mappedInvoices);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleUpload = (id: string) => {
    // 1. Open File Picker
    // 2. Upload to Firebase Storage
    // 3. Update Booking Doc with { invoiceSent: true, invoiceUrl: '...' }
    alert(`Upload feature coming next! \nFor now, we will mark ${id} as Sent.`);

    // Optimistic Update (Fake it for UI)
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "sent", fileUrl: "#" } : inv
      )
    );
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoice Manager
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate and send PDF invoices to customers.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-bold border border-blue-100 dark:border-blue-900">
            {invoices.filter((i) => i.status === "pending").length} Pending
            Requests
          </div>
        </div>
      </div>

      {/* 2. SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        <input
          placeholder="Search by Invoice ID or Customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm"
        />
      </div>

      {/* 3. TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* ID */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                        <FileText size={18} />
                      </div>
                      <div className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                        {inv.id}
                      </div>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                      {inv.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {inv.customerEmail}
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    ₹{inv.amount.toLocaleString()}
                  </td>

                  {/* DATE */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(inv.date), "MMM dd, yyyy")}
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    {inv.status === "sent" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <CheckCircle size={12} /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        Pending
                      </span>
                    )}
                  </td>

                  {/* ACTION BUTTONS */}
                  <td className="px-6 py-4 text-right">
                    {inv.status === "sent" ? (
                      <button className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-end gap-1 ml-auto">
                        <Download size={14} /> Download
                      </button>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {/* MANUAL UPLOAD BUTTON */}
                        <button
                          onClick={() => handleUpload(inv.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg hover:opacity-80 transition-opacity"
                        >
                          <UploadCloud size={14} /> Upload PDF
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No confirmed bookings requiring invoices.
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

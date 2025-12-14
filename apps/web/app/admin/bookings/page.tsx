"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Search,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Car,
  Building2,
  User as UserIcon,
  Loader2,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

export default function BookingsPage() {
    
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "confirmed" | "pending" | "cancelled"
  >("all");

useEffect(() => {
  const fetchBookings = async () => {
    try {
      // ✅ CALL REAL API
      const data = await apiRequest("/api/admin/bookings", "GET");

      // If data is empty (no bookings yet), it just sets an empty array
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchBookings();
}, []);
  // FILTER LOGIC
  const filteredBookings = bookings.filter((b) => {
    // 1. Search Logic
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Status Filter
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // HELPER: Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      confirmed: "bg-green-50 text-green-700 border-green-200",
      completed: "bg-gray-100 text-gray-700 border-gray-200",
      pending: "bg-orange-50 text-orange-700 border-orange-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };

    const icons: any = {
      confirmed: <CheckCircle size={12} />,
      completed: <CheckCircle size={12} />,
      pending: <Clock size={12} />,
      cancelled: <XCircle size={12} />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || styles.pending}`}
      >
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Bookings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage all platform reservations.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold flex items-center gap-2">
            <Filter size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-t-2xl border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Booking ID, Name, or Hotel/Car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
          {["all", "confirmed", "pending", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize whitespace-nowrap transition-all ${
                filterStatus === status
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BOOKINGS TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-b-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">Booking Info</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredBookings.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* BOOKING INFO */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${b.serviceType === "hotel" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}
                      >
                        {b.serviceType === "hotel" ? (
                          <Building2 size={18} />
                        ) : (
                          <Car size={18} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {b.serviceName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {b.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {b.customerName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {b.customerName}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {b.customerEmail}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* DATES */}
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {format(new Date(b.checkIn), "MMM dd")} -{" "}
                      {format(new Date(b.checkOut), "MMM dd, yyyy")}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Booked: {format(new Date(b.bookedAt), "MMM dd")}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={b.status} />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          b.paymentStatus === "paid"
                            ? "text-green-600"
                            : b.paymentStatus === "refunded"
                              ? "text-gray-400 line-through"
                              : "text-orange-500"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      ₹{b.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Commission: ₹{(b.totalAmount * 0.1).toLocaleString()}
                    </div>
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-black dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No bookings found.
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

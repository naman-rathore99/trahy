"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Pagination from "@/components/Pagination"; // ✅ Import Pagination
import {
  Loader2, User, Car, BedDouble, Filter, RefreshCcw, Calendar,
  LayoutList, CalendarDays, ArrowDownUp
} from "lucide-react";
import { format, parseISO, isValid, formatDistanceToNow, isToday, isYesterday } from "date-fns";

// --- TYPES ---
interface Booking {
  id: string;
  type: "Hotel" | "Vehicle";
  listingName: string;
  customerName: string;
  customerContact: string;
  amount: number;
  date: string | any;
  status: string;
  paymentStatus: string;
  createdAt: string | any;
  updatedAt?: string | any;
}

const ITEMS_PER_PAGE = 10; // ✅ Define items per page

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Controls
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"date-group" | "list">("date-group"); // ✅ View Mode State
  const [currentPage, setCurrentPage] = useState(1); // ✅ Pagination State

  // Animation States
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBookings();
  }, []);

  // Reset pagination when filter or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, viewMode]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/admin/bookings", "GET");
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getValidDate = (dateVal: any): Date | null => {
    if (!dateVal) return null;
    if (typeof dateVal === 'object' && dateVal.seconds) return new Date(dateVal.seconds * 1000);
    if (typeof dateVal === 'string') {
      const d = parseISO(dateVal);
      return isValid(d) ? d : null;
    }
    if (dateVal instanceof Date) return dateVal;
    return null;
  };

  const checkPaymentStatus = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    setRefreshingIds(prev => new Set(prev).add(bookingId));
    setFailedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(bookingId);
      return newSet;
    });

    try {
      const res = await fetch(`/api/payment/check/${bookingId}`);
      const data = await res.json();
      if (data.success) {
        await fetchBookings();
      } else {
        setFailedIds(prev => new Set(prev).add(bookingId));
        alert(`Status: ${data.status || "Still Pending"}`);
      }
    } catch (err) {
      console.error(err);
      setFailedIds(prev => new Set(prev).add(bookingId));
    } finally {
      setRefreshingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  // --- FILTERING & SORTING ---
  const filteredBookings = bookings.filter(b => {
    if (filter === "all") return true;
    if (filter === "confirmed") return b.status === "confirmed";
    if (filter === "pending") return b.status === "pending";
    if (filter === "cancelled") return b.status === "cancelled";
    return true;
  });

  // Always sort Newest First
  filteredBookings.sort((a, b) => {
    const dateA = getValidDate(a.createdAt)?.getTime() || 0;
    const dateB = getValidDate(b.createdAt)?.getTime() || 0;
    return dateB - dateA;
  });

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- GROUPING LOGIC (Only applies to current page items) ---
  const groupedBookings: { [key: string]: Booking[] } = {};

  if (viewMode === 'date-group') {
    currentItems.forEach((booking) => {
      const date = getValidDate(booking.createdAt);
      let key = "Unknown Date";

      if (date) {
        if (isToday(date)) key = "Today";
        else if (isYesterday(date)) key = "Yesterday";
        else key = format(date, "dd MMM yyyy");
      }

      if (!groupedBookings[key]) groupedBookings[key] = [];
      groupedBookings[key].push(booking);
    });
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-700 border-green-200";
      case "paid": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "cancelled": return "bg-red-50 text-red-600 border-red-200";
      case "failed": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // --- RENDER ROW HELPER ---
  const renderBookingRow = (booking: Booking) => {
    const isRefreshing = refreshingIds.has(booking.id);
    const isFailed = failedIds.has(booking.id);
    const bookingDate = getValidDate(booking.date);
    const updatedDate = getValidDate(booking.updatedAt);
    const createdDate = getValidDate(booking.createdAt);

    return (
      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="p-4">
          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {booking.type === 'Hotel' ? <BedDouble size={16} className="text-rose-500" /> : <Car size={16} className="text-indigo-500" />}
            <span className="truncate max-w-[180px]">{booking.listingName || "Unknown"}</span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-1 uppercase flex gap-2">
            <span>#{booking.id.slice(0, 6)}</span>
            {viewMode === 'list' && createdDate && (
              <span>• {format(createdDate, "dd MMM, HH:mm")}</span>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
              <User size={14} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{booking.customerName}</div>
              <div className="text-xs text-gray-500 truncate">{booking.customerContact}</div>
            </div>
          </div>
        </td>
        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
          {bookingDate ? format(bookingDate, "dd MMM") : "-"}
        </td>
        <td className="p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(booking.paymentStatus)} uppercase`}>
                {booking.paymentStatus}
              </span>
              {booking.paymentStatus !== 'paid' && (
                <button
                  onClick={(e) => checkPaymentStatus(e, booking.id)}
                  disabled={isRefreshing}
                  className={`p-1 rounded-full transition-all ${isFailed ? "bg-red-100 text-red-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-rose-600"}`}
                >
                  <RefreshCcw size={12} className={isRefreshing ? "animate-spin text-rose-600" : ""} />
                </button>
              )}
            </div>
            {updatedDate && (
              <span className="text-[10px] text-gray-400">
                {formatDistanceToNow(updatedDate)} ago
              </span>
            )}
          </div>
        </td>
        <td className="p-4">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(booking.status)} uppercase`}>
            {booking.status}
          </span>
        </td>
        <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
          ₹{Number(booking.amount).toLocaleString('en-IN')}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto pb-20">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Bookings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track payments and reservations.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* VIEW TOGGLE */}
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('date-group')}
                className={`p-2 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'date-group' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CalendarDays size={16} /> <span className="hidden sm:inline">Date Group</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutList size={16} /> <span className="hidden sm:inline">List View</span>
              </button>
            </div>

            {/* FILTER */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm h-[38px]">
              <Filter size={16} className="ml-2 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none p-1 pr-4 text-gray-700 dark:text-gray-300 h-full"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-600" size={32} /></div>
        ) : (
          <div className="space-y-8">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500">No bookings found.</p>
              </div>
            ) : (
              <>
                {/* --- DATE GROUP MODE --- */}
                {viewMode === 'date-group' && Object.keys(groupedBookings).length > 0 && (
                  Object.entries(groupedBookings).map(([dateLabel, group]) => (
                    <div key={dateLabel}>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <Calendar size={16} className="text-rose-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{dateLabel}</h3>
                        <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800 ml-2"></div>
                      </div>

                      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                              <tr>
                                <th className="p-4 w-1/4">Listing</th>
                                <th className="p-4 w-1/4">Customer</th>
                                <th className="p-4 w-1/6">Trip Date</th>
                                <th className="p-4 w-1/6">Payment</th>
                                <th className="p-4 w-1/6">Status</th>
                                <th className="p-4 w-1/6 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {group.map((booking) => renderBookingRow(booking))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* --- LIST MODE --- */}
                {viewMode === 'list' && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                          <tr>
                            <th className="p-4 w-1/4">
                              <div className="flex items-center gap-1"><ArrowDownUp size={12} /> Listing</div>
                            </th>
                            <th className="p-4 w-1/4">Customer</th>
                            <th className="p-4 w-1/6">Trip Date</th>
                            <th className="p-4 w-1/6">Payment</th>
                            <th className="p-4 w-1/6">Status</th>
                            <th className="p-4 w-1/6 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {currentItems.map((booking) => renderBookingRow(booking))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* --- PAGINATION --- */}
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredBookings.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
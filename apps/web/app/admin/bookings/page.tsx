"use client";

import { useEffect, useState, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import {
  Loader2,
  Search,
  Filter,
  Calendar,
  Hotel,
  ArrowRight,
  User,
  Phone,
  CreditCard,
  X,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";

// --- TYPES ---
interface Booking {
  id: string;
  type: "Hotel" | "Vehicle";
  listingName: string;
  customerName: string;
  customerContact?: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface GroupedData {
  title: string;
  subtitle: string;
  count: number;
  revenue: number;
  bookings: Booking[];
}

export default function AdminBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // --- VIEW STATE ---
  const [viewMode, setViewMode] = useState<"hotel" | "date">("hotel");
  const [selectedGroup, setSelectedGroup] = useState<GroupedData | null>(null);

  // --- FILTERS INSIDE DETAIL VIEW ---
  const [detailSearch, setDetailSearch] = useState("");
  const [detailFilter, setDetailFilter] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/admin/bookings", "GET");
      const normalized = (data.bookings || []).map((b: any) => ({
        ...b,
        listingName: b.listingName || b.vehicleName || "Unknown Property",
        customerName: b.customerName || b.customer?.name || "Guest",
        checkIn: b.checkIn || b.startDate,
        checkOut: b.checkOut || b.endDate,
        amount: Number(b.amount || b.totalPrice || 0),
        createdAt: b.createdAt,
      }));
      setBookings(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- GROUPING LOGIC ---
  const groupedData = useMemo(() => {
    const groups: Record<string, GroupedData> = {};

    bookings.forEach((b) => {
      let key = "";
      let title = "";
      let subtitle = "";

      if (viewMode === "hotel") {
        key = b.listingName;
        title = b.listingName;
        subtitle = "Property";
      } else {
        // Date Grouping
        const date = parseISO(b.checkIn);
        if (isToday(date)) key = "Today";
        else if (isTomorrow(date)) key = "Tomorrow";
        else if (isYesterday(date)) key = "Yesterday";
        else key = format(date, "dd MMM yyyy");

        title = key;
        subtitle = format(date, "EEEE"); // Day of week
      }

      if (!groups[key]) {
        groups[key] = { title, subtitle, count: 0, revenue: 0, bookings: [] };
      }

      groups[key].count++;
      groups[key].revenue += b.amount;
      groups[key].bookings.push(b);
    });

    // Sort: Date view sorts by date, Hotel view sorts by active count
    return Object.values(groups).sort(
      (a, b) => b.bookings.length - a.bookings.length,
    );
  }, [bookings, viewMode]);

  // --- FILTERED DETAILS ---
  const filteredDetailBookings = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.bookings.filter((b) => {
      const matchSearch =
        b.customerName.toLowerCase().includes(detailSearch.toLowerCase()) ||
        b.id.includes(detailSearch);
      const matchStatus = detailFilter === "all" || b.status === detailFilter;
      return matchSearch && matchStatus;
    });
  }, [selectedGroup, detailSearch, detailFilter]);

  // --- HELPER: Status Color ---
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8 font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. HEADER & VIEW SWITCHER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Operations
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {bookings.length} total bookings found.
            </p>
          </div>

          {/* Tab View Switcher */}
          <div className="bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 flex shadow-sm">
            <button
              onClick={() => setViewMode("hotel")}
              className={`px-4 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${viewMode === "hotel" ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <LayoutGrid size={16} /> By Property
            </button>
            <button
              onClick={() => setViewMode("date")}
              className={`px-4 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${viewMode === "date" ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <CalendarDays size={16} /> By Date
            </button>
          </div>
        </div>

        {/* 2. MAIN CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedData.map((group, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelectedGroup(group);
                setDetailSearch("");
                setDetailFilter("all");
              }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Highlight Bar */}
              <div
                className={`absolute top-0 left-0 bottom-0 w-1.5 ${viewMode === "hotel" ? "bg-rose-500" : "bg-indigo-500"}`}
              ></div>

              <div className="pl-3">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${viewMode === "hotel" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"}`}
                    >
                      {viewMode === "hotel" ? (
                        <Hotel size={24} />
                      ) : (
                        <Calendar size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                        {group.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">
                        {group.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Bookings
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {group.count}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{(group.revenue / 1000).toFixed(1)}k
                    </p>
                  </div>
                </div>

                {/* Recent Guest Preview */}
                {group.bookings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold">
                      {group.bookings[0].customerName[0]}
                    </div>
                    <span>
                      Latest:{" "}
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {group.bookings[0].customerName}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 3. DETAILS OVERLAY (FULL SCREEN / DRAWER) */}
        {selectedGroup && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedGroup(null)}
            ></div>

            <div className="relative w-full max-w-4xl bg-white dark:bg-black h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-black z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {viewMode === "hotel" ? (
                      <Hotel size={24} className="text-rose-500" />
                    ) : (
                      <Calendar size={24} className="text-indigo-500" />
                    )}
                    {selectedGroup.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Managing {selectedGroup.bookings.length} bookings
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Toolbar inside Drawer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    placeholder="Search guest inside this group..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[150px]">
                  <Filter size={18} className="text-gray-400" />
                  <select
                    className="w-full p-2.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none text-sm font-medium dark:text-white"
                    value={detailFilter}
                    onChange={(e) => setDetailFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Booking List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 dark:bg-black">
                {filteredDetailBookings.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    No bookings match your search.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDetailBookings.map((b) => (
                      <div
                        key={b.id}
                        className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm group"
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          {/* Guest Info */}
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                              {b.customerName[0]}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                {b.customerName}
                              </h4>
                              <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                                  #{b.id.slice(0, 6)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone size={10} /> {b.customerContact}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons (Desktop) */}
                          <div className="flex gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(b.status)}`}
                            >
                              {b.status}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                              Check In
                            </p>
                            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />{" "}
                              {format(parseISO(b.checkIn), "dd MMM, HH:mm")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                              Check Out
                            </p>
                            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />{" "}
                              {format(parseISO(b.checkOut), "dd MMM")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                              Payment
                            </p>
                            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                              <CreditCard
                                size={14}
                                className={
                                  b.paymentStatus === "paid"
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              />
                              <span className="capitalize">
                                {b.paymentStatus}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                              Total
                            </p>
                            <p className="font-bold text-xl text-gray-900 dark:text-white">
                              ₹{b.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

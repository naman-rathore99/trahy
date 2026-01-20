"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { apiRequest } from "@/lib/api";
import {
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  Building2,
  FileText,
  FileSpreadsheet,
  Loader2,
  History,
  Hotel,
  Filter,
  X,
} from "lucide-react";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  isValid,
} from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Ensure you have this installed
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  // --- FILTERS ---
  const [searchTerm, setSearchTerm] = useState("");

  // Date State
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfMonth(new Date()),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    endOfMonth(new Date()),
  );

  // Calendar Toggles
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const startCalRef = useRef<HTMLDivElement>(null);
  const endCalRef = useRef<HTMLDivElement>(null);

  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startCalRef.current &&
        !startCalRef.current.contains(event.target as Node)
      ) {
        setShowStartCalendar(false);
      }
      if (
        endCalRef.current &&
        !endCalRef.current.contains(event.target as Node)
      ) {
        setShowEndCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/api/admin/bookings`, "GET");

        // MOCK DATA (Safety Fallback)
        const mockData = Array.from({ length: 30 }).map((_, i) => ({
          id: `BK-${5000 + i}`,
          hotelName: [
            "Krishna Palace",
            "Radha Residency",
            "Gokul Inn",
            "Vrindavan Stay",
          ][i % 4],
          guestName: [
            "Amit Sharma",
            "John Doe",
            "Rahul Verma",
            "Sneha Gupta",
            "Vikram Singh",
          ][i % 5],
          checkIn: new Date(2024, 0, (i % 20) + 1).toISOString(),
          totalAmount: (i + 1) * 1500,
          status: ["Confirmed", "Completed", "Cancelled"][i % 3],
          userId: `USER-${i % 5}`,
        }));

        setBookings(data.bookings || mockData);
      } catch (err) {
        console.error("Failed to load admin reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. PROCESS DATA (Crash Proof)
  const processedData = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();

    const filtered = bookings.filter((b) => {
      if (!b) return false;
      const matchText =
        (b.guestName || "").toLowerCase().includes(term) ||
        (b.hotelName || "").toLowerCase().includes(term) ||
        (b.id || "").toLowerCase().includes(term);

      let matchDate = true;
      if (startDate && endDate && b.checkIn && isValid(new Date(b.checkIn))) {
        try {
          matchDate = isWithinInterval(parseISO(b.checkIn), {
            start: startDate,
            end: endDate,
          });
        } catch {
          matchDate = false;
        }
      }
      return matchText && matchDate;
    });

    const userCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b?.userId) userCounts[b.userId] = (userCounts[b.userId] || 0) + 1;
    });

    const groups: Record<string, any> = {};
    filtered.forEach((b) => {
      const hotelName = b.hotelName || "Unknown Hotel";
      if (!groups[hotelName]) {
        groups[hotelName] = {
          name: hotelName,
          totalRevenue: 0,
          platformProfit: 0,
          count: 0,
          guests: [],
        };
      }
      const amount = Number(b.totalAmount) || 0;
      groups[hotelName].totalRevenue += amount;
      groups[hotelName].platformProfit += amount * 0.15;
      groups[hotelName].count += 1;
      groups[hotelName].guests.push({
        ...b,
        profit: amount * 0.15,
        visitCount: b.userId ? userCounts[b.userId] || 1 : 1,
      });
    });

    return Object.values(groups);
  }, [bookings, searchTerm, startDate, endDate]);

  const handleExport = (type: "excel" | "pdf") => {
    const flatData = processedData.flatMap((g) =>
      g.guests.map((b: any) => ({
        Hotel: g.name,
        Guest: b.guestName || "Guest",
        "Visit #": b.visitCount,
        "Check In": b.checkIn
          ? format(parseISO(b.checkIn), "dd MMM yyyy")
          : "N/A",
        Status: b.status,
        Total: b.totalAmount,
        "Profit (15%)": b.profit,
      })),
    );

    if (type === "excel") {
      const ws = XLSX.utils.json_to_sheet(flatData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Admin_Report");
      XLSX.writeFile(wb, "Admin_Revenue_Report.xlsx");
    } else {
      const doc = new jsPDF();
      doc.text("Admin Revenue Report", 14, 20);
      autoTable(doc, {
        head: [["Hotel", "Guest", "Visits", "Date", "Total", "Profit"]],
        body: flatData.map((d: any) => [
          d.Hotel,
          d.Guest,
          d["Visit #"],
          d["Check In"],
          d["Total"],
          d["Profit (15%)"],
        ]),
        startY: 30,
      });
      doc.save("Admin_Revenue_Report.pdf");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Revenue Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Global booking & revenue data.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => handleExport("excel")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors border border-green-200 text-sm font-bold"
          >
            <FileSpreadsheet size={18} />{" "}
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors border border-red-200 text-sm font-bold"
          >
            <FileText size={18} /> <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* --- FILTER BAR (Responsive) --- */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 flex flex-col lg:flex-row gap-5 lg:items-end">
        {/* Search */}
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider flex items-center gap-1">
            <Search size={10} /> Search
          </label>
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Guest, Hotel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200 dark:bg-gray-700 rounded-full"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* --- CUSTOM DATE PICKERS (Mobile Safe) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
          {/* Start Date */}
          <div className="relative w-full" ref={startCalRef}>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">
              From Date
            </label>
            <button
              onClick={() => setShowStartCalendar(!showStartCalendar)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-left hover:border-gray-300 transition-colors"
            >
              <CalendarIcon size={18} className="text-gray-400" />
              <span>
                {startDate ? format(startDate, "dd MMM yyyy") : "Select Date"}
              </span>
            </button>
            {showStartCalendar && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-2">
                <DayPicker
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setShowStartCalendar(false);
                  }}
                  disabled={(date) =>
                    date > new Date() || (endDate ? date > endDate : false)
                  }
                />
              </div>
            )}
          </div>

          {/* End Date */}
          <div className="relative w-full" ref={endCalRef}>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">
              To Date
            </label>
            <button
              onClick={() => setShowEndCalendar(!showEndCalendar)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-left hover:border-gray-300 transition-colors"
            >
              <CalendarIcon size={18} className="text-gray-400" />
              <span>
                {endDate ? format(endDate, "dd MMM yyyy") : "Select Date"}
              </span>
            </button>
            {showEndCalendar && (
              <div className="absolute top-full right-0 lg:right-0 left-0 lg:left-auto mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-2">
                <DayPicker
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setShowEndCalendar(false);
                  }}
                  disabled={(date) =>
                    date > new Date() || (startDate ? date < startDate : false)
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA LIST */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
          <Loader2 className="animate-spin" size={40} />
          <p className="text-sm font-medium">Loading reports...</p>
        </div>
      ) : processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center px-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4 text-gray-400">
            <Filter size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No bookings found
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {processedData.map((hotel: any) => (
            <div
              key={hotel.name}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-all hover:shadow-md"
            >
              {/* --- HOTEL GROUP HEADER --- */}
              <div
                onClick={() =>
                  setExpandedHotel(
                    expandedHotel === hotel.name ? null : hotel.name,
                  )
                }
                className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group bg-gray-50/50 dark:bg-gray-800/20 gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
                    <Hotel size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                      {hotel.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-0.5">
                      <span className="font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] uppercase">
                        {hotel.count} Bookings
                      </span>
                      <span className="hidden sm:inline">
                        Total Revenue: ₹{hotel.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-gray-200 dark:border-gray-700 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                      Platform Profit
                    </div>
                    <div className="text-xl font-mono font-bold text-green-600 dark:text-green-400">
                      ₹{hotel.platformProfit.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-transform duration-200 ${expandedHotel === hotel.name ? "rotate-180 bg-gray-100" : ""}`}
                  >
                    <ChevronDown size={20} className="text-gray-500" />
                  </div>
                </div>
              </div>

              {/* --- GUEST LIST (Mobile Cards / Desktop Table) --- */}
              {expandedHotel === hotel.name && (
                <div className="border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2">
                  {/* MOBILE VIEW (Cards) */}
                  <div className="md:hidden grid gap-3 p-4 bg-gray-50 dark:bg-black/20">
                    {hotel.guests.map((guest: any) => (
                      <div
                        key={guest.id || Math.random()}
                        className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {guest.guestName || "Guest"}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {guest.checkIn
                                ? format(parseISO(guest.checkIn), "dd MMM yyyy")
                                : "N/A"}
                            </div>
                          </div>
                          <StatusBadge status={guest.status} />
                        </div>
                        <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
                          <div className="text-xs text-gray-500">
                            {guest.visitCount > 1 ? (
                              <span className="text-purple-600 font-bold flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md">
                                <History size={12} /> {guest.visitCount} visits
                              </span>
                            ) : (
                              <span className="text-gray-400">First time</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-gray-400 uppercase font-bold">
                              Profit
                            </div>
                            <div className="text-sm font-bold text-green-600">
                              ₹{guest.profit.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP VIEW (Table) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Guest Details</th>
                          <th className="px-6 py-4">History</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                          <th className="px-6 py-4 text-right text-green-600">
                            Profit (15%)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {hotel.guests.map((guest: any) => (
                          <tr
                            key={guest.id || Math.random()}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200 dark:border-gray-700">
                                  {(guest.guestName || "G")[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-gray-900 dark:text-white truncate">
                                    {guest.guestName || "Guest"}
                                  </div>
                                  <div className="text-xs text-gray-400 font-mono truncate">
                                    {guest.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {guest.visitCount > 1 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                                  <History size={12} /> {guest.visitCount}{" "}
                                  Visits
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs pl-2">
                                  New Guest
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                              {guest.checkIn
                                ? format(parseISO(guest.checkIn), "dd MMM yyyy")
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={guest.status} />
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                              ₹{(guest.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400 bg-green-50/30 dark:bg-green-900/10">
                              ₹{guest.profit.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed" || s === "completed") {
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border bg-green-50 text-green-700 border-green-200">
        Confirmed
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border bg-red-50 text-red-700 border-red-200">
        Cancelled
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border bg-gray-50 text-gray-600 border-gray-200">
      {status || "Pending"}
    </span>
  );
}

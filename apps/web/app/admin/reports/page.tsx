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
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
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
import "react-day-picker/dist/style.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  // --- FILTERS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfMonth(new Date()),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    endOfMonth(new Date()),
  );

  // --- SELECTION STATE ---
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]); // Stores selected Hotel Names

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const startCalRef = useRef<HTMLDivElement>(null);
  const endCalRef = useRef<HTMLDivElement>(null);
  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);

  // Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startCalRef.current &&
        !startCalRef.current.contains(event.target as Node)
      )
        setShowStartCalendar(false);
      if (
        endCalRef.current &&
        !endCalRef.current.contains(event.target as Node)
      )
        setShowEndCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/api/admin/bookings`, "GET");
        if (data && data.bookings) {
          const mapped = data.bookings.map((b: any) => ({
            ...b,
            hotelName: b.listingName || b.vehicleName || "Unknown Property",
            guestName: b.customerName || b.customer?.name || "Guest",
            checkIn: b.checkIn || b.startDate,
            id: b.id || Math.random().toString(36).substr(2, 9),
            totalAmount: Number(b.totalAmount) || Number(b.totalPrice) || 0,
          }));
          setBookings(mapped);
        }
      } catch (err) {
        console.error("Failed to load admin reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. PROCESS DATA
  const processedData = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();

    const filtered = bookings.filter((b) => {
      if (!b) return false;
      const matchText =
        (b.guestName || "").toLowerCase().includes(term) ||
        (b.hotelName || "").toLowerCase().includes(term) ||
        (b.id || "").toLowerCase().includes(term);

      let matchDate = true;
      if (startDate && endDate && b.checkIn) {
        try {
          const dateObj = parseISO(b.checkIn);
          if (isValid(dateObj))
            matchDate = isWithinInterval(dateObj, {
              start: startDate,
              end: endDate,
            });
          else matchDate = false;
        } catch {
          matchDate = false;
        }
      }
      return matchText && matchDate;
    });

    const groups: Record<string, any> = {};
    filtered.forEach((b) => {
      const hotelName = b.hotelName || "Unknown Property";
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
        visitCount: 1,
      });
    });

    return Object.values(groups);
  }, [bookings, searchTerm, startDate, endDate]);

  // --- SELECTION HANDLERS ---
  const toggleSelect = (hotelName: string) => {
    setSelectedHotels((prev) =>
      prev.includes(hotelName)
        ? prev.filter((h) => h !== hotelName)
        : [...prev, hotelName],
    );
  };

  const toggleSelectAll = () => {
    if (selectedHotels.length === processedData.length) {
      setSelectedHotels([]); // Deselect All
    } else {
      setSelectedHotels(processedData.map((h) => h.name)); // Select All Visible
    }
  };

  // --- EXPORT LOGIC (Supports Single or Multi) ---
  const handleExport = (type: "excel" | "pdf") => {
    // 1. Determine which data to export
    const dataToExport =
      selectedHotels.length > 0
        ? processedData.filter((h) => selectedHotels.includes(h.name)) // Export Selected Only
        : processedData; // Export All Visible if none selected

    if (dataToExport.length === 0) return alert("No data to export.");

    // 2. Flatten for Export
    const flatData = dataToExport.flatMap((g) =>
      g.guests.map((b: any) => ({
        Hotel: g.name,
        Guest: b.guestName || "Guest",
        "Check In": b.checkIn
          ? format(parseISO(b.checkIn), "dd MMM yyyy")
          : "N/A",
        Status: b.status,
        Total: b.totalAmount,
        "Profit (15%)": b.profit,
      })),
    );

    // 3. Generate File
    if (type === "excel") {
      const ws = XLSX.utils.json_to_sheet(flatData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reports");
      XLSX.writeFile(
        wb,
        `Report_${selectedHotels.length > 0 ? "Selected" : "All"}.xlsx`,
      );
    } else {
      const doc = new jsPDF();
      doc.text(
        selectedHotels.length > 0
          ? "Selected Hotels Report"
          : "Full Admin Report",
        14,
        20,
      );
      autoTable(doc, {
        head: [["Hotel", "Guest", "Date", "Total", "Profit"]],
        body: flatData.map((d: any) => [
          d.Hotel,
          d.Guest,
          d["Check In"],
          `Rs.${d["Total"]}`,
          `Rs.${d["Profit (15%)"]}`,
        ]),
        startY: 30,
      });
      doc.save(`Report_${selectedHotels.length > 0 ? "Selected" : "All"}.pdf`);
    }
  };

  // --- PAGINATION ---
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
            {selectedHotels.length > 0
              ? `${selectedHotels.length} hotels selected`
              : "Global booking data."}
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          {/* Smart Download Buttons: Text changes based on selection */}
          <button
            onClick={() => handleExport("excel")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors border border-green-200 text-sm font-bold"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">
              {selectedHotels.length > 0
                ? `Export Selected (${selectedHotels.length})`
                : "Export All"}
            </span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors border border-red-200 text-sm font-bold"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">
              {selectedHotels.length > 0
                ? `PDF (${selectedHotels.length})`
                : "PDF All"}
            </span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR & SELECT ALL */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-5 lg:items-end">
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

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="relative w-full" ref={startCalRef}>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">
                From
              </label>
              <button
                onClick={() => setShowStartCalendar(!showStartCalendar)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-left"
              >
                <CalendarIcon size={18} className="text-gray-400" />
                <span>
                  {startDate ? format(startDate, "dd MMM yyyy") : "Select"}
                </span>
              </button>
              {showStartCalendar && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-2">
                  <DayPicker
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      setStartDate(d);
                      setShowStartCalendar(false);
                    }}
                    disabled={(d) =>
                      d > new Date() || (endDate ? d > endDate : false)
                    }
                  />
                </div>
              )}
            </div>
            <div className="relative w-full" ref={endCalRef}>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">
                To
              </label>
              <button
                onClick={() => setShowEndCalendar(!showEndCalendar)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-left"
              >
                <CalendarIcon size={18} className="text-gray-400" />
                <span>
                  {endDate ? format(endDate, "dd MMM yyyy") : "Select"}
                </span>
              </button>
              {showEndCalendar && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-2">
                  <DayPicker
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => {
                      setEndDate(d);
                      setShowEndCalendar(false);
                    }}
                    disabled={(d) =>
                      d > new Date() || (startDate ? d < startDate : false)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SELECT ALL BUTTON */}
        {processedData.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            >
              {selectedHotels.length === processedData.length ? (
                <CheckSquare size={18} className="text-blue-600" />
              ) : (
                <Square size={18} />
              )}
              {selectedHotels.length === processedData.length
                ? "Deselect All"
                : "Select All Visible"}
            </button>
            <span className="text-xs text-gray-400">
              ({selectedHotels.length} selected)
            </span>
          </div>
        )}
      </div>

      {/* DATA LIST */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
          <Loader2 className="animate-spin" size={40} />
          <p className="text-sm font-medium">Loading reports...</p>
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center px-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4 text-gray-400">
            <Filter size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No bookings found
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mt-1">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedData.map((hotel: any) => (
            <div
              key={hotel.name}
              className={`bg-white dark:bg-gray-900 rounded-2xl border ${selectedHotels.includes(hotel.name) ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-800"} overflow-hidden shadow-sm transition-all hover:shadow-md`}
            >
              {/* --- HOTEL HEADER --- */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group bg-gray-50/50 dark:bg-gray-800/20">
                <div className="flex items-center gap-4 w-full">
                  {/* CHECKBOX */}
                  <button
                    onClick={() => toggleSelect(hotel.name)}
                    className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {selectedHotels.includes(hotel.name) ? (
                      <CheckSquare size={24} className="text-blue-600" />
                    ) : (
                      <Square size={24} />
                    )}
                  </button>

                  {/* INFO */}
                  <div
                    onClick={() =>
                      setExpandedHotel(
                        expandedHotel === hotel.name ? null : hotel.name,
                      )
                    }
                    className="flex-1 flex items-center gap-4 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
                      <Hotel size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
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
                </div>

                {/* EXPAND ICON */}
                <button
                  onClick={() =>
                    setExpandedHotel(
                      expandedHotel === hotel.name ? null : hotel.name,
                    )
                  }
                  className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform ${expandedHotel === hotel.name ? "rotate-180" : ""}`}
                >
                  <ChevronDown size={20} className="text-gray-500" />
                </button>
              </div>

              {/* --- GUEST LIST --- */}
              {expandedHotel === hotel.name && (
                <div className="border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Guest</th>
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
                            key={guest.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                              {guest.guestName}
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                              {guest.checkIn
                                ? format(parseISO(guest.checkIn), "dd MMM yyyy")
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold uppercase">
                                {guest.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              ₹{guest.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-green-600">
                              ₹{guest.profit.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Cards fallback */}
                  <div className="md:hidden grid gap-3 p-4 bg-gray-50 dark:bg-black/20">
                    {hotel.guests.map((guest: any) => (
                      <div
                        key={guest.id}
                        className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 shadow-sm"
                      >
                        <div className="font-bold text-sm mb-1">
                          {guest.guestName}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {guest.checkIn
                            ? format(parseISO(guest.checkIn), "dd MMM yyyy")
                            : "N/A"}
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>{guest.status}</span>
                          <span className="text-green-600">
                            Profit: ₹{guest.profit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- PAGINATION --- */}
      {processedData.length > 0 && (
        <div className="flex justify-between items-center mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm font-medium text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

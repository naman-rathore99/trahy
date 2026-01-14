"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Loader2,
  PieChart,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building2,
  Car,
  FileText,
  FileSpreadsheet,
  Filter,
  Search,
  CalendarDays,
  ArrowRight,
  MoreVertical,
  Menu,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";
import Link from "next/link";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any>(null);

  // --- 📅 FILTER STATE ---
  const [filterType, setFilterType] = useState<
    "preset" | "date" | "range" | "month" | "year"
  >("preset");
  const [presetVal, setPresetVal] = useState("30days");
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rangeStart, setRangeStart] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rangeEnd, setRangeEnd] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customMonth, setCustomMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [customYear, setCustomYear] = useState(
    new Date().getFullYear().toString()
  );

  // Pagination & Expansion
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // --- 🔽 DROPDOWN STATES ---
  const [showMainDownload, setShowMainDownload] = useState(false);
  const mainDownloadRef = useRef<HTMLDivElement>(null);
  const [activeDownloadRow, setActiveDownloadRow] = useState<string | null>(
    null
  );
  const rowMenuRef = useRef<HTMLDivElement>(null);

  // CLICK OUTSIDE HANDLER
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        mainDownloadRef.current &&
        !mainDownloadRef.current.contains(event.target)
      )
        setShowMainDownload(false);
      if (rowMenuRef.current && !rowMenuRef.current.contains(event.target))
        setActiveDownloadRow(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 🔄 FETCH DATA ---
  useEffect(() => {
    const loadRevenue = async () => {
      setLoading(true);
      let query = "";

      if (filterType === "preset") query = `period=${presetVal}`;
      else if (filterType === "date")
        query = `startDate=${customDate}&endDate=${customDate}`;
      else if (filterType === "range") {
        if (rangeStart <= rangeEnd)
          query = `startDate=${rangeStart}&endDate=${rangeEnd}`;
        else return;
      } else if (filterType === "month") {
        const date = parseISO(`${customMonth}-01`);
        query = `startDate=${format(startOfMonth(date), "yyyy-MM-dd")}&endDate=${format(endOfMonth(date), "yyyy-MM-dd")}`;
      } else if (filterType === "year") {
        const date = parseISO(`${customYear}-01-01`);
        query = `startDate=${format(startOfYear(date), "yyyy-MM-dd")}&endDate=${format(endOfYear(date), "yyyy-MM-dd")}`;
      }

      try {
        const res = await fetch(`/api/revenue?role=admin&${query}`);
        const json = await res.json();
        if (json.success) setRawData(json);
      } catch (error) {
        console.error("Failed to fetch revenue", error);
      } finally {
        setLoading(false);
      }
    };
    loadRevenue();
  }, [
    filterType,
    presetVal,
    customDate,
    rangeStart,
    rangeEnd,
    customMonth,
    customYear,
  ]);

  // --- DATA PROCESSING ---
  const groupedData = useMemo(() => {
    if (!rawData?.bookings) return [];
    const groups: Record<string, any> = {};
    rawData.bookings.forEach((booking: any) => {
      const key = booking.hotelName;
      if (!groups[key]) {
        groups[key] = {
          name: key,
          type: booking.type,
          totalSales: 0,
          totalCommission: 0,
          bookingsCount: 0,
          transactions: [],
        };
      }
      groups[key].totalSales += booking.amount;
      groups[key].totalCommission += booking.yourCut;
      groups[key].bookingsCount += 1;
      groups[key].transactions.push(booking);
    });
    return Object.values(groups).sort(
      (a: any, b: any) => b.totalSales - a.totalSales
    );
  }, [rawData]);

  const totalPages = Math.ceil(groupedData.length / itemsPerPage);
  const currentData = groupedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const toggleRow = (name: string) =>
    setExpandedRow(expandedRow === name ? null : name);
  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setExpandedRow(null);
    }
  };

  // --- 🟢 EXCEL & PDF GENERATORS ---
  const generateExcel = (data: any[], fileName: string) => {
    const dataToExport = data.map((b: any) => ({
      Date: format(new Date(b.date), "yyyy-MM-dd HH:mm"),
      Property: b.hotelName,
      Type: b.type,
      Guest: b.guestName,
      "Total Amount": b.amount,
      "Commission (20%)": b.yourCut,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Report");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const generatePDF = (
    data: any[],
    summary: any,
    title: string,
    fileName: string
  ) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy")}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Total Sales", "Net Commission", "Transactions"]],
      body: [
        [
          `Rs. ${summary.totalSales.toLocaleString()}`,
          `Rs. ${summary.netRevenue.toLocaleString()}`,
          summary.bookingsCount,
        ],
      ],
      theme: "plain",
      styles: { fontSize: 12, fontStyle: "bold" },
    });

    const rows = data.map((b: any) => [
      format(new Date(b.date), "MMM dd"),
      b.hotelName,
      b.type,
      b.guestName,
      `Rs. ${b.amount}`,
      `Rs. ${b.yourCut}`,
    ]);
    autoTable(doc, {
      head: [["Date", "Property", "Type", "Guest", "Amount", "Comm."]],
      body: rows,
      startY: 70,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
    });
    doc.save(`${fileName}.pdf`);
  };

  const handleMainDownload = (type: "pdf" | "excel") => {
    if (!rawData?.bookings) return;
    const fName = `All_Revenue_${new Date().toISOString().slice(0, 10)}`;
    if (type === "excel") generateExcel(rawData.bookings, fName);
    else
      generatePDF(
        rawData.bookings,
        rawData.summary,
        "Platform Revenue Report",
        fName
      );
    setShowMainDownload(false);
  };

  const handleSingleDownload = (group: any, type: "pdf" | "excel") => {
    const fileName = `${group.name.replace(/\s+/g, "_")}_Report`;
    if (type === "excel") generateExcel(group.transactions, fileName);
    else {
      const summary = {
        totalSales: group.totalSales,
        netRevenue: group.totalCommission,
        bookingsCount: group.bookingsCount,
      };
      generatePDF(
        group.transactions,
        summary,
        `${group.name} Revenue Report`,
        fileName
      );
    }
    setActiveDownloadRow(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-6 lg:p-10 font-sans pb-20">
      {/* 1. RESPONSIVE HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
        <div className="w-full xl:w-auto">
          <Link
            href="/admin"
            className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors mb-2 inline-flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Back to Command Center
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Platform Revenue
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Financial overview & commission reports.
          </p>
        </div>

        {/* RESPONSIVE FILTER BAR */}
        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="relative w-full sm:w-auto">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors appearance-none border border-transparent focus:border-blue-500"
            >
              <option value="preset">Quick Filters</option>
              <option value="date">Specific Date</option>
              <option value="range">Date Range</option>
              <option value="month">Specific Month</option>
              <option value="year">Full Year</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

          <div className="flex-1 w-full sm:w-auto">
            {filterType === "preset" && (
              <div className="grid grid-cols-4 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {[
                  { label: "Today", val: "today" },
                  { label: "7D", val: "7days" },
                  { label: "30D", val: "month" },
                  { label: "All", val: "all" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setPresetVal(opt.val)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${presetVal === opt.val ? "bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            {filterType === "date" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="input-field w-full"
              />
            )}
            {filterType === "range" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="input-field w-full"
                />
                <ArrowRight size={14} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="input-field w-full"
                />
              </div>
            )}
            {filterType === "month" && (
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="input-field w-full"
              />
            )}
            {filterType === "year" && (
              <select
                value={customYear}
                onChange={(e) => setCustomYear(e.target.value)}
                className="input-field w-full"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-rose-600" size={32} />
        </div>
      ) : (
        <>
          {/* 2. STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
            <StatCard
              label="Total Volume (GMV)"
              value={`₹${rawData?.summary.totalSales.toLocaleString()}`}
              sub="Total processed volume"
              icon={DollarSign}
              color="blue"
            />
            <StatCard
              label="Net Commission (20%)"
              value={`₹${rawData?.summary.netRevenue.toLocaleString()}`}
              sub="Platform earnings"
              icon={PieChart}
              color="emerald"
              highlight
            />
            <StatCard
              label="Active Properties"
              value={groupedData.length}
              sub="With bookings in this period"
              icon={Building2}
              color="purple"
            />
          </div>

          {/* 3. MAIN TABLE CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 sticky top-0 z-10">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                  <TrendingUp size={18} />
                </div>
                Revenue Breakdown
              </h3>

              <div className="relative w-full sm:w-auto" ref={mainDownloadRef}>
                <button
                  onClick={() => setShowMainDownload(!showMainDownload)}
                  className="w-full sm:w-auto justify-center flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-2.5 rounded-xl transition-all border border-gray-200 dark:border-gray-700"
                >
                  <Download size={16} /> Export All{" "}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showMainDownload ? "rotate-180" : ""}`}
                  />
                </button>
                {showMainDownload && (
                  <div className="absolute right-0 top-12 flex flex-col w-full sm:w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => handleMainDownload("excel")}
                      className="dropdown-item text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <span className="flex flex-row text-sm">
                        <FileSpreadsheet size={16} /> Excel Report
                      </span>
                    </button>
                    <button
                      onClick={() => handleMainDownload("pdf")}
                      className="dropdown-item text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <span className="flex flex-row text-sm">
                        <FileText size={16} /> PDF Document
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs font-bold uppercase text-gray-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4">Property Name</th>
                    <th className="px-6 py-4 text-center">Bookings</th>
                    <th className="px-6 py-4">Total Sales</th>
                    <th className="px-6 py-4 text-right">Commission</th>
                    <th className="px-6 py-4 text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentData.map((group: any) => (
                    <>
                      <tr
                        key={group.name}
                        onClick={() => toggleRow(group.name)}
                        className={`cursor-pointer transition-all duration-200 group ${expandedRow === group.name ? "bg-blue-50/30 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"}`}
                      >
                        <td className="pl-6 py-5 text-gray-400 group-hover:text-blue-500">
                          {expandedRow === group.name ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-10 w-10 rounded-xl flex items-center justify-center ${group.type === "Hotel" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" : "bg-orange-50 text-orange-600 dark:bg-orange-900/20"}`}
                            >
                              {group.type === "Hotel" ? (
                                <Building2 size={20} />
                              ) : (
                                <Car size={20} />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-base truncate max-w-[200px]">
                                {group.name}
                              </div>
                              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                {group.type} Partner
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-600 dark:text-gray-300">
                            {group.bookingsCount}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-gray-900 dark:text-white">
                          ₹{group.totalSales.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            +₹{group.totalCommission.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDownloadRow(
                                activeDownloadRow === group.name
                                  ? null
                                  : group.name
                              );
                            }}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-blue-600 transition-colors relative z-10"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeDownloadRow === group.name && (
                            <div
                              ref={rowMenuRef}
                              className="absolute right-8 top-8 w-30 gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 p-2 animate-in fade-in zoom-in-95"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-sm text-gray-400 ">
                                Select Format
                              </span>
                              <button
                                onClick={() =>
                                  handleSingleDownload(group, "excel")
                                }
                                className="dropdown-item text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <span className="flex flex-row text-xs">
                                  <FileSpreadsheet size={16} /> Excel Report
                                </span>
                              </button>

                              <span>
                                <button
                                  onClick={() =>
                                    handleSingleDownload(group, "pdf")
                                  }
                                  className="dropdown-item text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <span className="flex flex-row text-xs">
                                    <FileText size={16} /> PDF Report
                                  </span>
                                </button>
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                      {expandedRow === group.name && (
                        <tr className="bg-gray-50/30 dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-200">
                          <td colSpan={6} className="p-0">
                            <div className="py-6 px-4 md:px-8 bg-gray-50/50 dark:bg-black/20 border-y border-gray-100 dark:border-gray-800 shadow-inner">
                              <div className="flex justify-between items-center mb-4 pl-4 md:pl-12">
                                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                  <CalendarDays size={14} /> Booking History
                                </h4>
                              </div>
                              <div className="ml-4 md:ml-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 font-bold uppercase border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                      <th className="py-3 px-6 text-left">
                                        Date
                                      </th>
                                      <th className="py-3 px-6 text-left">
                                        Guest Name
                                      </th>
                                      <th className="py-3 px-6 text-right">
                                        Booking Amount
                                      </th>
                                      <th className="py-3 px-6 text-right">
                                        Commission Cut
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {group.transactions.map((trx: any) => (
                                      <tr
                                        key={trx.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                      >
                                        <td className="py-3 px-6 text-gray-500 font-medium">
                                          {format(
                                            new Date(trx.date),
                                            "MMM dd, yyyy"
                                          )}
                                          <span className="text-gray-300 mx-2">
                                            |
                                          </span>
                                          <span className="text-xs">
                                            {format(
                                              new Date(trx.date),
                                              "hh:mm a"
                                            )}
                                          </span>
                                        </td>
                                        <td className="py-3 px-6 font-bold text-gray-700 dark:text-gray-300">
                                          {trx.guestName}
                                        </td>
                                        <td className="py-3 px-6 text-right text-gray-600 dark:text-gray-400 font-medium">
                                          ₹{trx.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-6 text-right font-mono text-emerald-600 text-xs font-bold">
                                          ₹{trx.yourCut.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {groupedData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} className="opacity-40" />
                  </div>
                  <p className="font-medium">
                    No revenue data found for this filter.
                  </p>
                </div>
              )}
            </div>

            {/* PAGINATION */}
            {groupedData.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900 mt-auto">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Showing Page{" "}
                  <span className="text-black dark:text-white font-bold">
                    {currentPage}
                  </span>{" "}
                  of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-gray-600 dark:text-gray-300"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-gray-600 dark:text-gray-300"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, highlight }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };
  return (
    <div
      className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${highlight ? "bg-white dark:bg-gray-900 border-emerald-100 dark:border-emerald-900 ring-4 ring-emerald-50/50 dark:ring-emerald-900/10" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">
            {label}
          </p>
          <h3
            className={`text-2xl md:text-3xl font-extrabold mt-1 tracking-tight ${highlight ? "text-emerald-600" : "text-gray-900 dark:text-white"}`}
          >
            {value}
          </h3>
        </div>
        <div className={`p-3.5 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-xs text-gray-400 font-medium">{sub}</p>
    </div>
  );
}

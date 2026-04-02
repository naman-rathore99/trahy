"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  writeBatch,
  doc,
} from "firebase/firestore";
import {
  IndianRupee,
  Building2,
  Car,
  Search,
  CheckCircle2,
  Landmark,
  ChevronDown,
  ChevronUp,
  Receipt,
  Loader2,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
interface Booking {
  id: string;
  amount: number;
  date: string;
}

interface PartnerPayout {
  id: string; // Partner's UID
  partnerName: string;
  type: "hotel" | "vehicle";
  unpaidBookings: number;
  grossVolume: number;
  bankDetails: {
    accName: string;
    accNo: string;
    ifsc: string;
  };
  bookingIds: string[]; // To update them later
}

interface ToastMsg {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const COMMISSION_RATE = 0.15; // 15% Platform Fee

export default function PayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // --- HELPERS ---
  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  };

  const calculateCommission = (amount: number) => amount * COMMISSION_RATE;
  const calculateNet = (amount: number) => amount - calculateCommission(amount);

  // 1. FETCH LIVE DATA
  const fetchPayouts = async () => {
    setLoading(true);
    try {
      // Step A: Fetch all partner profiles to get bank details
      const usersSnap = await getDocs(query(collection(db, "users")));
      const partnersMap: Record<string, any> = {};
      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.role === "partner") {
          partnersMap[doc.id] = data;
        }
      });

      // Step B: Fetch bookings
      const bookingsSnap = await getDocs(query(collection(db, "bookings")));
      const groupedPayouts: Record<string, PartnerPayout> = {};

      bookingsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const status = (data.status || "").toLowerCase();
        const payoutStatus = (data.payoutStatus || "pending").toLowerCase();

        // We only owe money if the booking is confirmed/completed, and we haven't paid them yet
        if (
          ["confirmed", "paid", "success", "completed"].includes(status) &&
          payoutStatus !== "paid"
        ) {
          const partnerId = data.partnerId;
          if (!partnerId) return; // Skip if no partner attached

          const amount = Number(data.totalAmount || data.price || 0);

          // Initialize the group if it doesn't exist
          if (!groupedPayouts[partnerId]) {
            const partnerProfile = partnersMap[partnerId] || {};
            groupedPayouts[partnerId] = {
              id: partnerId,
              partnerName:
                partnerProfile.businessName ||
                partnerProfile.name ||
                "Unknown Partner",
              type: partnerProfile.hasVehicle ? "vehicle" : "hotel",
              unpaidBookings: 0,
              grossVolume: 0,
              bankDetails: {
                accName: partnerProfile.bankAccountName || "Not Provided",
                accNo: partnerProfile.bankAccountNumber || "Not Provided",
                ifsc: partnerProfile.bankIfsc || "Not Provided",
              },
              bookingIds: [],
            };
          }

          // Add this booking's value to the partner's total
          groupedPayouts[partnerId].unpaidBookings += 1;
          groupedPayouts[partnerId].grossVolume += amount;
          groupedPayouts[partnerId].bookingIds.push(docSnap.id);
        }
      });

      // Convert object to array for rendering
      setPayouts(Object.values(groupedPayouts));
    } catch (error) {
      console.error("Error fetching payouts:", error);
      addToast("Failed to load payouts from database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // 2. PROCESS PAYOUT (Write to Firebase)
  const handleMarkAsPaid = async (partnerId: string, bookingIds: string[]) => {
    setProcessingId(partnerId);
    try {
      // Use a Firestore Batch to update all bookings at once securely
      const batch = writeBatch(db);

      bookingIds.forEach((bookingId) => {
        const bookingRef = doc(db, "bookings", bookingId);
        batch.update(bookingRef, {
          payoutStatus: "paid",
          payoutDate: new Date().toISOString(),
        });
      });

      await batch.commit();

      // Remove the paid partner from the UI immediately
      setPayouts((prev) => prev.filter((p) => p.id !== partnerId));
      setExpandedId(null);
      addToast("Successfully marked as paid!", "success");
    } catch (error) {
      console.error("Error marking as paid:", error);
      addToast("Failed to update database.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const totalPendingNet = payouts.reduce(
    (acc, partner) => acc + calculateNet(partner.grossVolume),
    0,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9] dark:bg-[#09090B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF5A1F] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">
            Calculating Settlements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] dark:bg-[#09090B] pb-12">
      {/* TOASTER */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-right duration-300"
          >
            {toast.type === "success" && (
              <CheckCircle2 className="text-emerald-500" size={20} />
            )}
            {toast.type === "error" && (
              <AlertCircle className="text-red-500" size={20} />
            )}
            {toast.type === "info" && (
              <Info className="text-blue-500" size={20} />
            )}
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {toast.message}
            </span>
            <button
              onClick={() =>
                setToasts((t) => t.filter((x) => x.id !== toast.id))
              }
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-gray-800 px-8 py-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/admin"
                className="text-xs font-bold text-gray-400 hover:text-[#FF5A1F] transition-colors"
              >
                Admin
              </Link>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-xs font-bold text-[#FF5A1F]">Payouts</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Partner Settlements
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
              Calculate and process manual bank payouts.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 px-6 py-3 rounded-2xl flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 p-2.5 rounded-xl text-white shadow-sm shadow-orange-500/20">
              <IndianRupee size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#FF5A1F] uppercase tracking-wider mb-0.5">
                Total Payable Now
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                ₹{totalPendingNet.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-8">
        {/* SEARCH & FILTER */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72 hidden md:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search partner or hotel..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 text-gray-900 dark:text-white shadow-sm transition-all"
            />
          </div>
          <p className="text-xs font-bold text-gray-500">
            {payouts.length} Partners await payment
          </p>
        </div>

        {/* PAYOUT LIST */}
        <div className="space-y-4">
          {payouts.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] rounded-[24px] border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
              <CheckCircle2
                size={48}
                className="mx-auto text-emerald-500 mb-4 opacity-50"
              />
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                All Caught Up!
              </h3>
              <p className="text-sm text-gray-500">
                There are no pending payouts to process right now.
              </p>
            </div>
          ) : (
            payouts.map((partner) => {
              const isExpanded = expandedId === partner.id;
              const netPayable = calculateNet(partner.grossVolume);
              const commission = calculateCommission(partner.grossVolume);
              const isProcessing = processingId === partner.id;

              return (
                <div
                  key={partner.id}
                  className={`bg-white dark:bg-[#111827] rounded-[24px] border ${isExpanded ? "border-[#FF5A1F]/30 dark:border-[#FF5A1F]/30 shadow-md" : "border-gray-100 dark:border-gray-800 shadow-sm"} overflow-hidden transition-all duration-300`}
                >
                  {/* COMPACT CARD (Always Visible) */}
                  <div
                    onClick={() =>
                      !isProcessing &&
                      setExpandedId(isExpanded ? null : partner.id)
                    }
                    className={`p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${partner.type === "hotel" ? "bg-orange-50 text-[#FF5A1F] dark:bg-orange-900/20" : "bg-blue-50 text-blue-500 dark:bg-blue-900/20"}`}
                      >
                        {partner.type === "hotel" ? (
                          <Building2 size={24} />
                        ) : (
                          <Car size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">
                          {partner.partnerName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {partner.unpaidBookings} Unpaid Bookings
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8 md:gap-12">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Net Payable
                        </p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">
                          ₹{netPayable.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#FF5A1F]" : ""}`}
                      >
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS (Math & Bank Info) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#09090B]/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: The Math Breakdown */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Receipt size={16} className="text-gray-400" />{" "}
                            Payment Calculation
                          </h4>

                          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 font-medium">
                                Gross Booking Volume
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                ₹{partner.grossVolume.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 font-medium">
                                Platform Commission (15%)
                              </span>
                              <span className="font-bold text-rose-500">
                                - ₹{commission.toLocaleString()}
                              </span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-gray-800 w-full my-2" />
                            <div className="flex justify-between text-base">
                              <span className="font-bold text-gray-900 dark:text-white">
                                Final Payout Amount
                              </span>
                              <span className="font-black text-[#FF5A1F]">
                                ₹{netPayable.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Bank Details & Action */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Landmark size={16} className="text-gray-400" />{" "}
                            Bank Transfer Details
                          </h4>

                          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2 relative overflow-hidden">
                            {partner.bankDetails.accNo === "Not Provided" && (
                              <div className="absolute inset-0 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm flex items-center justify-center z-10">
                                <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                                  <AlertCircle size={14} /> Bank Details Missing
                                </p>
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">
                              Transfer to:
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {partner.bankDetails.accName}
                            </p>
                            <p className="text-base font-medium text-gray-600 dark:text-gray-400 font-mono tracking-wide">
                              {partner.bankDetails.accNo}
                            </p>
                            <p className="text-xs font-bold text-gray-500 font-mono mt-1">
                              IFSC:{" "}
                              <span className="text-gray-700 dark:text-gray-300">
                                {partner.bankDetails.ifsc}
                              </span>
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              handleMarkAsPaid(partner.id, partner.bookingIds)
                            }
                            disabled={
                              isProcessing ||
                              partner.bankDetails.accNo === "Not Provided"
                            }
                            className="w-full bg-gradient-to-br from-gray-900 to-black hover:from-black hover:to-gray-900 dark:from-white dark:to-gray-200 dark:hover:from-gray-200 dark:hover:to-white text-white dark:text-black py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />{" "}
                                Processing Firebase Update...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={18} /> Mark as Paid Manually
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

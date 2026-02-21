"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination";
import {
  Loader2,
  Calendar,
  Car,
  Clock,
  XCircle,
  Ticket,
  Edit,
  Save,
  BedDouble,
  X,
  LayoutGrid,
  RefreshCcw,
  History,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import {
  format,
  parseISO,
  isPast,
  isToday,
  isValid,
  formatDistanceToNow,
} from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- TYPES ---
interface Booking {
  id: string;
  sourceCollection: "bookings" | "vehicle_bookings";

  // Normalized Fields
  listingName: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  serviceType: "hotel" | "vehicle_only";

  status: "confirmed" | "pending" | "cancelled" | "failed";
  paymentStatus?: "pending" | "paid" | "failed";

  // Original Data
  vehicleType?: string;
  vehicleIncluded?: boolean;
  userName?: string;
  userEmail?: string;
  priceBreakdown?: any;
  createdAt: any;
  updatedAt?: any;
}

const ITEMS_PER_PAGE = 5;

export default function TripsPage() {
  const router = useRouter();
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryTab, setCategoryTab] = useState<"all" | "hotels" | "vehicles">(
    "all",
  );
  const [timeTab, setTimeTab] = useState<"upcoming" | "past">("upcoming");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(
    null,
  );
  const [newDates, setNewDates] = useState<DateRange | undefined>();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Animations
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  // --- 1. FETCH TRIPS ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login?redirect=/trips");
        return;
      }

      try {
        setLoading(true);

        // ✅ FIX 1: Query inside the nested 'customer' map
        const hotelQuery = query(
          collection(db, "bookings"),
          where("customer.userId", "==", currentUser.uid),
        );

        const vehicleQuery = query(
          collection(db, "vehicle_bookings"),
          where("customer.userId", "==", currentUser.uid),
        );

        const [hotelSnapshot, vehicleSnapshot] = await Promise.all([
          getDocs(hotelQuery),
          getDocs(vehicleQuery),
        ]);

        const hotelData = hotelSnapshot.docs.map((doc) => {
          const d = doc.data();
          const isLegacyVehicle =
            d.type === "vehicle" || (d.serviceType || "").includes("vehicle");

          // ✅ FIX 2: Normalize "pending_payment" to "pending"
          const rawStatus =
            d.status === "pending_payment" ? "pending" : d.status || "pending";
          const pStatus =
            d.paymentStatus === "pending_payment"
              ? "pending"
              : d.paymentStatus ||
                (rawStatus === "confirmed" ? "paid" : "pending");

          return {
            id: doc.id,
            sourceCollection: "bookings",
            ...d,
            listingName:
              d.listingName ||
              d.hotelName ||
              d.vehicleName ||
              "Unnamed Booking",
            listingImage:
              d.listingImage ||
              d.hotelImage ||
              d.vehicleImage ||
              "/placeholder.jpg",
            checkIn: d.checkIn || d.startDate,
            checkOut: d.checkOut || d.endDate,
            totalAmount: Number(d.totalAmount || d.totalPrice || 0),
            serviceType: isLegacyVehicle ? "vehicle_only" : "hotel",
            status: rawStatus,
            paymentStatus: pStatus,
            userName: d.customer?.name || d.userName,
            userEmail: d.customer?.email || d.userEmail,
          };
        });

        const vehicleData = vehicleSnapshot.docs.map((doc) => {
          const d = doc.data();
          const rawStatus =
            d.status === "pending_payment" ? "pending" : d.status || "pending";
          const pStatus =
            d.paymentStatus === "pending_payment"
              ? "pending"
              : d.paymentStatus ||
                (rawStatus === "confirmed" ? "paid" : "pending");

          return {
            id: doc.id,
            sourceCollection: "vehicle_bookings",
            ...d,
            listingName: d.vehicleName || "Unnamed Vehicle",
            listingImage: d.vehicleImage || "/placeholder.jpg",
            checkIn: d.startDate,
            checkOut: d.endDate,
            totalAmount: Number(d.totalPrice || d.totalAmount || 0),
            serviceType: "vehicle_only",
            status: rawStatus,
            paymentStatus: pStatus,
            userName: d.customer?.name || d.userName,
            userEmail: d.customer?.email || d.userEmail,
          };
        });

        const allTrips = [...hotelData, ...vehicleData] as Booking[];

        // Sort by Created At (Newest first)
        allTrips.sort((a, b) => {
          const getSeconds = (t: any) => {
            if (!t) return 0;
            if (typeof t === "string") return new Date(t).getTime();
            if (t.seconds) return t.seconds * 1000;
            if (t.toDate) return t.toDate().getTime();
            return 0;
          };
          return getSeconds(b.createdAt) - getSeconds(a.createdAt);
        });

        setBookings(allTrips);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ✅ HELPER: Safely convert dates
  const getValidDate = (dateVal: any): Date | null => {
    if (!dateVal) return null;
    if (typeof dateVal === "object" && dateVal.seconds)
      return new Date(dateVal.seconds * 1000);
    if (typeof dateVal === "object" && dateVal.toDate) return dateVal.toDate();
    if (typeof dateVal === "string") {
      const d = parseISO(dateVal);
      return isValid(d) ? d : new Date(dateVal);
    }
    if (dateVal instanceof Date) return dateVal;
    return null;
  };

  // --- 2. ACTIONS ---
  const checkPaymentStatus = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    setRefreshingIds((prev) => new Set(prev).add(bookingId));
    setFailedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(bookingId);
      return newSet;
    });

    try {
      const res = await fetch(`/api/payment/status?id=${bookingId}`);
      const data = await res.json();

      if (data.paymentStatus === "paid" || data.status === "confirmed") {
        alert("Payment Successful! Your trip is confirmed.");
        window.location.reload();
      } else if (data.paymentStatus === "failed") {
        setFailedIds((prev) => new Set(prev).add(bookingId));
        alert("Payment failed or was declined.");
        window.location.reload();
      } else {
        alert("Payment is still pending on PhonePe.");
      }
    } catch (err) {
      console.error(err);
      setFailedIds((prev) => new Set(prev).add(bookingId));
    } finally {
      setRefreshingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const handleCancel = async (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    setCancellingId(booking.id);

    try {
      await updateDoc(doc(db, booking.sourceCollection, booking.id), {
        status: "cancelled",
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: "cancelled" } : b,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("Error processing cancellation");
    } finally {
      setCancellingId(null);
    }
  };

  const openReschedule = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setRescheduleBooking(booking);
    try {
      if (booking.checkIn && booking.checkOut) {
        const fromDate = getValidDate(booking.checkIn);
        const toDate = getValidDate(booking.checkOut);
        if (fromDate && toDate) setNewDates({ from: fromDate, to: toDate });
      }
    } catch (e) {
      console.error("Invalid date format", e);
    }
  };

  const confirmReschedule = async () => {
    if (!rescheduleBooking || !newDates?.from || !newDates?.to) return;
    setUpdating(true);
    try {
      const newStart = format(newDates.from, "yyyy-MM-dd");
      const newEnd = format(newDates.to, "yyyy-MM-dd");

      const isVehicleCollection =
        rescheduleBooking.sourceCollection === "vehicle_bookings";
      const isLegacyVehicle = rescheduleBooking.serviceType === "vehicle_only";

      const updateData =
        isVehicleCollection || isLegacyVehicle
          ? { startDate: newStart, endDate: newEnd, status: "confirmed" }
          : { checkIn: newStart, checkOut: newEnd, status: "confirmed" };

      await updateDoc(
        doc(db, rescheduleBooking.sourceCollection, rescheduleBooking.id),
        updateData,
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rescheduleBooking.id
            ? { ...b, checkIn: newStart, checkOut: newEnd, status: "confirmed" }
            : b,
        ),
      );
      setRescheduleBooking(null);
      alert("Rescheduled successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to reschedule.");
    } finally {
      setUpdating(false);
    }
  };

  // --- FILTER & PAGINATION ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookings = bookings.filter((b) => {
    if (categoryTab === "hotels" && b.serviceType !== "hotel") return false;
    if (categoryTab === "vehicles" && b.serviceType !== "vehicle_only")
      return false;

    const tripDate = getValidDate(b.checkIn);

    if (timeTab === "upcoming") {
      if (b.status === "cancelled" || b.status === "failed") return false;
      if (!tripDate) return false;
      const tempDate = new Date(tripDate);
      tempDate.setHours(0, 0, 0, 0);
      return tempDate >= today || b.status === "pending";
    } else {
      if (b.status === "cancelled" || b.status === "failed") return true;
      if (!tripDate) return true;
      const tempDate = new Date(tripDate);
      tempDate.setHours(0, 0, 0, 0);
      return tempDate < today && b.status !== "pending";
    }
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryTab, timeTab]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    Math.max(totalPages, 1),
  );
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentBookings = filteredBookings.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const EmptyState = () => (
    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
        {categoryTab === "hotels" ? (
          <BedDouble size={24} />
        ) : categoryTab === "vehicles" ? (
          <Car size={24} />
        ) : (
          <LayoutGrid size={24} />
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        No {timeTab} trips found
      </h3>
      <p className="text-sm text-gray-500">
        {timeTab === "upcoming"
          ? "Time to book your next adventure!"
          : "You have no past or cancelled trips."}
      </p>
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 print:bg-white print:p-0">
      <div className="print:hidden">
        <Navbar variant="default" />
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-32 print:pt-0 print:max-w-none">
        {/* HEADER & FILTERS */}
        <div className="flex flex-col mb-8 gap-6 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              My Trips
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Manage your upcoming stays and view past memories.
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="bg-gray-200 dark:bg-gray-900 p-1 rounded-xl inline-flex gap-1">
                <button
                  onClick={() => setCategoryTab("all")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoryTab === "all" ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  <LayoutGrid size={16} /> All
                </button>
                <button
                  onClick={() => setCategoryTab("hotels")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoryTab === "hotels" ? "bg-white dark:bg-gray-800 shadow text-rose-600 dark:text-rose-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  <BedDouble size={16} /> Hotels
                </button>
                <button
                  onClick={() => setCategoryTab("vehicles")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoryTab === "vehicles" ? "bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  <Car size={16} /> Vehicles
                </button>
              </div>

              <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 w-full sm:w-auto">
                <button
                  onClick={() => setTimeTab("upcoming")}
                  className={`pb-2 text-sm font-bold transition-all border-b-2 ${timeTab === "upcoming" ? "border-rose-600 text-rose-600" : "border-transparent text-gray-500"}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setTimeTab("past")}
                  className={`pb-2 text-sm font-bold transition-all border-b-2 flex items-center gap-1 ${timeTab === "past" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-500"}`}
                >
                  <History size={14} /> History & Failed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-6 print:hidden">
          {filteredBookings.length === 0 ? (
            <EmptyState />
          ) : (
            currentBookings.map((booking) => {
              const isCancelled = booking.status === "cancelled";
              const isFailedAPI =
                booking.status === "failed" ||
                booking.paymentStatus === "failed";
              const isPaymentPending =
                (booking.paymentStatus === "pending" ||
                  booking.status === "pending") &&
                !isCancelled &&
                !isFailedAPI;

              const isRefreshing = refreshingIds.has(booking.id);
              const isFailedRefresh = failedIds.has(booking.id);
              const updatedDate = getValidDate(booking.updatedAt);

              let displayStart = "Date Pending";
              let displayEnd = "Date Pending";
              let dateValid = false;

              const checkInDate = getValidDate(booking.checkIn);
              const checkOutDate = getValidDate(booking.checkOut);

              if (checkInDate && checkOutDate) {
                displayStart = format(checkInDate, "dd MMM");
                displayEnd = format(checkOutDate, "dd MMM yyyy");
                dateValid = true;
              }

              const isCompleted =
                dateValid &&
                !isCancelled &&
                !isFailedAPI &&
                isPast(checkOutDate!) &&
                !isToday(checkOutDate!);
              const isVehicle = booking.serviceType === "vehicle_only";
              const TypeIcon = isVehicle ? Car : BedDouble;
              const typeLabel = isVehicle ? "Vehicle Rental" : "Hotel Stay";
              const dateLabel = isVehicle
                ? "Pickup - Dropoff"
                : "Check-in - Check-out";
              const themeColor = isVehicle ? "indigo" : "rose";

              return (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`group bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-6 relative overflow-hidden ${isCancelled || isFailedAPI ? "opacity-75 border-gray-200 bg-gray-50 dark:bg-gray-900/50" : "border-gray-200 dark:border-gray-800"}`}
                >
                  {/* Image & Badges */}
                  <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                    <img
                      src={booking.listingImage || "/placeholder.jpg"}
                      className={`w-full h-full object-cover transition-transform duration-500 ${!isCancelled && !isFailedAPI && "group-hover:scale-105"} ${(isCompleted || isCancelled || isFailedAPI) && "grayscale"}`}
                      alt={booking.listingName}
                    />

                    <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                      <div
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 
                          ${
                            isCancelled
                              ? "bg-gray-600 text-white"
                              : isFailedAPI
                                ? "bg-red-600 text-white"
                                : isPaymentPending
                                  ? "bg-amber-500 text-white"
                                  : isCompleted
                                    ? "bg-slate-600 text-white"
                                    : "bg-emerald-500 text-white"
                          }`}
                      >
                        {isCancelled
                          ? "Cancelled"
                          : isFailedAPI
                            ? "Payment Failed"
                            : isPaymentPending
                              ? "Payment Pending"
                              : isCompleted
                                ? "Completed"
                                : "Confirmed"}

                        {isPaymentPending && (
                          <button
                            onClick={(e) => checkPaymentStatus(e, booking.id)}
                            disabled={isRefreshing}
                            className={`p-1 rounded-full transition-all ${isFailedRefresh ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/40"}`}
                            title="Check Payment Status"
                          >
                            <RefreshCcw
                              size={10}
                              className={isRefreshing ? "animate-spin" : ""}
                            />
                          </button>
                        )}
                      </div>

                      {isPaymentPending && updatedDate && (
                        <div className="bg-black/50 backdrop-blur-md text-white px-2 py-0.5 rounded text-[9px]">
                          Updated {formatDistanceToNow(updatedDate)} ago
                        </div>
                      )}
                    </div>

                    <div
                      className={`absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 ${isVehicle ? "bg-indigo-600" : "bg-rose-600"}`}
                    >
                      <TypeIcon size={10} /> {typeLabel}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-center py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3
                          className={`text-lg font-bold mb-1 ${isCompleted || isCancelled || isFailedAPI ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}
                        >
                          {booking.listingName}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {isCancelled && (
                            <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                              <XCircle size={14} /> Cancelled by User
                            </span>
                          )}
                          {isFailedAPI && (
                            <span className="text-red-500 text-sm font-medium flex items-center gap-1">
                              <XCircle size={14} /> Failed Transaction
                            </span>
                          )}
                          {!isCompleted && !isCancelled && !isFailedAPI && (
                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                              <Clock size={12} /> Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{booking.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {dateLabel}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar
                          size={16}
                          className={`text-${themeColor}-500`}
                        />
                        <span>{displayStart}</span>
                        <span className="text-gray-300 dark:text-gray-600 mx-1">
                          →
                        </span>
                        <span>{displayEnd}</span>
                      </div>
                    </div>

                    {!isVehicle &&
                      booking.vehicleIncluded &&
                      !isCancelled &&
                      !isFailedAPI && (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 w-fit px-3 py-1.5 rounded-lg mb-4 border border-amber-100 dark:border-amber-900/30">
                          <Car size={14} />
                          <span>Includes {booking.vehicleType || "Cab"}</span>
                        </div>
                      )}

                    <div className="flex flex-wrap gap-3 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 sm:border-0 sm:pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(booking);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-black dark:hover:bg-gray-200 transition-colors"
                      >
                        <Ticket size={14} />{" "}
                        {isCompleted || isCancelled || isFailedAPI
                          ? "Receipt"
                          : "Details"}
                      </button>

                      {!isCancelled && !isCompleted && !isFailedAPI && (
                        <>
                          <button
                            onClick={(e) => openReschedule(e, booking)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit size={14} /> Reschedule
                          </button>
                          <button
                            onClick={(e) => handleCancel(e, booking)}
                            disabled={cancellingId === booking.id}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === booking.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <XCircle size={14} />
                            )}{" "}
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredBookings.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filteredBookings.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            className="mt-12"
          />
        )}
      </div>

      {/* --- INVOICE MODAL --- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:static">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
            onClick={() => setSelectedBooking(null)}
          ></div>
          <div className="relative bg-white dark:bg-black w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:w-full print:max-w-none">
            <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-6 flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-widest">
                  {selectedBooking.status === "failed"
                    ? "Failed Receipt"
                    : "Invoice"}
                </h2>
                <div className="text-gray-400 dark:text-gray-600 text-sm mt-1 print:text-gray-600">
                  ID: #{selectedBooking.id.slice(0, 8).toUpperCase()}
                </div>
                <div
                  className={`inline-flex items-center gap-2 mt-2 px-2 py-1 rounded text-xs font-bold uppercase ${selectedBooking.serviceType === "vehicle_only" ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"}`}
                >
                  {selectedBooking.serviceType === "vehicle_only" ? (
                    <Car size={14} />
                  ) : (
                    <BedDouble size={14} />
                  )}
                  {selectedBooking.serviceType === "vehicle_only"
                    ? "Vehicle Rental"
                    : "Hotel Booking"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl">Shubh Yatra</div>
                <div className="text-xs text-gray-400 dark:text-gray-600 print:text-gray-600">
                  Mathura, UP, India
                </div>
              </div>
            </div>
            <div className="p-8 overflow-y-auto print:overflow-visible">
              <div className="flex justify-between mb-8 pb-8 border-b border-dashed border-gray-200 dark:border-gray-800">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Billed To
                  </div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {selectedBooking.userName ||
                      auth.currentUser?.displayName ||
                      "Guest User"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedBooking.userEmail || auth.currentUser?.email}
                  </div>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-bold text-sm border-b dark:border-gray-800 pb-2 text-gray-900 dark:text-white">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    {selectedBooking.serviceType === "vehicle_only"
                      ? "Rental Charges"
                      : "Room Charges"}
                  </span>
                  <span>
                    ₹{selectedBooking.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <div
                className={`p-4 rounded-lg flex justify-between items-center print:bg-transparent print:border-t-2 print:border-black print:rounded-none ${selectedBooking.status === "failed" ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-900"}`}
              >
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  Grand Total
                </span>
                <span
                  className={`font-extrabold text-2xl print:text-black ${selectedBooking.status === "failed" ? "text-red-600" : "text-rose-600 dark:text-rose-500"}`}
                >
                  ₹{selectedBooking.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 text-white dark:text-black hover:text-rose-500 transition-colors print:hidden"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* --- RESCHEDULE MODAL --- */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRescheduleBooking(null)}
          ></div>
          <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
              <Edit className="text-rose-600" /> Reschedule
            </h2>
            <div className="flex justify-center mb-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <DayPicker
                mode="range"
                selected={newDates}
                onSelect={setNewDates}
                disabled={{ before: new Date() }}
                modifiersClassNames={{
                  selected: "bg-rose-600 text-white",
                  day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md",
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRescheduleBooking(null)}
                className="flex-1 py-3 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                disabled={updating || !newDates?.from || !newDates?.to}
                className="flex-1 py-3 font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {updating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}{" "}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/lib/firebase";
import { getFirestore, doc, onSnapshot, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import {
  CheckCircle,
  Loader2,
  Calendar,
  Car,
  Home,
  XCircle,
  HelpCircle,
  Send,
  AlertTriangle,
  BedDouble,
  MapPin,
  Clock,
  CreditCard,
  Hash,
  ChevronRight,
} from "lucide-react";
import { format, parseISO, isFuture, isValid } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function BookingSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [requestType, setRequestType] = useState<"date_change" | "general">(
    "general",
  );
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (!id) return;
    const db = getFirestore(app);
    let unsubscribe = () => {};

    const setupListener = async () => {
      let collectionName = "bookings";
      let docRef = doc(db, "bookings", id);
      let snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        docRef = doc(db, "vehicle_bookings", id);
        snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          collectionName = "vehicle_bookings";
        } else {
          setLoading(false);
          return;
        }
      }

      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          const isVehicle =
            collectionName === "vehicle_bookings" || d.type === "vehicle";

          // ✅ Fix image — try multiple fields with fallback
          const rawImage =
            d.listingImage ||
            d.vehicleImage ||
            d.image ||
            d.imageUrl ||
            d.thumbnail ||
            null;

          setBooking({
            id: docSnap.id,
            sourceCollection: collectionName,
            ...d,
            listingName: d.listingName || d.vehicleName || "Unknown Booking",
            listingImage: rawImage,
            checkIn: d.checkIn || d.startDate,
            checkOut: d.checkOut || d.endDate,
            totalAmount: d.totalAmount || d.totalPrice,
            serviceType: isVehicle ? "vehicle_only" : "hotel",
          });
        }
        setLoading(false);
      });
    };

    setupListener();
    return () => unsubscribe();
  }, [id]);

  const handleDateSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    if (range?.from) {
      const fromStr = format(range.from, "MMM dd, yyyy");
      const toStr = range.to ? format(range.to, "MMM dd, yyyy") : "...";
      setSupportMessage(
        `I would like to request a date change to: ${fromStr} - ${toStr}`,
      );
    }
  };

  const handleCancel = async () => {
    if (
      !confirm("Are you sure you want to cancel? This action cannot be undone.")
    )
      return;
    try {
      await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          collectionName: booking?.sourceCollection,
        }),
      });
    } catch {
      alert("Error cancelling booking");
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await fetch("/api/bookings/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          collectionName: booking?.sourceCollection,
          message: supportMessage,
          type: requestType,
        }),
      });
      alert("Request sent!");
      setShowSupport(false);
      setSupportMessage("");
      setSelectedRange(undefined);
    } catch {
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">
            Loading your booking...
          </p>
        </div>
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-4 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={36} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Booking Not Found
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          This booking may have been removed or doesn't exist.
        </p>
        <button
          onClick={() => router.push("/trips")}
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold text-sm"
        >
          Go to My Trips
        </button>
      </div>
    );

  const isConfirmed = booking.status === "confirmed";
  const isFailed = booking.status === "failed";
  const isPending =
    booking.status === "pending" || booking.status === "pending_payment";
  const isCancelled = booking.status === "cancelled";
  const isVehicle = booking.serviceType === "vehicle_only";

  let isUpcoming = false;
  let displayCheckIn = "TBD";
  let displayCheckOut = "TBD";
  let nightsOrDays = 0;

  if (booking.checkIn && booking.checkOut) {
    try {
      const start = parseISO(booking.checkIn);
      const end = parseISO(booking.checkOut);
      if (isValid(start) && isValid(end)) {
        isUpcoming = isFuture(start);
        displayCheckIn = format(start, "EEE, dd MMM yyyy");
        displayCheckOut = format(end, "EEE, dd MMM yyyy");
        nightsOrDays = Math.max(
          1,
          Math.round((end.getTime() - start.getTime()) / 86400000),
        );
      }
    } catch {}
  }

  // Status config
  const statusConfig = {
    confirmed: {
      color: "from-emerald-500 to-teal-600",
      badge:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      label: "Confirmed",
    },
    failed: {
      color: "from-red-500 to-rose-600",
      badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      label: "Failed",
    },
    pending: {
      color: "from-amber-400 to-orange-500",
      badge:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      label: "Pending",
    },
    pending_payment: {
      color: "from-amber-400 to-orange-500",
      badge:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      label: "Pending",
    },
    cancelled: {
      color: "from-gray-400 to-gray-600",
      badge: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
      label: "Cancelled",
    },
  };

  const cfg =
    statusConfig[booking.status as keyof typeof statusConfig] ||
    statusConfig.confirmed;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24 transition-colors duration-300">
      <Navbar variant="default" />

      <div className="max-w-2xl mx-auto px-4 pt-24 md:pt-32">
        {/* ── STATUS HERO ── */}
        <div
          className={`relative bg-gradient-to-br ${cfg.color} rounded-3xl p-8 mb-6 text-white overflow-hidden`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative flex items-start gap-5">
            {/* Status Icon */}
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
              {isConfirmed && <CheckCircle size={28} className="text-white" />}
              {isFailed && <XCircle size={28} className="text-white" />}
              {isPending && <Clock size={28} className="text-white" />}
              {isCancelled && <XCircle size={28} className="text-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                {isVehicle ? "Vehicle Rental" : "Hotel Booking"}
              </p>
              <h1 className="text-2xl font-bold mb-1">
                {isConfirmed && "Payment Successful!"}
                {isFailed && "Payment Failed"}
                {isPending && "Processing Payment..."}
                {isCancelled && "Booking Cancelled"}
              </h1>
              <p className="text-white/70 text-sm font-mono">
                #{id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* ── BOOKING CARD ── */}
        <div
          className={`bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800 mb-6 ${isCancelled ? "opacity-75" : ""}`}
        >
          {/* Image + Name Header */}
          <div className="relative h-52 bg-gray-100 dark:bg-zinc-800">
            {booking.listingImage ? (
              <img
                src={booking.listingImage}
                alt={booking.listingName}
                className={`w-full h-full object-cover ${isCancelled ? "grayscale" : ""}`}
                onError={(e) => {
                  // ✅ If image fails to load, show fallback gradient
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}

            {/* Always-visible gradient overlay + name */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isVehicle ? "bg-blue-500/20 text-blue-200" : "bg-rose-500/20 text-rose-200"}`}
                >
                  {isVehicle ? <Car size={10} /> : <BedDouble size={10} />}
                  {isVehicle ? "Vehicle" : "Hotel Stay"}
                </span>
                <span
                  className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}
                >
                  {cfg.label}
                </span>
              </div>
              <h2
                className={`text-xl font-bold text-white ${isCancelled ? "line-through opacity-70" : ""}`}
              >
                {booking.listingName}
              </h2>
              <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> Mathura, Uttar Pradesh
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-5 space-y-4">
            {/* Dates */}
            {booking.checkIn && booking.checkOut && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wide mb-1">
                    {isVehicle ? "Pickup" : "Check-in"}
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {displayCheckIn}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wide mb-1">
                    {isVehicle ? "Return" : "Check-out"}
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {displayCheckOut}
                  </p>
                </div>
              </div>
            )}

            {/* Nights/Days pill */}
            {nightsOrDays > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                <Calendar size={14} />
                <span>
                  {nightsOrDays} {isVehicle ? "day" : "night"}
                  {nightsOrDays > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Vehicle add-on */}
            {booking.vehicleIncluded && !isVehicle && (
              <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4">
                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center shrink-0">
                  <Car size={18} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">
                    {booking.vehicleType}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Included with your stay
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-zinc-800" />

            {/* Amount + Booking ID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                  <CreditCard
                    size={16}
                    className="text-gray-500 dark:text-zinc-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    Total Paid
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    ₹{Number(booking.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 justify-end mb-0.5">
                  <Hash size={10} /> Booking ID
                </p>
                <p className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-300">
                  {id.slice(0, 12).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MANAGE BOOKING ── */}
        {!isCancelled && !isFailed && isUpcoming && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Manage Booking
              </h3>
            </div>

            {!showSupport ? (
              <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                <button
                  onClick={() => {
                    setShowSupport(true);
                    setRequestType("date_change");
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center">
                      <Calendar
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        Change Dates
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        Request a date modification
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button
                  onClick={() => {
                    setShowSupport(true);
                    setRequestType("general");
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-50 dark:bg-violet-950/40 rounded-xl flex items-center justify-center">
                      <HelpCircle
                        size={16}
                        className="text-violet-600 dark:text-violet-400"
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        Get Help
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        Contact support for assistance
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button
                  onClick={handleCancel}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center">
                      <XCircle size={16} className="text-red-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-red-600 dark:text-red-400">
                        Cancel Booking
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-red-400" />
                </button>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-gray-700 dark:text-zinc-300">
                    {requestType === "date_change"
                      ? "Select New Dates"
                      : "How can we help?"}
                  </h4>
                  <button
                    onClick={() => setShowSupport(false)}
                    className="w-7 h-7 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700"
                  >
                    <XCircle
                      size={14}
                      className="text-gray-500 dark:text-zinc-400"
                    />
                  </button>
                </div>

                {requestType === "date_change" && (
                  <div className="flex justify-center mb-4 bg-gray-50 dark:bg-zinc-800 p-2 rounded-2xl">
                    <DayPicker
                      mode="range"
                      selected={selectedRange}
                      onSelect={handleDateSelect}
                      disabled={{ before: new Date() }}
                    />
                  </div>
                )}

                <form onSubmit={handleSupportSubmit} className="space-y-3">
                  <textarea
                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder={
                      requestType === "date_change"
                        ? "Select dates above..."
                        : "Describe your issue..."
                    }
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSupport(false)}
                      className="px-4 py-2.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSending}
                      type="submit"
                      className="bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:opacity-80 transition-opacity"
                    >
                      {isSending ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Send size={14} />
                      )}
                      Send Request
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER ACTIONS ── */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/trips")}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Home size={16} /> My Trips
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-bold hover:opacity-80 transition-opacity"
          >
            Explore More <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, query, where, getDocs, orderBy, doc, updateDoc 
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination"; // ✅ Import Pagination
import {
  Loader2, Calendar, MapPin, Car, Clock, XCircle, 
  Ticket, CheckCircle, AlertTriangle, Printer, X, Edit, Save
} from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- TYPES ---
interface Booking {
  id: string;
  listingId: string;
  listingName: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: "confirmed" | "pending" | "cancelled" | "failed";
  vehicleIncluded?: boolean;
  vehicleType?: string;
  hasOpenTicket?: boolean;
  createdAt: any; 
  // Invoice Details
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  priceBreakdown?: {
    roomTotal: number;
    vehicleTotal: number;
    taxAmount: number;
    discountAmount: number;
    grandTotal: number;
  };
}

const ITEMS_PER_PAGE = 5;

export default function TripsPage() {
  const router = useRouter();
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newDates, setNewDates] = useState<DateRange | undefined>();
  
  // Action State
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // --- 1. FETCH TRIPS ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login?redirect=/trips");
        return;
      }

      try {
        const q = query(
          collection(db, "bookings"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[];

        setBookings(data);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // --- 2. PAGINATION HELPERS ---
  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBookings = bookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- 3. ACTIONS ---
  
  // Cancel Logic
  const handleCancel = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This cannot be undone.")) return;

    setCancellingId(bookingId);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
      } else {
        alert("Failed to cancel. Contact support.");
      }
    } catch (error) {
      alert("Error processing cancellation");
    } finally {
      setCancellingId(null);
    }
  };

  // Reschedule Logic
  const openReschedule = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setRescheduleBooking(booking);
    // Pre-fill calendar with existing dates
    setNewDates({
      from: parseISO(booking.checkIn),
      to: parseISO(booking.checkOut)
    });
  };

  const confirmReschedule = async () => {
    if (!rescheduleBooking || !newDates?.from || !newDates?.to) return;
    setUpdating(true);

    try {
      const newCheckIn = format(newDates.from, "yyyy-MM-dd");
      const newCheckOut = format(newDates.to, "yyyy-MM-dd");

      // 1. Update Firebase
      await updateDoc(doc(db, "bookings", rescheduleBooking.id), {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        status: "confirmed" // Reset status if it was pending/failed
      });

      // 2. Update Local State
      setBookings(prev => prev.map(b => 
        b.id === rescheduleBooking.id 
          ? { ...b, checkIn: newCheckIn, checkOut: newCheckOut, status: "confirmed" } 
          : b
      ));

      setRescheduleBooking(null);
      alert("Trip rescheduled successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to reschedule. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin text-rose-600" size={32} /></div>;

  // --- 4. EMPTY STATE ---
  if (bookings.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-black">
        <Navbar variant="default" />
        <div className="max-w-4xl mx-auto px-4 pt-40 text-center">
          <div className="bg-white dark:bg-gray-900 p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><MapPin size={32} /></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No trips booked... yet!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Time to dust off your bags and start planning your next adventure.</p>
            <button onClick={() => router.push("/")} className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold hover:opacity-80 transition-opacity">Start Exploring</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 print:bg-white print:p-0">
      <div className="print:hidden"><Navbar variant="default" /></div>

      <div className="max-w-4xl mx-auto px-4 pt-32 print:pt-0 print:max-w-none">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8 print:hidden">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Trips</h1>
            <button className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
                <Calendar size={16} className="text-gray-400"/> Filter Date
            </button>
        </div>

        {/* BOOKINGS LIST (Paginated) */}
        <div className="space-y-6 print:hidden">
          {currentBookings.map((booking) => {
            const checkOutDate = parseISO(booking.checkOut);
            const isCancelled = booking.status === "cancelled";
            const isFailed = booking.status === "failed";
            const isCompleted = !isCancelled && !isFailed && isPast(checkOutDate) && !isToday(checkOutDate);
            const canCancel = !isCancelled && !isFailed && !isCompleted;

            return (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className={`group bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-6 relative overflow-hidden ${isCancelled || isFailed ? 'opacity-75 border-gray-200 bg-gray-50 dark:bg-gray-900/50' : 'border-gray-200 dark:border-gray-800'}`}
              >
                {/* Image & Badge */}
                <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                  <img src={booking.listingImage || "/placeholder.jpg"} className={`w-full h-full object-cover transition-transform duration-500 ${!isCancelled && 'group-hover:scale-105'} ${isCompleted && 'grayscale'}`} />
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isCancelled ? 'bg-red-500 text-white' : isCompleted ? 'bg-gray-600 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {isCancelled ? "Cancelled" : isCompleted ? "Completed" : "Confirmed"}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{booking.listingName}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {isCancelled ? <span className="text-red-500 text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Cancelled</span> : 
                         !isCompleted && <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Clock size={12} /> Upcoming</span>}
                        {booking.hasOpenTicket && !isCancelled && <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> Request Pending</span>}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{format(parseISO(booking.checkIn), "dd MMM")}</span>
                    <span className="text-gray-300 dark:text-gray-600 mx-1">→</span>
                    <span>{format(parseISO(booking.checkOut), "dd MMM yyyy")}</span>
                  </div>

                  {/* Vehicle Badge */}
                  {booking.vehicleIncluded && !isCancelled && !isFailed && (
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 w-fit px-3 py-1.5 rounded-lg mb-4">
                      <Car size={14} />
                      <span>Includes {booking.vehicleType || "Vehicle"}</span>
                    </div>
                  )}

                  {/* BUTTONS */}
                  <div className="flex flex-wrap gap-3 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 sm:border-0 sm:pt-0">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-black dark:hover:bg-gray-200 transition-colors">
                      <Ticket size={14} /> {isCompleted ? "Invoice" : "Details"}
                    </button>

                    {canCancel && (
                        <>
                            <button onClick={(e) => openReschedule(e, booking)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <Edit size={14} /> Reschedule
                            </button>
                            <button onClick={(e) => handleCancel(e, booking.id)} disabled={cancellingId === booking.id} className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                                {cancellingId === booking.id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />} Cancel
                            </button>
                        </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- PAGINATION --- */}
        <Pagination 
            currentPage={currentPage}
            totalItems={bookings.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            className="mt-12"
        />

      </div>

      {/* --- INVOICE MODAL --- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:static">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setSelectedBooking(null)}></div>
          <div className="relative bg-white dark:bg-black w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:w-full print:max-w-none">
            <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-6 flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-widest">Invoice</h2>
                <div className="text-gray-400 dark:text-gray-600 text-sm mt-1 print:text-gray-600">ID: #{selectedBooking.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl">Shubh Yatra</div>
                <div className="text-xs text-gray-400 dark:text-gray-600 print:text-gray-600">Mathura, UP, India</div>
              </div>
            </div>
            <div className="p-8 overflow-y-auto print:overflow-visible">
               <div className="flex justify-between mb-8 pb-8 border-b border-dashed border-gray-200 dark:border-gray-800">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Billed To</div>
                    {/* ✅ NAME FIX */}
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedBooking.userName || auth.currentUser?.displayName || "Guest User"}</div>
                    <div className="text-sm text-gray-500">{selectedBooking.userEmail || auth.currentUser?.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Property</div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedBooking.listingName}</div>
                    <div className="text-sm text-gray-500">{format(parseISO(selectedBooking.checkIn), "dd MMM")} - {format(parseISO(selectedBooking.checkOut), "dd MMM, yyyy")}</div>
                  </div>
               </div>
               
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between font-bold text-sm border-b dark:border-gray-800 pb-2 text-gray-900 dark:text-white">
                     <span>Description</span>
                     <span>Amount</span>
                  </div>
                  {/* Detailed Breakdown */}
                  {selectedBooking.priceBreakdown ? (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Room Charges</span>
                            <span>₹{selectedBooking.priceBreakdown.roomTotal?.toLocaleString('en-IN')}</span>
                        </div>
                        {selectedBooking.vehicleIncluded && (
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                <span>Vehicle Rental</span>
                                <span>₹{selectedBooking.priceBreakdown.vehicleTotal?.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>Taxes & Fees</span>
                            <span>₹{selectedBooking.priceBreakdown.taxAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        {selectedBooking.priceBreakdown.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-bold">
                                <span>Discount</span>
                                <span>- ₹{selectedBooking.priceBreakdown.discountAmount?.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                      </>
                  ) : (
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                         <span>Consolidated Charges</span>
                         <span>₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                  )}
               </div>
               <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex justify-between items-center print:bg-transparent print:border-t-2 print:border-black print:rounded-none">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">Grand Total</span>
                  <span className="font-extrabold text-2xl text-rose-600 dark:text-rose-500 print:text-black">₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</span>
               </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 print:hidden">
              <button onClick={() => setSelectedBooking(null)} className="px-6 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white">Close</button>
              <button onClick={handlePrint} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold flex items-center gap-2 hover:opacity-80 transition-opacity"><Printer size={18} /> Print</button>
            </div>
            <button onClick={() => setSelectedBooking(null)} className="absolute top-4 right-4 text-white dark:text-black hover:text-rose-500 transition-colors print:hidden"><X size={24} /></button>
          </div>
        </div>
      )}

      {/* --- RESCHEDULE MODAL --- */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRescheduleBooking(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
             <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reschedule Booking</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select new dates for your stay at <b>{rescheduleBooking.listingName}</b>.</p>
             <div className="flex justify-center mb-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <DayPicker
                  mode="range"
                  selected={newDates}
                  onSelect={setNewDates}
                  disabled={{ before: new Date() }}
                  modifiersClassNames={{
                    selected: "bg-rose-600 text-white",
                    day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"
                  }}
                />
             </div>
             <div className="flex gap-3">
               <button onClick={() => setRescheduleBooking(null)} className="flex-1 py-3 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
               <button onClick={confirmReschedule} disabled={updating || !newDates?.from || !newDates?.to} className="flex-1 py-3 font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                 {updating ? <Loader2 className="animate-spin" /> : <Save size={18} />} Confirm
               </button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}
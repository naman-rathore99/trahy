"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  getFirestore, collection, query, where, getDocs, doc, updateDoc
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination";
import {
  Loader2, Calendar, MapPin, Car, Clock, XCircle,
  Ticket, AlertTriangle, Printer, X, Edit, Save, BedDouble,
  LayoutGrid
} from "lucide-react";
import { format, parseISO, isPast, isToday, isValid } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- TYPES ---
interface Booking {
  id: string;
  sourceCollection: "bookings" | "vehicle_bookings"; // To know where to update/cancel

  // Normalized Fields (Used for UI)
  listingName: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  serviceType: "hotel" | "vehicle_only";

  status: "confirmed" | "pending" | "cancelled" | "failed";

  // Original Data (Kept for reference/invoices)
  vehicleType?: string;
  vehicleIncluded?: boolean; // For Hotel+Cab combo
  userName?: string;
  userEmail?: string;
  priceBreakdown?: any;
  createdAt: any;
}

const ITEMS_PER_PAGE = 5;

export default function TripsPage() {
  const router = useRouter();
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "hotels" | "vehicles">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newDates, setNewDates] = useState<DateRange | undefined>();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // --- 1. FETCH TRIPS (FROM BOTH COLLECTIONS) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login?redirect=/trips");
        return;
      }

      try {
        setLoading(true);

        // A. Query Hotels (and legacy mixed data)
        const hotelQuery = query(
          collection(db, "bookings"),
          where("userId", "==", currentUser.uid)
        );

        // B. Query New Vehicles Collection
        const vehicleQuery = query(
          collection(db, "vehicle_bookings"),
          where("userId", "==", currentUser.uid)
        );

        // C. Run both in parallel
        const [hotelSnapshot, vehicleSnapshot] = await Promise.all([
          getDocs(hotelQuery),
          getDocs(vehicleQuery)
        ]);

        // D. Process Hotels
        const hotelData = hotelSnapshot.docs.map((doc) => {
          const d = doc.data();
          // Handle legacy mixed data in 'bookings'
          const isLegacyVehicle = d.type === 'vehicle' || (d.serviceType || '').includes('vehicle');

          return {
            id: doc.id,
            sourceCollection: "bookings",
            ...d,
            // Normalize
            listingName: d.listingName || d.vehicleName || "Unnamed Booking",
            listingImage: d.listingImage || d.vehicleImage || "/placeholder.jpg",
            checkIn: d.checkIn || d.startDate,
            checkOut: d.checkOut || d.endDate,
            totalAmount: d.totalAmount || d.totalPrice || 0,
            serviceType: isLegacyVehicle ? "vehicle_only" : "hotel",
          };
        });

        // E. Process New Vehicles
        const vehicleData = vehicleSnapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            sourceCollection: "vehicle_bookings",
            ...d,
            // Normalize
            listingName: d.vehicleName || "Unnamed Vehicle",
            listingImage: d.vehicleImage || "/placeholder.jpg", // Add a vehicle placeholder if needed
            checkIn: d.startDate,
            checkOut: d.endDate,
            totalAmount: d.totalPrice || 0,
            serviceType: "vehicle_only",
          };
        });

        // F. Merge & Sort
        const allTrips = [...hotelData, ...vehicleData] as Booking[];

        allTrips.sort((a, b) => {
          const getSeconds = (t: any) => {
            if (!t) return 0;
            if (typeof t === 'string') return new Date(t).getTime();
            if (t.seconds) return t.seconds * 1000;
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

  // --- 2. FILTER & PAGINATION ---
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "hotels") return b.serviceType === "hotel";
    if (activeTab === "vehicles") return b.serviceType === "vehicle_only";
    return true;
  });

  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentBookings = filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- 3. ACTIONS ---
  const handleCancel = async (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    setCancellingId(booking.id);

    try {
      // NOTE: You might need to update your API to accept "collectionName"
      // For now, we update client-side directly or call your existing API
      // Here is a direct firestore update for safety:

      await updateDoc(doc(db, booking.sourceCollection, booking.id), {
        status: "cancelled"
      });

      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "cancelled" } : b));
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
        setNewDates({
          from: parseISO(booking.checkIn),
          to: parseISO(booking.checkOut)
        });
      }
    } catch (e) { console.error("Invalid date format", e); }
  };

  const confirmReschedule = async () => {
    if (!rescheduleBooking || !newDates?.from || !newDates?.to) return;
    setUpdating(true);
    try {
      const newStart = format(newDates.from, "yyyy-MM-dd");
      const newEnd = format(newDates.to, "yyyy-MM-dd");

      const isVehicleCollection = rescheduleBooking.sourceCollection === "vehicle_bookings";
      const isLegacyVehicle = rescheduleBooking.serviceType === "vehicle_only";

      // Map fields based on source collection
      const updateData = (isVehicleCollection || isLegacyVehicle)
        ? { startDate: newStart, endDate: newEnd, status: "confirmed" }
        : { checkIn: newStart, checkOut: newEnd, status: "confirmed" };

      await updateDoc(doc(db, rescheduleBooking.sourceCollection, rescheduleBooking.id), updateData);

      setBookings(prev => prev.map(b =>
        b.id === rescheduleBooking.id
          ? { ...b, checkIn: newStart, checkOut: newEnd, status: "confirmed" }
          : b
      ));

      setRescheduleBooking(null);
      alert("Rescheduled successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to reschedule.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin text-rose-600" size={32} /></div>;

  // --- RENDER HELPERS ---
  const EmptyState = () => (
    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
        {activeTab === 'hotels' ? <BedDouble size={24} /> : (activeTab === 'vehicles' ? <Car size={24} /> : <LayoutGrid size={24} />)}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">No {activeTab === 'all' ? 'trips' : activeTab} found</h3>
      <p className="text-sm text-gray-500">Time to book something new!</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 print:bg-white print:p-0">
      <div className="print:hidden"><Navbar variant="default" /></div>
      <div className="max-w-4xl mx-auto px-4 pt-32 print:pt-0 print:max-w-none">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">My Trips</h1>
            <div className="bg-gray-200 dark:bg-gray-900 p-1 rounded-xl inline-flex gap-1">
              <button onClick={() => setActiveTab("all")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><LayoutGrid size={16} /> All</button>
              <button onClick={() => setActiveTab("hotels")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'hotels' ? 'bg-white dark:bg-gray-800 shadow text-rose-600 dark:text-rose-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><BedDouble size={16} /> Hotels</button>
              <button onClick={() => setActiveTab("vehicles")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><Car size={16} /> Vehicles</button>
            </div>
          </div>
          <button className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"><Calendar size={16} className="text-gray-400" /> Filter Date</button>
        </div>

        {/* LIST */}
        <div className="space-y-6 print:hidden">
          {filteredBookings.length === 0 ? <EmptyState /> : (
            currentBookings.map((booking) => {
              let displayStart = "Date Pending";
              let displayEnd = "Date Pending";
              let dateValid = false;

              if (booking.checkIn && booking.checkOut) {
                try {
                  const start = parseISO(booking.checkIn);
                  const end = parseISO(booking.checkOut);
                  if (isValid(start) && isValid(end)) {
                    displayStart = format(start, "dd MMM");
                    displayEnd = format(end, "dd MMM yyyy");
                    dateValid = true;
                  }
                } catch (e) { }
              }

              const isCancelled = booking.status === "cancelled";
              const isCompleted = dateValid && !isCancelled && isPast(parseISO(booking.checkOut)) && !isToday(parseISO(booking.checkOut));

              const isVehicle = booking.serviceType === "vehicle_only";
              const TypeIcon = isVehicle ? Car : BedDouble;
              const typeLabel = isVehicle ? "Vehicle Rental" : "Hotel Stay";
              const dateLabel = isVehicle ? "Pickup - Dropoff" : "Check-in - Check-out";
              const themeColor = isVehicle ? "indigo" : "rose";

              return (
                <div key={booking.id} onClick={() => setSelectedBooking(booking)} className={`group bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-6 relative overflow-hidden ${isCancelled ? 'opacity-75 border-gray-200 bg-gray-50 dark:bg-gray-900/50' : 'border-gray-200 dark:border-gray-800'}`}>
                  <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                    <img src={booking.listingImage || "/placeholder.jpg"} className={`w-full h-full object-cover transition-transform duration-500 ${!isCancelled && 'group-hover:scale-105'} ${isCompleted && 'grayscale'}`} alt={booking.listingName} />
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isCancelled ? 'bg-red-500 text-white' : isCompleted ? 'bg-gray-600 text-white' : 'bg-emerald-500 text-white'}`}>{isCancelled ? "Cancelled" : isCompleted ? "Completed" : "Confirmed"}</div>
                    <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 ${isVehicle ? 'bg-indigo-600' : 'bg-rose-600'}`}><TypeIcon size={10} /> {typeLabel}</div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{booking.listingName}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {isCancelled ? <span className="text-red-500 text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Cancelled</span> : !isCompleted && <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Clock size={12} /> Upcoming</span>}
                        </div>
                      </div>
                      <div className="hidden sm:block"><span className="text-lg font-bold text-gray-900 dark:text-white">₹{booking.totalAmount.toLocaleString('en-IN')}</span></div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                      <span className="text-[10px] font-bold uppercase text-gray-400">{dateLabel}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={16} className={`text-${themeColor}-500`} />
                        <span>{displayStart}</span>
                        <span className="text-gray-300 dark:text-gray-600 mx-1">→</span>
                        <span>{displayEnd}</span>
                      </div>
                    </div>

                    {!isVehicle && booking.vehicleIncluded && !isCancelled && (
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 w-fit px-3 py-1.5 rounded-lg mb-4 border border-amber-100 dark:border-amber-900/30"><Car size={14} /><span>Includes {booking.vehicleType || "Cab"}</span></div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 sm:border-0 sm:pt-0">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-black dark:hover:bg-gray-200 transition-colors"><Ticket size={14} /> {isCompleted ? "Invoice" : "Details"}</button>
                      {!isCancelled && !isCompleted && (
                        <>
                          <button onClick={(e) => openReschedule(e, booking)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Edit size={14} /> Reschedule</button>
                          <button onClick={(e) => handleCancel(e, booking)} disabled={cancellingId === booking.id} className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">{cancellingId === booking.id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />} Cancel</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION */}
        {filteredBookings.length > 0 && <Pagination currentPage={safeCurrentPage} totalItems={filteredBookings.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={handlePageChange} className="mt-12" />}
      </div>

      {/* MODALS */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:static">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setSelectedBooking(null)}></div>
          <div className="relative bg-white dark:bg-black w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:w-full print:max-w-none">
            <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-6 flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-widest">Invoice</h2>
                <div className="text-gray-400 dark:text-gray-600 text-sm mt-1 print:text-gray-600">ID: #{selectedBooking.id.slice(0, 8).toUpperCase()}</div>
                <div className={`inline-flex items-center gap-2 mt-2 px-2 py-1 rounded text-xs font-bold uppercase ${selectedBooking.serviceType === 'vehicle_only' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                  {selectedBooking.serviceType === 'vehicle_only' ? <Car size={14} /> : <BedDouble size={14} />}
                  {selectedBooking.serviceType === 'vehicle_only' ? 'Vehicle Rental' : 'Hotel Booking'}
                </div>
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
                  <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedBooking.userName || auth.currentUser?.displayName || "Guest User"}</div>
                  <div className="text-sm text-gray-500">{selectedBooking.userEmail || auth.currentUser?.email}</div>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-bold text-sm border-b dark:border-gray-800 pb-2 text-gray-900 dark:text-white"><span>Description</span><span>Amount</span></div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{selectedBooking.serviceType === 'vehicle_only' ? 'Rental Charges' : 'Room Charges'}</span>
                  <span>₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex justify-between items-center print:bg-transparent print:border-t-2 print:border-black print:rounded-none">
                <span className="font-bold text-lg text-gray-900 dark:text-white">Grand Total</span>
                <span className="font-extrabold text-2xl text-rose-600 dark:text-rose-500 print:text-black">₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button onClick={() => setSelectedBooking(null)} className="absolute top-4 right-4 text-white dark:text-black hover:text-rose-500 transition-colors print:hidden"><X size={24} /></button>
          </div>
        </div>
      )}

      {rescheduleBooking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRescheduleBooking(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-2"><Edit className="text-rose-600" /> Reschedule</h2>
            <div className="flex justify-center mb-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <DayPicker mode="range" selected={newDates} onSelect={setNewDates} disabled={{ before: new Date() }} modifiersClassNames={{ selected: "bg-rose-600 text-white", day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md" }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRescheduleBooking(null)} className="flex-1 py-3 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmReschedule} disabled={updating || !newDates?.from || !newDates?.to} className="flex-1 py-3 font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">{updating ? <Loader2 className="animate-spin" /> : <Save size={18} />} Confirm</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/lib/firebase";
import { getFirestore, doc, onSnapshot, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import {
    CheckCircle, Loader2, Calendar, Car, Home,
    XCircle, HelpCircle, Send, AlertTriangle, BedDouble
} from "lucide-react";
import { format, parseISO, isFuture, isValid } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function BookingSuccessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // UI States for Support/Manage
    const [showSupport, setShowSupport] = useState(false);
    const [supportMessage, setSupportMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [requestType, setRequestType] = useState<"date_change" | "general">("general");
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

    // --- 1. SMART FETCH (Handles both Collections) ---
    useEffect(() => {
        if (!id) return;
        const db = getFirestore(app);
        let unsubscribe = () => { };

        const setupListener = async () => {
            let collectionName = "bookings";
            let docRef = doc(db, "bookings", id);

            // Check Hotels first
            let snapshot = await getDoc(docRef);

            // If not in Hotels, check Vehicles
            if (!snapshot.exists()) {
                docRef = doc(db, "vehicle_bookings", id);
                snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    collectionName = "vehicle_bookings";
                } else {
                    setLoading(false);
                    return; // Not found anywhere
                }
            }

            // Real-time Listener
            unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const d = docSnap.data();

                    // Normalize Fields
                    const rawStart = d.checkIn || d.startDate;
                    const rawEnd = d.checkOut || d.endDate;
                    const rawName = d.listingName || d.vehicleName || "Unknown Booking";
                    const rawImage = d.listingImage || d.vehicleImage || "/placeholder.jpg";
                    const rawAmount = d.totalAmount || d.totalPrice;

                    const isVehicle = collectionName === 'vehicle_bookings' || d.type === 'vehicle';

                    setBooking({
                        id: docSnap.id,
                        sourceCollection: collectionName,
                        ...d,
                        listingName: rawName,
                        listingImage: rawImage,
                        checkIn: rawStart,
                        checkOut: rawEnd,
                        totalAmount: rawAmount,
                        serviceType: isVehicle ? 'vehicle_only' : 'hotel'
                    });
                }
                setLoading(false);
            });
        };

        setupListener();
        return () => unsubscribe();
    }, [id]);

    // --- HANDLERS ---
    const handleDateSelect = (range: DateRange | undefined) => {
        setSelectedRange(range);
        if (range?.from) {
            const fromStr = format(range.from, "MMM dd, yyyy");
            const toStr = range.to ? format(range.to, "MMM dd, yyyy") : "...";
            setSupportMessage(`I would like to request a date change to: ${fromStr} - ${toStr}`);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel? This action cannot be undone.")) return;
        try {
            await fetch("/api/bookings/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: id,
                    collectionName: booking?.sourceCollection
                }),
            });
        } catch (err) {
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
                    type: requestType
                }),
            });
            alert("Request sent!");
            setShowSupport(false);
            setSupportMessage("");
            setSelectedRange(undefined);
        } catch (err) {
            alert("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    if (!booking) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-white p-4 text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Booking Not Found</h2>
            <button onClick={() => router.push("/trips")} className="bg-black text-white px-6 py-2 rounded-lg font-bold mt-4">Go to My Trips</button>
        </div>
    );

    // --- DYNAMIC HEADER LOGIC ---
    const isConfirmed = booking.status === "confirmed";
    const isFailed = booking.status === "failed";
    const isPending = booking.status === "pending" || booking.status === "pending_payment";
    const isCancelled = booking.status === "cancelled";

    let HeaderIcon = CheckCircle;
    let headerColor = "bg-green-600";
    let headerTitle = "Payment Successful!";
    let headerSub = `Booking ID: #${booking.id.slice(0, 8).toUpperCase()}`;

    if (isFailed) {
        HeaderIcon = XCircle;
        headerColor = "bg-red-600";
        headerTitle = "Payment Failed";
        headerSub = "Transaction could not be completed";
    } else if (isPending) {
        HeaderIcon = AlertTriangle;
        headerColor = "bg-amber-500";
        headerTitle = "Payment Processing...";
        headerSub = "We are confirming with the bank";
    } else if (isCancelled) {
        HeaderIcon = XCircle;
        headerColor = "bg-gray-600";
        headerTitle = "Booking Cancelled";
    }

    // Helper logic
    let isUpcoming = false;
    let displayCheckIn = "TBD";
    let displayCheckOut = "TBD";
    if (booking.checkIn && booking.checkOut) {
        try {
            const start = parseISO(booking.checkIn);
            const end = parseISO(booking.checkOut);
            if (isValid(start) && isValid(end)) {
                isUpcoming = isFuture(start);
                displayCheckIn = format(start, "dd MMM");
                displayCheckOut = format(end, "dd MMM");
            }
        } catch (e) { }
    }
    const isVehicle = booking.serviceType === 'vehicle_only';
    const typeLabel = isVehicle ? "Vehicle Rental" : "Hotel Stay";

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors duration-300">
            <Navbar variant="default" />


            <div className="max-w-3xl mx-auto px-4 pt-24 md:pt-32">

                {/* DYNAMIC HEADER */}
                <div className={`rounded-3xl shadow-xl overflow-hidden mb-8 transition-colors ${isCancelled ? 'opacity-90' : ''}`}>
                    <div className={`${headerColor} p-8 text-center text-white`}>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                            <HeaderIcon size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold mb-1">{headerTitle}</h1>
                        <p className="text-white/80 text-sm">{headerSub}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 md:p-8 space-y-8">
                        {/* MAIN INFO */}
                        <div className="flex flex-col sm:flex-row gap-5 items-start border-b border-gray-100 dark:border-gray-800 pb-8">
                            <img src={booking.listingImage} className={`w-full sm:w-24 h-48 sm:h-24 object-cover rounded-xl shadow-sm ${isCancelled && 'grayscale'}`} alt="Item" />
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide mb-1 flex items-center gap-1 ${isCancelled ? 'text-gray-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {isVehicle ? <Car size={12} /> : <BedDouble size={12} />} {typeLabel}
                                </p>
                                <h2 className={`text-xl font-bold mb-2 ${isCancelled ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{booking.listingName}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
                                        <Calendar size={14} />
                                        {displayCheckIn} - {displayCheckOut}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SUB INFO (If Hotel has Vehicle) */}
                        {booking.vehicleIncluded && !isVehicle && (
                            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-xl p-4 flex gap-4 items-center">
                                <Car size={24} className="text-rose-600 dark:text-rose-400" />
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{booking.vehicleType}</p>
                                    <p className="text-xs text-rose-600 dark:text-rose-400">Included with your stay</p>
                                </div>
                            </div>
                        )}

                        {/* STATUS BADGE & TOTAL */}
                        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-6">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{Number(booking.totalAmount).toLocaleString("en-IN")}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase 
                                ${isConfirmed ? 'bg-green-100 text-green-700' : ''}
                                ${isPending ? 'bg-amber-100 text-amber-700' : ''}
                                ${isFailed ? 'bg-red-100 text-red-700' : ''}
                                ${isCancelled ? 'bg-gray-100 text-gray-500' : ''}
                            `}>
                                {booking.status.replace("_", " ")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MANAGE ACTIONS (Only if Confirmed/Pending & Upcoming) */}
                {!isCancelled && !isFailed && isUpcoming && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Manage Booking</h3>

                        {!showSupport ? (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={handleCancel} className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors flex justify-center gap-2"><XCircle size={18} /> Cancel</button>
                                <button onClick={() => { setShowSupport(true); setRequestType("date_change"); }} className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-opacity flex justify-center gap-2"><Calendar size={18} /> Change Dates</button>
                                <button onClick={() => { setShowSupport(true); setRequestType("general"); }} className="flex-1 py-3 border border-gray-200 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-center gap-2"><HelpCircle size={18} /> Help</button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm text-gray-500">{requestType === "date_change" ? "Select New Dates" : "How can we help?"}</h4>
                                    <button onClick={() => setShowSupport(false)}><XCircle size={20} className="text-gray-400 hover:text-black" /></button>
                                </div>
                                {requestType === "date_change" && (
                                    <div className="flex justify-center mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                                        <DayPicker mode="range" selected={selectedRange} onSelect={handleDateSelect} disabled={{ before: new Date() }} modifiersClassNames={{ selected: "bg-rose-600 text-white", day: "text-gray-900 dark:text-gray-100 hover:bg-gray-200 rounded-md" }} />
                                    </div>
                                )}
                                <form onSubmit={handleSupportSubmit}>
                                    <textarea className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white text-sm min-h-[80px] mb-2" placeholder={requestType === "date_change" ? "Select dates above..." : "Describe your issue..."} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowSupport(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-black">Cancel</button>
                                        <button disabled={isSending} type="submit" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">{isSending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Send</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center pb-8">
                    <button onClick={() => router.push("/trips")} className="text-gray-500 font-bold hover:text-black dark:hover:text-white flex items-center justify-center gap-2"><Home size={16} /> Back to My Trips</button>
                </div>
            </div>
        </main>
    );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import {
  Loader2, Calendar, MapPin, Car, Phone, User, CheckCircle, XCircle, Filter, MessageSquare
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Booking {
  id: string;
  listingName: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: "confirmed" | "pending" | "cancelled" | "failed";
  vehicleIncluded?: boolean;
  vehicleType?: string;
  createdAt: string;
  // Support Tickets Array
  supportTickets?: { message: string; type: string; createdAt: string }[];
  hasOpenTicket?: boolean;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "vehicle" | "queries" | "confirmed">("all");

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.push("/login"); return; }
      const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
        setLoading(false);
      });
      return () => unsubscribeSnapshot();
    });
    return () => unsubscribeAuth();
  }, [router]);

  // Filter Logic
  const filteredBookings = bookings.filter((b) => {
    if (filter === "vehicle") return b.vehicleIncluded && b.status !== 'cancelled';
    if (filter === "queries") return b.supportTickets && b.supportTickets.length > 0;
    if (filter === "confirmed") return b.status === "confirmed";
    return true;
  });

  const queryCount = bookings.filter(b => b.hasOpenTicket).length;

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar variant="default" />
      <div className="max-w-6xl mx-auto px-4 pt-32">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Booking Manager</h1>
            <p className="text-gray-500 text-sm">Monitor bookings, vehicles, and user requests.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border flex gap-4 text-sm font-bold">
            <span className="flex items-center gap-2 text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {bookings.filter(b => b.status === 'confirmed').length} Confirmed
            </span>
            <span className="flex items-center gap-2 text-blue-600">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> {queryCount} Queries
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {[
            { id: "all", label: "All" },
            { id: "vehicle", label: "Vehicle Needs", icon: <Car size={16} /> },
            { id: "queries", label: "User Queries", icon: <MessageSquare size={16} />, alert: queryCount > 0 },
            { id: "confirmed", label: "Confirmed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${filter === tab.id ? "bg-black text-white" : "bg-white border text-gray-600"}`}
            >
              {tab.icon} {tab.label}
              {tab.alert && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

              {/* MAIN INFO */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <img src={booking.listingImage} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                  <div>
                    <h3 className="font-bold text-gray-900">{booking.listingName}</h3>
                    <p className="text-xs text-gray-500">ID: #{booking.id.slice(0, 6)} • {format(parseISO(booking.checkIn), "dd MMM")} - {format(parseISO(booking.checkOut), "dd MMM")}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'}`}>
                  {booking.status}
                </span>
              </div>

              {/* --- 1. VEHICLE ALERT --- */}
              {booking.vehicleIncluded && booking.status !== 'cancelled' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-center gap-3">
                  <Car className="text-amber-600" size={20} />
                  <div>
                    <p className="text-xs font-bold text-amber-800">NEEDS VEHICLE: {booking.vehicleType}</p>
                    <p className="text-[10px] text-amber-700">Guest paid for transport package.</p>
                  </div>
                </div>
              )}

              {/* --- 2. USER QUERIES (NEW) --- */}
              {booking.supportTickets && booking.supportTickets.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 animate-in fade-in">
                  <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm">
                    <MessageSquare size={16} /> User Requests
                  </div>
                  <ul className="space-y-2">
                    {booking.supportTickets.map((ticket, idx) => (
                      <li key={idx} className="bg-white p-2 rounded border border-blue-100 text-sm text-gray-700">
                        <p className="font-medium text-blue-600 text-xs mb-1 uppercase">{ticket.type === 'date_change' ? '📅 Date Change' : '💬 General Query'}</p>
                        "{ticket.message}"
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">Reply to Guest</button>
                    <button className="text-xs font-bold border border-blue-300 text-blue-700 px-3 py-2 rounded hover:bg-white">Mark Resolved</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
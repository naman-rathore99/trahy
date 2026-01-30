"use client";

import { useEffect, useState, use } from "react";
import { apiRequest } from "@/lib/api";
import {
  Loader2,
  Printer,
  MapPin,
  Phone,
  Car,
  Building2,
  Calendar,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays, isValid } from "date-fns";

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await apiRequest(`/api/admin/bookings?id=${id}`, "GET");
        if (data.booking) {
          setBooking(data.booking);
        } else {
          setError("Invoice not found in system.");
        }
      } catch (err: any) {
        console.error("Invoice Fetch Error:", err);
        setError("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();
  }, [id]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );
  if (error || !booking)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500">
        <p className="text-xl font-bold mb-2">404 Not Found</p>
        <p>{error || "Invoice ID invalid"}</p>
      </div>
    );

  // --- SAFE DATA PARSING ---
  const isVehicle = booking.type === "Vehicle";

  const checkInDate = booking.checkIn ? parseISO(booking.checkIn) : new Date();
  const checkOutDate = booking.checkOut
    ? parseISO(booking.checkOut)
    : new Date();

  // Calculate Duration
  let duration = differenceInCalendarDays(checkOutDate, checkInDate);
  if (duration === 0) duration = 1; // Minimum 1 day

  const amount = Number(booking.amount || booking.totalAmount || 0);
  const taxRate = 0.12;
  const baseAmount = amount / (1 + taxRate);
  const taxAmount = amount - baseAmount;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black font-sans print:bg-white print:p-0">
      {/* ACTION BAR (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <div className="text-sm text-gray-500 font-mono">ID: {booking.id}</div>
        <button
          onClick={() => window.print()}
          className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition-all shadow-md"
        >
          <Printer size={18} /> Print / Save PDF
        </button>
      </div>

      {/* INVOICE PAPER */}
      <div className="max-w-3xl mx-auto bg-white shadow-2xl p-12 rounded-sm print:shadow-none print:p-0">
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-widest text-gray-900">
              Invoice
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-mono">
              #{booking.id.slice(0, 8).toUpperCase()}
            </p>
            <div
              className={`mt-4 px-3 py-1 text-xs font-bold uppercase rounded-md inline-block ${booking.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
            >
              {booking.paymentStatus || "Pending"}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-rose-600">Shubh Yatra</h2>
            <p className="text-sm text-gray-600 mt-1">
              Mathura, Uttar Pradesh, India
            </p>
            <p className="text-sm text-gray-600">support@shubhyatra.world</p>
            <p className="text-sm text-gray-600">+91 9870897086</p>
          </div>
        </div>

        {/* BILL TO & SERVICE DETAILS */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">
              Billed To
            </h3>
            <p className="font-bold text-xl text-gray-900">
              {booking.customerName || "Guest"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {booking.customerEmail}
            </p>
            <p className="text-sm text-gray-600">{booking.customerContact}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">
              {isVehicle ? "Vehicle Details" : "Property Details"}
            </h3>
            <p className="font-bold text-xl text-gray-900">
              {booking.listingName}
            </p>
            <div className="flex items-center justify-end gap-1 text-sm text-gray-600 mt-1">
              {isVehicle ? (
                <Car size={14} className="text-rose-500" />
              ) : (
                <Building2 size={14} className="text-rose-500" />
              )}
              <span>
                {isVehicle ? "Rental Service" : "Mathura / Vrindavan"}
              </span>
            </div>
          </div>
        </div>

        {/* DATES & DURATION SUMMARY */}
        <div className="bg-gray-50 rounded-xl p-6 mb-10 border border-gray-100 print:border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-200">
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-1">
                {isVehicle ? "Pickup Date" : "Check In"}
              </p>
              <p className="font-bold text-lg flex items-center justify-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                {isValid(checkInDate)
                  ? format(checkInDate, "dd MMM yyyy")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-1">
                {isVehicle ? "Dropoff Date" : "Check Out"}
              </p>
              <p className="font-bold text-lg flex items-center justify-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                {isValid(checkOutDate)
                  ? format(checkOutDate, "dd MMM yyyy")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-1">
                Duration
              </p>
              <p className="font-bold text-lg">
                {duration} {isVehicle ? "Days" : "Nights"}
              </p>
            </div>
          </div>
        </div>

        {/* LINE ITEMS */}
        <table className="w-full text-left mb-10">
          <thead className="border-b-2 border-gray-100">
            <tr>
              <th className="py-4 text-xs font-bold uppercase text-gray-400">
                Description
              </th>
              <th className="py-4 text-xs font-bold uppercase text-gray-400 text-right">
                Rate / {isVehicle ? "Day" : "Night"}
              </th>
              <th className="py-4 text-xs font-bold uppercase text-gray-400 text-right">
                Qty
              </th>
              <th className="py-4 text-xs font-bold uppercase text-gray-400 text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr>
              <td className="py-5">
                <p className="font-bold text-gray-900">
                  {isVehicle
                    ? `${booking.listingName} - Rental Charges`
                    : `${booking.listingName} - Room Charges`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isVehicle
                    ? "Vehicle rental base fare"
                    : `Accommodation for ${duration} nights`}
                </p>
              </td>
              <td className="py-5 text-right">
                ₹{(baseAmount / duration).toFixed(2)}
              </td>
              <td className="py-5 text-right">{duration}</td>
              <td className="py-5 text-right font-medium">
                ₹{baseAmount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="py-5">
                <p className="font-bold text-gray-900">Taxes & Fees</p>
                <p className="text-xs text-gray-500 mt-1">
                  GST & Service Charge @ 12%
                </p>
              </td>
              <td className="py-5 text-right">-</td>
              <td className="py-5 text-right">1</td>
              <td className="py-5 text-right font-medium">
                ₹{taxAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end mb-16">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{baseAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (12%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-200 my-3"></div>
            <div className="flex justify-between text-2xl font-bold text-gray-900">
              <span>Total</span>
              <span>₹{amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-8">
          <p className="mb-1 font-medium">
            Thank you for choosing Shubh Yatra.
          </p>
          <p>For support, call +91 9870897086 or visit shubhyatra.world</p>
        </div>
      </div>
    </div>
  );
}

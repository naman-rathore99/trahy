"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Calendar, User, ChevronRight, Moon } from "lucide-react";
import { Destination } from "@/lib/data";

interface BookingReviewModalProps {
  destination: Destination;
  roomName: string;
  pricePerNight: number; // This is the total price for ALL rooms per night

  // 👇 NEW PROPS FOR DATES
  startDate: string;
  endDate: string;
  nights: number;
  guests: number;

  onClose: () => void;
  onConfirm: () => void;
}

const BookingReviewModal = ({
  destination,
  roomName,
  pricePerNight,
  startDate,
  endDate,
  nights,
  guests,
  onClose,
  onConfirm,
}: BookingReviewModalProps) => {
  const [mounted, setMounted] = useState(false);

  // Constants
 

  // Calculate Total: (Price Per Night * Nights) + Service Fee
  const STAY_TOTAL = pricePerNight * nights;
  const GRAND_TOTAL = STAY_TOTAL 

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] h-screen w-screen text-black bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Review your trip</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Property Snippet */}
          <div className="flex gap-4 mb-6">
            <img
              src={destination.image}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
              alt="thumb"
            />
            <div>
              <h3 className="font-bold text-gray-900 leading-tight mb-1">
                {destination.title}
              </h3>
              <div className="text-xs text-gray-500 mb-2">{roomName}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} /> {destination.location}
              </div>
            </div>
          </div>

          {/* Trip Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50">
              <div className="text-xs font-bold text-gray-400 uppercase mb-1">
                Dates
              </div>
              <div className="font-semibold text-sm flex flex-col">
                <span>{startDate || "Select Date"}</span>
                <span className="text-gray-400 text-xs">to</span>
                <span>{endDate || "Select Date"}</span>
              </div>
            </div>
            <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50">
              <div className="text-xs font-bold text-gray-400 uppercase mb-1">
                Travelers
              </div>
              <div className="font-semibold text-sm flex items-center gap-2 h-full">
                <User size={16} /> {guests} Guests
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <h4 className="font-bold text-lg mb-4">Price Details</h4>
          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Moon size={14} /> {nights} Nights x ${pricePerNight}
              </span>
              <span>${STAY_TOTAL}</span>
            </div>
            <div className="flex justify-between">
              {/* <span>Service fee</span> */}
              {/* <span>${SERVICE_FEE}</span> */}
            </div>
            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Total (USD)</span>
              <span>${GRAND_TOTAL}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform active:scale-[0.98] shadow-lg shadow-black/20"
          >
            Confirm and Pay ${GRAND_TOTAL}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default BookingReviewModal;

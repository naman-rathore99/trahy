"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Upload,
  CreditCard,
  Car,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Vehicle } from "@/lib/data";

interface Props {
  vehicle: Vehicle;
  tripStart: string; // Restrict selection within trip dates
  tripEnd: string;
  onClose: () => void;
  onConfirm: (details: {
    dlNumber: string;
    aadharNumber: string;
    startDate: string;
    endDate: string;
    days: number;
  }) => void;
}

const VehicleDocumentModal = ({
  vehicle,
  tripStart,
  tripEnd,
  onClose,
  onConfirm,
}: Props) => {
  const [mounted, setMounted] = useState(false);

  // Date State
  const [rentStart, setRentStart] = useState(tripStart);
  const [rentEnd, setRentEnd] = useState(tripEnd);
  const [rentDays, setRentDays] = useState(0);

  // Availability State (Simulation)
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");

  // Document State
  const [dlNumber, setDlNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [dlImage, setDlImage] = useState<File | null>(null);
  const [aadharImage, setAadharImage] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Calculate Days & Reset Availability on Date Change
  useEffect(() => {
    if (rentStart && rentEnd) {
      const s = new Date(rentStart);
      const e = new Date(rentEnd);
      const diff = Math.ceil(
        (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
      );
      setRentDays(diff > 0 ? diff : 0);
      setAvailabilityStatus("idle"); // Reset status when dates change
    }
  }, [rentStart, rentEnd]);

  if (!mounted) return null;

  // Simulate Availability Check
  const checkAvailability = () => {
    if (rentDays <= 0) return;
    setAvailabilityStatus("checking");

    // Fake API call
    setTimeout(() => {
      // Randomly simulate booked out dates (optional logic)
      // For now, let's assume it's always available for the demo
      setAvailabilityStatus("available");
    }, 1000);
  };

  const handleSubmit = () => {
    if (availabilityStatus !== "available") {
      alert("Please check availability for these dates first.");
      return;
    }
    if (!dlNumber || !aadharNumber) {
      alert("Please enter both Driving License and Aadhaar numbers.");
      return;
    }
    onConfirm({
      dlNumber,
      aadharNumber,
      startDate: rentStart,
      endDate: rentEnd,
      days: rentDays,
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] h-screen w-screen text-black bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div
        className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Rent {vehicle.name}
            </h2>
            <p className="text-xs text-gray-500">${vehicle.price} / day</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. REAL DATE PICKER */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-blue-700" />
              <span className="font-bold text-sm text-blue-900">
                Select Dates
              </span>
            </div>

            <div className="flex gap-3">
              <div
                className="flex-1 cursor-pointer"
                onClick={(e) =>
                  e.currentTarget.querySelector("input")?.showPicker()
                }
              >
                <label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">
                  Start
                </label>
                <input
                  type="date"
                  className="w-full text-sm font-bold bg-white p-2 rounded-lg border border-blue-200 outline-none text-gray-800"
                  min={tripStart} // Cannot rent before trip starts
                  max={tripEnd}
                  value={rentStart}
                  onChange={(e) => setRentStart(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div
                className="flex-1 cursor-pointer"
                onClick={(e) =>
                  e.currentTarget.querySelector("input")?.showPicker()
                }
              >
                <label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">
                  End
                </label>
                <input
                  type="date"
                  className="w-full text-sm font-bold bg-white p-2 rounded-lg border border-blue-200 outline-none text-gray-800"
                  min={rentStart}
                  max={tripEnd} // Cannot rent after trip ends
                  value={rentEnd}
                  onChange={(e) => setRentEnd(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Availability Status Bar */}
            <div className="flex justify-between items-center pt-2">
              <div className="text-xs font-bold text-blue-900">
                Total: {rentDays} Days
              </div>

              {/* Status Button */}
              {availabilityStatus === "idle" && (
                <button
                  onClick={checkAvailability}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Check Availability
                </button>
              )}
              {availabilityStatus === "checking" && (
                <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                  <Loader2 size={14} className="animate-spin" /> Checking...
                </div>
              )}
              {availabilityStatus === "available" && (
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 size={14} /> Available
                </div>
              )}
              {availabilityStatus === "unavailable" && (
                <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-lg">
                  <AlertCircle size={14} /> Sold Out
                </div>
              )}
            </div>
          </div>

          {/* 2. Documents Section */}
          <div
            className={`space-y-4 transition-opacity duration-300 ${
              availabilityStatus === "available"
                ? "opacity-100"
                : "opacity-50 pointer-events-none"
            }`}
          >
            {/* DL Input */}
            <div className="relative">
              <FileText
                size={16}
                className="absolute left-3 top-3.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Driving License Number"
                value={dlNumber}
                onChange={(e) => setDlNumber(e.target.value)}
                className="w-full text-sm pl-10 p-3 rounded-xl border border-gray-200 outline-none focus:border-black uppercase font-medium"
              />
            </div>
            {/* Aadhaar Input */}
            <div className="relative">
              <CreditCard
                size={16}
                className="absolute left-3 top-3.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Aadhaar Number"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                className="w-full text-sm pl-10 p-3 rounded-xl border border-gray-200 outline-none focus:border-black font-medium"
              />
            </div>
          </div>

          {/* Upload Buttons */}
          <div
            className={`grid grid-cols-2 gap-3 ${
              availabilityStatus === "available"
                ? "opacity-100"
                : "opacity-50 pointer-events-none"
            }`}
          >
            <button className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Upload size={16} className="text-gray-400 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                Upload DL
              </span>
            </button>
            <button className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Upload size={16} className="text-gray-400 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                Upload ID
              </span>
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Vehicle Total ({rentDays} Days)
            </div>
            <div className="text-xl font-bold">${vehicle.price * rentDays}</div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={availabilityStatus !== "available"}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
              availabilityStatus === "available"
                ? "bg-black hover:bg-gray-800 active:scale-95"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Confirm Rental
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default VehicleDocumentModal;

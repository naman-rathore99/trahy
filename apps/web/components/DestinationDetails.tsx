"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  ArrowLeft,
  Users,
  Minus,
  Plus,
  Info,
  PartyPopper,
  Check,
  Car,
  Fuel,
  Calendar,
} from "lucide-react";
import { Destination, Vehicle } from "@/lib/data";
import BookingReviewModal from "./BookingReviewModal";
import ImageGallery from "./ImageGallery";
import VehicleDocumentModal from "./VehicleDocumentModal";

interface DestinationDetailsProps {
  destination: Destination;
  onBack: () => void;
  // Data passed from the Home Page URL
  initialData?: {
    start: string;
    end: string;
    adults: number;
    children: number;
  };
}

const DestinationDetails = ({
  destination,
  onBack,
  initialData,
}: DestinationDetailsProps) => {
  // --- 1. TRIP DATES & GUESTS STATE ---
  const [startDate, setStartDate] = useState(initialData?.start || "");
  const [endDate, setEndDate] = useState(initialData?.end || "");
  const [nights, setNights] = useState(1);

  const [adults, setAdults] = useState(initialData?.adults || 2);
  const [children, setChildren] = useState(initialData?.children || 0);
  const [showGuestPopup, setShowGuestPopup] = useState(false);

  // --- 2. SELECTION STATE ---
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [includeHall, setIncludeHall] = useState(false);

  // --- 3. VEHICLE STATE ---
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDays, setVehicleDays] = useState(0);
  const [vehStart, setVehStart] = useState("");
  const [vehEnd, setVehEnd] = useState("");

  // --- 4. MODAL STATE ---
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState<Vehicle | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // --- DATA HELPERS ---
  const rooms = destination.rooms || [];
  const galleryImages = destination.images?.length
    ? destination.images
    : [destination.image];
  const vehicles = destination.vehicles || [];

  // --- CALCULATIONS ---
  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const basePrice = currentRoom?.price || destination.price;
  const roomCapacity = currentRoom?.capacity || 2;
  const totalGuests = adults + children;

  // Logic: Auto-calculate required rooms
  const roomsNeeded = selectedRoom ? Math.ceil(totalGuests / roomCapacity) : 1;

  // Cost Breakdown
  const totalRoomCost = basePrice * nights * roomsNeeded;
  const hallPrice = includeHall ? 500 : 0;
  const vehicleCost = selectedVehicle ? selectedVehicle.price * vehicleDays : 0;

  // Grand Total
  const grandTotal = totalRoomCost + hallPrice + vehicleCost;

  // --- EFFECT: Calculate Trip Nights ---
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diff = Math.ceil(
        (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
      );
      setNights(diff > 0 ? diff : 1);
    }
  }, [startDate, endDate]);

  // --- HANDLERS ---

  // Handle Vehicle Selection (Opens Modal)
  const handleVehicleClick = (veh: Vehicle) => {
    // If clicking the already selected vehicle, deselect it
    if (selectedVehicle?.id === veh.id) {
      setSelectedVehicle(null);
      setVehicleDays(0);
      setVehStart("");
      setVehEnd("");
      return;
    }
    setPendingVehicle(veh);
    setIsVehicleModalOpen(true);
  };

  // Handle Vehicle Confirmation (Returns from Modal)
  const handleVehicleConfirm = (details: {
    dlNumber: string;
    aadharNumber: string;
    startDate: string;
    endDate: string;
    days: number;
  }) => {
    setSelectedVehicle(pendingVehicle);
    setVehicleDays(details.days);
    setVehStart(details.startDate);
    setVehEnd(details.endDate);

    setIsVehicleModalOpen(false);
    setPendingVehicle(null);
  };

  return (
    <>
      {/* --- MODAL 1: REVIEW TRIP --- */}
      {showReviewModal && (
        <BookingReviewModal
          destination={destination}
          // Create a detailed string for the receipt
          roomName={`${currentRoom?.name || "Standard"} (x${roomsNeeded}) ${
            includeHall ? "+ Hall" : ""
          } ${selectedVehicle ? `+ ${selectedVehicle.name}` : ""}`}
          pricePerNight={grandTotal}
          startDate={startDate}
          endDate={endDate}
          nights={nights}
          guests={totalGuests}
          onClose={() => setShowReviewModal(false)}
          onConfirm={() => alert("Redirecting to Payment Gateway...")}
        />
      )}

      {/* --- MODAL 2: VEHICLE DOCUMENTS --- */}
      {isVehicleModalOpen && pendingVehicle && (
        <VehicleDocumentModal
          vehicle={pendingVehicle}
          tripStart={startDate} // Pass trip dates as boundaries
          tripEnd={endDate}
          onClose={() => setIsVehicleModalOpen(false)}
          onConfirm={handleVehicleConfirm}
        />
      )}

      {/* --- MAIN PAGE LAYOUT --- */}
      <div className="min-h-screen bg-white animate-in fade-in duration-500 text-black">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-32 pb-20">
          {/* Navigation */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeft size={18} /> Back to results
          </button>

          {/* Title Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
                  {destination.title}
                </h1>
                {destination.hasBanquetHall && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1">
                    <PartyPopper size={12} /> Hall Available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={18} /> {destination.location}
                <span className="mx-2">•</span>
                <Star size={16} className="fill-black text-black" />{" "}
                <span className="text-black font-bold">
                  {destination.rating}
                </span>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <ImageGallery images={galleryImages} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {/* LEFT COLUMN: Options & Info */}
            <div className="lg:col-span-2 space-y-12">
              {/* About */}
              <section>
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {destination.description}
                </p>

                {/* B2B Hall Note */}
                {destination.hasBanquetHall && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 text-purple-900 text-sm flex gap-3">
                    <Info size={20} className="shrink-0" />
                    <p>
                      <strong>Event Planner?</strong> This property features a
                      banquet hall with a capacity of {destination.hallCapacity}{" "}
                      guests. Select it in the booking card to reserve.
                    </p>
                  </div>
                )}
              </section>

              {/* Room Selection */}
              <section>
                <h2 className="text-2xl font-bold mb-6">Select Room</h2>
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={`border rounded-2xl p-4 flex gap-4 cursor-pointer transition-all ${
                        selectedRoom === room.id
                          ? "border-black ring-1 ring-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={room.image}
                        className="w-32 h-24 rounded-lg object-cover bg-gray-200"
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold">{room.name}</h3>
                          <div className="font-bold text-lg">${room.price}</div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1 mb-2">
                          {room.type} • Fits {room.capacity}
                        </div>

                        {/* Capacity Warning */}
                        {totalGuests > room.capacity && (
                          <div className="inline-flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">
                            <Info size={10} /> Needs{" "}
                            {Math.ceil(totalGuests / room.capacity)} rooms for{" "}
                            {totalGuests} guests
                          </div>
                        )}
                      </div>
                      <div className="ml-auto flex items-center pl-2">
                        <div
                          className={`w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center ${
                            selectedRoom === room.id
                              ? "bg-black border-black"
                              : "bg-white"
                          }`}
                        >
                          {selectedRoom === room.id && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Vehicle Rental Section */}
              {vehicles.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <Car size={24} />
                    <h2 className="text-2xl font-bold">Rent a Vehicle</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.map((veh) => (
                      <div
                        key={veh.id}
                        onClick={() => handleVehicleClick(veh)}
                        className={`relative border rounded-2xl p-4 cursor-pointer transition-all group hover:shadow-md ${
                          selectedVehicle?.id === veh.id
                            ? "border-black bg-gray-900 text-white"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-lg">{veh.name}</div>
                          <div
                            className={`text-sm font-bold ${
                              selectedVehicle?.id === veh.id
                                ? "text-gray-300"
                                : "text-gray-900"
                            }`}
                          >
                            ${veh.price}/day
                          </div>
                        </div>
                        <div
                          className={`text-xs mb-3 flex items-center gap-3 ${
                            selectedVehicle?.id === veh.id
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {veh.seats} Seats
                          </span>
                          <span className="flex items-center gap-1">
                            <Fuel size={12} /> Petrol
                          </span>
                        </div>
                        <div className="h-32 w-full rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={veh.image}
                            className="w-full h-full object-cover mix-blend-multiply"
                            alt={veh.name}
                          />
                        </div>

                        {selectedVehicle?.id === veh.id && (
                          <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Check size={10} /> ADDED ({vehicleDays} Days)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Sticky Booking Card */}
            <div className="relative text-black">
              <div className="sticky top-32 bg-white rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-6">
                {/* Price Header */}
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div>
                      <h1>
                        Starting at
                      </h1>

                    </div>
                    <span className="text-3xl font-bold text-gray-900">
                      ${grandTotal}
                    </span>
                    <span className="text-gray-500 text-sm font-medium">
                      {" "}
                      total
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Per Room
                    </div>
                    <div className="font-semibold text-sm text-gray-900">
                      ${basePrice}
                    </div>
                  </div>
                </div>

                {/* Inputs Container */}
                <div className="border border-gray-200 rounded-xl mb-4 divide-y divide-gray-200">
                  {/* 1. Dates (Full Clickable Calendar) */}
                  <div className="flex">
                    <div
                      className="p-3 w-1/2 border-r border-gray-200 cursor-pointer hover:bg-gray-50"
                      onClick={(e) => {
                        e.currentTarget.querySelector("input")?.showPicker();
                      }}
                    >
                      <label className="text-[10px] font-bold text-gray-800 uppercase block mb-1">
                        Check-in
                      </label>
                      <input
                        type="date"
                        className="w-full text-sm outline-none bg-transparent font-medium cursor-pointer"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div
                      className="p-3 w-1/2 cursor-pointer hover:bg-gray-50"
                      onClick={(e) => {
                        e.currentTarget.querySelector("input")?.showPicker();
                      }}
                    >
                      <label className="text-[10px] font-bold text-gray-800 uppercase block mb-1">
                        Check-out
                      </label>
                      <input
                        type="date"
                        className="w-full text-sm outline-none bg-transparent font-medium cursor-pointer"
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* 2. Guests (Popup) */}
                  <div
                    className="relative p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setShowGuestPopup(!showGuestPopup)}
                  >
                    <label className="text-[10px] font-bold text-gray-800 uppercase block mb-1">
                      Guests
                    </label>
                    <div className="text-sm font-medium text-gray-600 flex justify-between items-center">
                      <span>
                        {adults} Adults, {children} Kids
                      </span>
                      <Users size={16} />
                    </div>

                    {/* Guest Dropdown */}
                    {showGuestPopup && (
                      <div
                        className="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl rounded-xl p-4 z-50 border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-sm">Adults</span>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus size={12} />
                            </button>
                            <span>{adults}</span>
                            <button
                              onClick={() => setAdults(adults + 1)}
                              className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">Children</span>
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                setChildren(Math.max(0, children - 1))
                              }
                              className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus size={12} />
                            </button>
                            <span>{children}</span>
                            <button
                              onClick={() => setChildren(children + 1)}
                              className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right mt-3">
                          <button
                            onClick={() => setShowGuestPopup(false)}
                            className="text-xs font-bold underline"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- HALL TOGGLE --- */}
                {destination.hasBanquetHall && (
                  <div
                    className={`mb-4 p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                      includeHall
                        ? "bg-purple-50 border-purple-500"
                        : "border-gray-200 hover:border-purple-200"
                    }`}
                    onClick={() => setIncludeHall(!includeHall)}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        includeHall
                          ? "bg-purple-600 border-purple-600"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {includeHall && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <div className="text-sm">
                      <span
                        className={`font-bold block ${
                          includeHall ? "text-purple-900" : "text-gray-900"
                        }`}
                      >
                        Add Banquet Hall
                      </span>
                      <span className="text-xs text-gray-500">
                        +$500 Flat Fee
                      </span>
                    </div>
                  </div>
                )}

                {/* --- SELECTED VEHICLE SUMMARY --- */}
                {selectedVehicle && (
                  <div className="mb-4 p-3 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between text-blue-800">
                    <div className="text-sm font-bold flex items-center gap-2">
                      <Car size={16} /> {selectedVehicle.name}
                    </div>
                    <div className="text-xs font-bold">
                      ${selectedVehicle.price * vehicleDays}
                    </div>
                  </div>
                )}

                {/* --- MAIN ACTION BUTTON --- */}
                <button
                  disabled={!selectedRoom}
                  onClick={() => setShowReviewModal(true)}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                    !selectedRoom
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                      : "bg-black hover:bg-gray-800 shadow-black/20"
                  }`}
                >
                  {selectedRoom
                    ? `Reserve ${roomsNeeded} Room${roomsNeeded > 1 ? "s" : ""}`
                    : "Select a Room"}
                </button>

                {/* --- FINAL PRICE BREAKDOWN --- */}
                <div className="mt-4 flex flex-col gap-1 border-t pt-3 text-xs text-gray-500">
                  {selectedRoom ? (
                    <>
                      <div className="flex justify-between">
                        <span>
                          Rooms ({roomsNeeded} x ${basePrice} x {nights}n)
                        </span>
                        <span>${totalRoomCost}</span>
                      </div>
                      {includeHall && (
                        <div className="flex justify-between text-purple-700 font-medium">
                          <span>Banquet Hall Fee</span>
                          <span>${hallPrice}</span>
                        </div>
                      )}
                      {selectedVehicle && (
                        <div className="flex justify-between text-blue-700 font-medium">
                          <div className="flex flex-col">
                            <span>
                              {selectedVehicle.name} ({vehicleDays} days)
                            </span>
                            <span className="text-[10px] text-blue-400">
                              {vehStart} to {vehEnd}
                            </span>
                          </div>
                          <span>${vehicleCost}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-black border-t border-dashed pt-2 mt-2">
                        <span>Total</span>
                        <span>${grandTotal}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-center">You won't be charged yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DestinationDetails;

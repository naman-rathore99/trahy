"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // 🚨 Adjust your firebase import path
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Car,
  Bike,
  Zap,
  Users,
  CarFront,
  MapPin,
  Loader2,
  Save,
  CheckCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PricingManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // --- THE MASTER PRICING STATE ---
  const [pricing, setPricing] = useState({
    transferBase: 800,
    bike: 400,
    auto: 800,
    cab: 2000,
    suv: 3000,
    selfDrive: 2500,
  });

  // 1. Fetch current prices from Firebase
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const docRef = doc(db, "settings", "pricing");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPricing(docSnap.data() as any);
        } else {
          // Create default if it doesn't exist
          await setDoc(docRef, pricing);
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  // 2. Save new prices to Firebase
  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const docRef = doc(db, "settings", "pricing");
      await setDoc(docRef, pricing, { merge: true });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving pricing:", error);
      alert("Failed to save prices.");
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (key: keyof typeof pricing, value: string) => {
    setPricing((prev) => ({
      ...prev,
      [key]: Number(value) || 0,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#09090B]">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-gray-100 transition-colors pb-20">
      <Navbar variant="default" />

      <div className="max-w-4xl mx-auto px-4 pt-32">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">
              Master Pricing
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Update flat fees for fleet and transfers across the platform.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70 w-full md:w-auto"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle size={18} />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving..." : savedSuccess ? "Saved!" : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- 1. ONE-WAY TRANSFERS --- */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4 text-gray-900 dark:text-white">
              <MapPin className="text-rose-600" size={20} /> One-Way Transfers
            </h2>

            <div>
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Station/Airport Pickup Base Fare
              </label>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1F2937] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-rose-500 transition-colors">
                <span className="font-black text-gray-400 dark:text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  value={pricing.transferBase}
                  onChange={(e) =>
                    handlePriceChange("transferBase", e.target.value)
                  }
                  className="bg-transparent font-black text-xl outline-none w-full text-gray-900 dark:text-white"
                />
              </div>
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                  This is the flat fee added to Hotel Bookings when a user
                  toggles "Add Arrival Transfer". Fleet managers will negotiate
                  the remainder directly if the hotel is out of limits.
                </p>
              </div>
            </div>
          </div>

          {/* --- 2. DAILY RENTALS --- */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4 text-gray-900 dark:text-white">
              <CarFront className="text-rose-600" size={20} /> Daily Fleet
              Rentals
            </h2>

            <div className="space-y-4">
              {[
                { id: "bike", label: "2-Wheeler / Scooty", icon: Bike },
                { id: "auto", label: "Auto Rickshaw", icon: Zap },
                { id: "cab", label: "Standard Cab", icon: Car },
                { id: "suv", label: "Premium SUV", icon: Users },
                { id: "selfDrive", label: "Self-Drive Car", icon: CarFront },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-[#1F2937] rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
                      <item.icon
                        size={18}
                        className="text-gray-600 dark:text-gray-400"
                      />
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1F2937] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 w-32 focus-within:border-rose-500 transition-colors">
                    <span className="font-black text-gray-400 dark:text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={(pricing as any)[item.id]}
                      onChange={(e) =>
                        handlePriceChange(
                          item.id as keyof typeof pricing,
                          e.target.value,
                        )
                      }
                      className="bg-transparent font-bold outline-none w-full text-gray-900 dark:text-white text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

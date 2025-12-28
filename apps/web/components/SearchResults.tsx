"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Filter, X, Check, SlidersHorizontal } from "lucide-react";
import { Destination } from "@/lib/data";

interface SearchResultsProps {
  results: Destination[];
  onBack: () => void;
  onItemClick: (dest: Destination) => void;
}

const AMENITY_OPTIONS = [
  "Wifi",
  "Pool",
  "Gym",
  "Air conditioning",
  "Spa",
  "Kitchen",
];

const SearchResults = ({
  results,
  onBack,
  onItemClick,
}: SearchResultsProps) => {
  // --- STATE ---
  const [displayedResults, setDisplayedResults] =
    useState<Destination[]>(results);

  // Filter States
  const [priceMax, setPriceMax] = useState(1000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let filtered = results.filter((item) => {
      // 1. Price Check
      const matchesPrice = item.price <= priceMax;

      // 2. Amenities Check (Must have ALL selected)
      const matchesAmenities = selectedAmenities.every((amenity) =>
        (item.amenities || []).includes(amenity)
      );

      return matchesPrice && matchesAmenities;
    });
    setDisplayedResults(filtered);
  }, [priceMax, selectedAmenities, results]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  // --- REUSABLE FILTER COMPONENT ---
  const FilterContent = () => (
    <div className="space-y-8">
      {/* Price Slider */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Max Price</h3>
          <span className="text-sm font-bold text-gray-500">${priceMax}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>$0</span>
          <span>$1000+</span>
        </div>
      </div>

      <div className="h-px bg-gray-100"></div>

      {/* Amenities */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Amenities</h3>
        <div className="space-y-3">
          {AMENITY_OPTIONS.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity);
            return (
              <div
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-black border-black text-white"
                      : "bg-white border-gray-300 group-hover:border-gray-400"
                  }`}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span
                  className={`text-sm ${
                    isSelected ? "text-gray-900 font-medium" : "text-gray-500"
                  }`}
                >
                  {amenity}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={() => {
          setPriceMax(1000);
          setSelectedAmenities([]);
        }}
        className="w-full py-3 text-sm font-bold text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] pt-24 pb-10 px-4 md:px-8">
      {/* --- HEADER --- */}
      <div className="max-w-[1400px] mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-20 z-30 bg-[#F8F9FB]/90 backdrop-blur-sm py-2">
        <button
          onClick={onBack}
          className="text-gray-500 font-medium hover:text-black flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-400 uppercase hidden md:block">
            Found {displayedResults.length} Results
          </span>

          {/* MOBILE FILTER BUTTON (Visible on Small Screens) */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm text-sm font-bold"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* --- DESKTOP SIDEBAR (Visible on LG screens) --- */}
        <div className="hidden lg:block bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 h-fit sticky top-32">
          <FilterContent />
        </div>

        {/* --- MOBILE FILTER DRAWER (Overlay) --- */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileFilterOpen(false)}
            ></div>

            {/* Drawer */}
            <div className="relative bg-white w-full max-w-xs h-full p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Filters</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <FilterContent />
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full mt-8 py-4 bg-black text-white rounded-xl font-bold"
              >
                Show {displayedResults.length} Results
              </button>
            </div>
          </div>
        )}

        {/* --- RESULTS GRID --- */}
        <div className="lg:col-span-3 space-y-6">
          {displayedResults.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
              <div className="text-gray-400 font-medium">
                No destinations found matching your filters.
              </div>
              <button
                onClick={() => {
                  setPriceMax(1000);
                  setSelectedAmenities([]);
                }}
                className="mt-4 text-black font-bold underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            displayedResults.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer group"
              >
                <div className="w-full md:w-72 h-64 md:h-52 rounded-3xl overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={item.title}
                  />
                </div>

                <div className="flex-grow flex flex-col justify-between py-2 pr-2">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <div className="font-bold text-lg">${item.price}</div>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                      <MapPin size={14} /> {item.location}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {(item.amenities || []).slice(0, 4).map((am) => (
                        <span
                          key={am}
                          className="text-[10px] bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-bold text-gray-500 uppercase tracking-wide"
                        >
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 pt-4 border-t border-gray-50">
                    <button className="bg-black text-white px-8 py-3 rounded-xl font-bold text-sm group-hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                      View Deal
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;

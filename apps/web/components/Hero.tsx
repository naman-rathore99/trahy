"use client";
import React, { useState, useEffect, useRef } from "react";
import "react-day-picker/dist/style.css";
import { DayPicker, DateRange } from "react-day-picker";
import { format, parseISO, isValid } from "date-fns";

import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import { Destination } from "@/lib/data"; // Removed 'allDestinations' import since we use props now

interface HeroProps {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  setAdults: (val: number) => void;
  setChildren: (val: number) => void;
  onSearch: (query: string) => void;
  data: Destination[]; // Receiving real data from Home
}

const Hero = ({
  startDate,
  endDate,
  adults,
  children,
  setStartDate,
  setEndDate,
  setAdults,
  setChildren,
  onSearch,
  data = [], // Default to empty array
}: HeroProps) => {
  const [query, setQuery] = useState("");
  const [totalDays, setTotalDays] = useState(0);

  // UI Toggles
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);

  // 1. Calendar Logic
  const selectedRange: DateRange | undefined = {
    from: startDate ? parseISO(startDate) : undefined,
    to: endDate ? parseISO(endDate) : undefined,
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      setStartDate(format(range.from, "yyyy-MM-dd"));
    } else {
      setStartDate("");
    }
    if (range?.to) {
      setEndDate(format(range.to, "yyyy-MM-dd"));
    } else {
      setEndDate("");
    }
  };

  // 2. Calculate Total Days
  useEffect(() => {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (isValid(start) && isValid(end)) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTotalDays(diffDays);
      }
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  // 3. Search Suggestion Logic (FIXED)
  useEffect(() => {
    if (query.length < 2) {
      setShowSuggestions(false);
      return;
    }

    // FIX: Use 'data' prop instead of 'allDestinations'
    const matches = data.filter(
      (d) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.location.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(matches);
    setShowSuggestions(true);
  }, [query, data]); // Added 'data' to dependency array

  // 4. Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-[1400px] mx-auto p-4 z-10">
      <div className="relative h-[85vh] w-full">
        {/* Background Image */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden -z-10">
          <img
            src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2600&auto=format&fit=crop"
            className="w-full h-full object-cover"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 pt-20">
          <h1 className="text-4xl md:text-7xl font-medium text-white mb-8 drop-shadow-lg leading-tight">
            Where every journey <br /> becomes an adventure.
          </h1>

          <div className="bg-white rounded-[2rem] p-3 shadow-2xl w-full max-w-4xl relative z-50">
            <div className="flex flex-col lg:flex-row items-center gap-2">
              {/* --- Location Input --- */}
              <div className="flex items-center gap-3 flex-1 w-full px-4 py-2 border-b lg:border-b-0 lg:border-r border-gray-200">
                <MapPin className="text-gray-400 shrink-0" size={20} />
                <div className="text-left w-full">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Where to?"
                    className="outline-none text-gray-900 font-bold w-full text-sm bg-transparent placeholder-gray-300"
                  />
                </div>
              </div>

              {/* --- Date Picker --- */}
              <div
                className="flex items-center gap-3 flex-[1.5] w-full px-4 py-2 border-b lg:border-b-0 lg:border-r border-gray-200 cursor-pointer relative"
                onClick={() => setShowCalendar(true)}
              >
                <CalendarIcon className="text-gray-400 shrink-0" size={20} />
                <div className="flex gap-4 w-full">
                  <div className="flex-1 relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Check In
                    </label>
                    <div className="font-bold text-sm text-gray-900">
                      {startDate
                        ? format(parseISO(startDate), "MMM dd, yyyy")
                        : "Add Date"}
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Check Out
                    </label>
                    <div className="font-bold text-sm text-gray-900">
                      {endDate
                        ? format(parseISO(endDate), "MMM dd, yyyy")
                        : "Add Date"}
                    </div>
                  </div>
                </div>

                {showCalendar && (
                  <div
                    ref={calendarRef}
                    className="absolute top-full left-0 mt-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 z-[60]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DayPicker
                      mode="range"
                      selected={selectedRange}
                      onSelect={handleRangeSelect}
                      min={1}
                      numberOfMonths={2}
                      disabled={{ before: new Date() }}
                      modifiersClassNames={{
                        selected: "bg-black text-white hover:bg-black",
                        range_middle: "bg-gray-100 text-black",
                        today: "text-blue-500 font-bold",
                      }}
                      styles={{ caption: { color: "#000" } }}
                    />
                  </div>
                )}
              </div>

              {/* --- Guests Input --- */}
              <div
                className="relative flex-1 w-full px-4 py-2 cursor-pointer group"
                onClick={() => setShowGuestPopup(!showGuestPopup)}
              >
                <div className="flex items-center gap-3">
                  <Users className="text-gray-400 shrink-0" size={20} />
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Travelers
                    </label>
                    <div className="font-bold text-sm text-gray-900 truncate">
                      {adults + children} Guests
                      {totalDays > 0 && (
                        <span className="text-gray-400 font-normal ml-1">
                          • {totalDays} Days
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {showGuestPopup && (
                  <div
                    className="absolute top-full left-0 mt-4 bg-white shadow-xl rounded-2xl p-6 w-72 z-[60] border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-gray-900">Adults</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdults(Math.max(1, adults - 1));
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Minus size={14} className="text-black" />
                        </button>
                        <span className="w-4 text-center text-black">
                          {adults}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdults(adults + 1);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Plus size={14} className="text-black" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Children</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChildren(Math.max(0, children - 1));
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Minus size={14} className="text-black" />
                        </button>
                        <span className="w-4 text-center text-black">
                          {children}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChildren(children + 1);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black"
                        >
                          <Plus size={14} className="text-black" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                onClick={() => onSearch(query)}
                className="bg-black text-white rounded-[1.5rem] px-8 py-4 flex items-center gap-2 hover:bg-gray-800 transition-transform active:scale-95 shadow-lg shadow-black/20"
              >
                <Search size={20} />
                <span className="font-bold">Search</span>
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full md:w-[40%] bg-white rounded-2xl shadow-xl overflow-hidden z-[100]">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setQuery(s.title);
                      setShowSuggestions(false);
                      onSearch(s.title); // Auto search on click
                    }}
                    className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4 border-b border-gray-100"
                  >
                    <img
                      src={s.image}
                      className="w-12 h-12 rounded-lg object-cover"
                      alt=""
                    />
                    <div className="text-left">
                      <div className="font-bold text-sm text-gray-900">
                        {s.title}
                      </div>
                      <div className="text-xs text-gray-500">{s.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

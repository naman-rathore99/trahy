"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DestinationSection from "@/components/DestinationSection";
import SearchResults from "@/components/SearchResults";
import { Destination } from "@/lib/data";
import { apiRequest } from "@/lib/api";

type View = "home" | "search";

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");

  // --- REAL DATA STATE ---
  const [hotels, setHotels] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredResults, setFilteredResults] = useState<Destination[]>([]);

  // --- SEARCH STATE ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // 1. FETCH APPROVED PROPERTIES ON LOAD
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        // Fetch public approved hotels (Guests allowed)
        const data = await apiRequest("/api/hotels", "GET");

        // Map Backend Data to UI Data
        const mappedHotels: Destination[] = data.hotels.map((h: any) => ({
          id: h.id,
          title: h.name,
          location: h.location,
          price: h.pricePerNight,
          image:
            h.imageUrl ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          description: h.description,
          rating: 4.8,
          reviews: 12,
        }));

        setHotels(mappedHotels);
        setFilteredResults(mappedHotels);
      } catch (err) {
        console.error("Failed to load hotels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // 2. HANDLE SEARCH
  const handleSearch = (query: string) => {
    const results = hotels.filter(
      (d) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredResults(results);
    setView("search");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemClick = (dest: Destination) => {
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    params.set("adults", adults.toString());
    params.set("children", children.toString());
    router.push(`/destinations/${dest.id}?${params.toString()}`);
  };

  // --- VIEW: SEARCH RESULTS ---
  if (view === "search") {
    return (
      <main>
        <div className="relative z-50">
          <Navbar />
        </div>
        <SearchResults
          results={filteredResults}
          onBack={() => setView("home")}
          onItemClick={handleItemClick}
        />
      </main>
    );
  }

  // --- VIEW: HOME (Default) ---
  return (
    <main className="bg-white min-h-screen">
      {/* 1. Navbar */}
      <div className="relative z-50">
        <Navbar variant="transparent" />
      </div>

      {/* 2. Hero Section (With Real Suggestions) */}
      <Hero
        startDate={startDate}
        endDate={endDate}
        adults={adults}
        children={children}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setAdults={setAdults}
        setChildren={setChildren}
        onSearch={handleSearch}
        data={hotels}
      />

      {/* 3. Listings Section */}
      {loading ? (
        <div className="p-20 text-center text-gray-500">
          Loading amazing stays...
        </div>
      ) : (
        <DestinationSection
          destinations={hotels}
          onItemClick={handleItemClick}
        />
      )}
    </main>
  );
}

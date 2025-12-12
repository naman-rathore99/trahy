"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero"; // *Note: See Step 2 below
import DestinationSection from "@/components/DestinationSection";
import SearchResults from "@/components/SearchResults";
import { Destination } from "@/lib/data"; // Keep for Type definition only
import { apiRequest } from "@/lib/api"; // Import API helper

type View = "home" | "search";

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");

  // --- REAL DATA STATE ---
  const [hotels, setHotels] = useState<Destination[]>([]); // Stores DB data
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
        const data = await apiRequest("/api/hotels", "GET");

        // 2. MAP BACKEND DATA TO FRONTEND UI FORMAT
        const mappedHotels: Destination[] = data.hotels.map((h: any) => ({
          id: h.id,
          title: h.name,
          location: h.location,
          price: h.pricePerNight, 
          image:
            h.imageUrl ||
            "/home-main.jpg",
          description: h.description,
          rating: 4.8, 
          reviews: 12, 
        }));

        setHotels(mappedHotels);
        setFilteredResults(mappedHotels); // Show all by default
      } catch (err) {
        console.error("Failed to load hotels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // 3. HANDLE SEARCH (Using Real Data)
  const handleSearch = (query: string) => {
    // Filter the 'hotels' state, NOT 'allDestinations'
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
          <Navbar  />
        </div>
        <SearchResults
          results={filteredResults}
          onBack={() => setView("home")}
          onItemClick={handleItemClick}
        />
      </main>
    );
  }

  // --- VIEW: HOME ---
  return (
    <main className="bg-white min-h-screen">
    
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

      {loading ? (
        <div className="p-20 text-center text-gray-500">
          Loading amazing stays...
        </div>
      ) : (
        <DestinationSection
          destinations={hotels} // <--- Pass Real Data Here
          onItemClick={handleItemClick}
        />
      )}
    </main>
  );
}

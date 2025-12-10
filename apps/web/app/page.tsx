"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DestinationSection from "@/components/DestinationSection";
import SearchResults from "@/components/SearchResults";
import { allDestinations, Destination } from "@/lib/data";

type View = "home" | "search";

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [filteredResults, setFilteredResults] =
    useState<Destination[]>(allDestinations);

  // --- LIFTED STATE (The "Source of Truth") ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // 1. Handle Search Button Click
  const handleSearch = (query: string) => {
    const results = allDestinations.filter(
      (d) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredResults(results);
    setView("search");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 2. Handle Item Click (Navigates with current state)
  const handleItemClick = (dest: Destination) => {
    const params = new URLSearchParams();

    // Use the LIVE state variables directly
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
          <Navbar variant="dark" />
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
      <Hero
        // Pass State Down
        startDate={startDate}
        endDate={endDate}
        adults={adults}
        children={children}
        // Pass Setters Down
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setAdults={setAdults}
        setChildren={setChildren}
        onSearch={handleSearch}
      />

      <DestinationSection
        destinations={allDestinations}
        onItemClick={handleItemClick}
      />
    </main>
  );
}

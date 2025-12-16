"use client";

import { useEffect, useState, Suspense } from "react"; // <--- Import Suspense
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { Star, MapPin, Loader2 } from "lucide-react";

// 1. CREATE A SEPARATE COMPONENT FOR THE LOGIC
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Use the PUBLIC route now
        const data = await apiRequest("/api/properties", "GET");

        // Filter Logic
        const filtered = (data.properties || []).filter(
          (p: any) =>
            // p.status === 'approved' && // Uncomment if you want strict filtering
            p.location?.toLowerCase().includes(query.toLowerCase()) ||
            p.name?.toLowerCase().includes(query.toLowerCase())
        );

        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-bold mb-2">Search results for "{query}"</h1>
      <p className="text-gray-500 mb-8">{results.length} stays found</p>

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-2xl">
          No properties found in this location.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {results.map((hotel) => (
            <Link
              href={`/destinations/${hotel.id}`}
              key={hotel.id}
              className="group"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-200 mb-4">
                <img
                  src={hotel.imageUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="font-bold text-lg">{hotel.name}</h3>
              <div className="flex items-center text-gray-500 text-sm gap-1 mb-1">
                <MapPin size={14} /> {hotel.location}
              </div>
              <div className="font-bold">
                ₹{hotel.price}{" "}
                <span className="font-normal text-gray-500 text-sm">
                  / night
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. MAIN PAGE COMPONENT (WRAPS THE LOGIC IN SUSPENSE)
export default function SearchPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar variant="default" />

      {/* CRITICAL FIX: Suspense Boundary */}
      <Suspense
        fallback={
          <div className="flex justify-center pt-40">
            <Loader2 className="animate-spin" />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </main>
  );
}

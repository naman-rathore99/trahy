// app/destinations/[id]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import Navbar from "@/components/Navbar";
import { getDestinationById } from "@/lib/data";
import DestinationDetails from "@/components/DestinationDetails";

export default function DestinationPage() {
  const params = useParams();
  const searchParams = useSearchParams(); // Hook to read URL query
  const router = useRouter();

  const id = params.id as string;
  const destination = getDestinationById(id);

  if (!destination) return <div>Not Found</div>;

  // 1. EXTRACT DATA FROM URL
  const initialData = {
    start: searchParams.get("start") || "",
    end: searchParams.get("end") || "",
    adults: Number(searchParams.get("adults")) || 1,
    children: Number(searchParams.get("children")) || 0,
  };

  return (
    <main>
      <Navbar variant="dark" />
      {/* 2. PASS TO COMPONENT */}
      <DestinationDetails
        destination={destination}
        initialData={initialData}
        onBack={() => router.back()}
      />
    </main>
  );
}

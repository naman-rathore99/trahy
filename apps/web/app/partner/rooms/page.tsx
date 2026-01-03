"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import RoomManager from "@/components/RoomManager";
import { Loader2 } from "lucide-react";

export default function PartnerRoomsPage() {
    const [hotelId, setHotelId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch my hotel ID first
        const fetchHotel = async () => {
            try {
                const res = await apiRequest("/api/partner/my-hotel", "GET");
                if (res.hotel) setHotelId(res.hotel.id);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-600" /></div>;
    if (!hotelId) return <div className="p-10">Please setup your hotel first.</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Management</h1>
                <p className="text-gray-500">Add, edit, or delete rooms for your property.</p>
            </div>
            <RoomManager hotelId={hotelId} />
        </div>
    );
}
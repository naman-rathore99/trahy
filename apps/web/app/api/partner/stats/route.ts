import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
    await initAdmin();
    const db = getFirestore();

    try {
        // 1. Verify Partner Identity
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decodedToken = await getAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // 2. Get Partner's Hotel ID
        const hotelQuery = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();
        if (hotelQuery.empty) {
            return NextResponse.json({ error: "No hotel found" }, { status: 404 });
        }
        const hotelId = hotelQuery.docs[0].id;

        // 3. Fetch "Confirmed" Bookings for this hotel
        const bookingsSnapshot = await db.collection("bookings")
            .where("hotelId", "==", hotelId)
            .where("status", "in", ["confirmed", "completed"]) // Only paid/active bookings
            .get();

        // --- AGGREGATE DATA ---
        let totalRevenue = 0;
        let totalGuests = 0;
        let activeBookings = 0;

        // Initialize Chart Data (Last 7 Days)
        const today = new Date();
        const chartDataMap = new Map();

        // Create empty entries for the last 7 days so the chart isn't broken
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dayName = d.toLocaleDateString("en-US", { weekday: 'short' }); // "Mon", "Tue"
            chartDataMap.set(dayName, 0);
        }

        bookingsSnapshot.forEach(doc => {
            const data = doc.data();
            const amount = Number(data.totalAmount) || 0;
            const guests = Number(data.guests) || 0;

            // Total Revenue (All Time)
            totalRevenue += amount;
            totalGuests += guests;

            // Active Now? (Check if today is between checkIn and checkOut)
            // assuming data.startDate and data.endDate exist as timestamps or strings
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            if (today >= start && today <= end) {
                activeBookings += 1;
            }

            // Chart Data (Weekly Earnings)
            // Check if booking was created/paid in the last 7 days
            const bookingDate = data.createdAt ? new Date(data.createdAt.toDate()) : new Date();
            const diffTime = Math.abs(today.getTime() - bookingDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7) {
                const dayName = bookingDate.toLocaleDateString("en-US", { weekday: 'short' });
                if (chartDataMap.has(dayName)) {
                    chartDataMap.set(dayName, chartDataMap.get(dayName) + amount);
                }
            }
        });

        // Convert Map to Array for Recharts
        const revenueChart = Array.from(chartDataMap, ([name, value]) => ({ name, value }));

        return NextResponse.json({
            stats: {
                revenue: totalRevenue,
                guests: totalGuests,
                occupancy: activeBookings,
                vehiclesActive: 3, // Placeholder until you link vehicle DB
                chartData: revenueChart
            }
        });

    } catch (error: any) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
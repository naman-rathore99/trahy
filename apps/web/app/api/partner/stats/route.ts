import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { differenceInDays, parseISO, isWithinInterval, subDays, format } from "date-fns";

export async function GET(request: Request) {
    try {
        // 1. Authenticate the Partner
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const partnerId = decodedToken.uid;

        // 2. Fetch all successful bookings for this partner
        const snapshot = await adminDb.collection("bookings")
            .where("partnerId", "==", partnerId)
            .where("status", "in", ["confirmed", "paid", "success"])
            .get();

        let totalRevenue = 0;
        let totalGuests = 0;
        let activeOccupancy = 0;

        // Setup empty chart data for the last 7 days
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
                dateStr: format(d, "yyyy-MM-dd"),
                name: format(d, "EEE"), // Mon, Tue, Wed
                value: 0
            };
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 3. Loop through bookings and calculate the math
        snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Add Revenue
            const amount = Number(data.totalAmount) || 0;
            totalRevenue += amount;

            // Add Guests
            totalGuests += Number(data.guests) || 0;

            // Calculate Active Occupancy (Are they staying TODAY?)
            if (data.checkIn && data.checkOut) {
                const checkInDate = parseISO(data.checkIn);
                const checkOutDate = parseISO(data.checkOut);

                if (isWithinInterval(today, { start: checkInDate, end: checkOutDate })) {
                    // Count 1 room occupied for this booking
                    activeOccupancy += 1;
                }
            }

            // Calculate Chart Data (Revenue over the last 7 days)
            if (data.createdAt) {
                // Handle Firestore timestamps vs ISO strings safely
                const createdDate = typeof data.createdAt === 'string'
                    ? parseISO(data.createdAt)
                    : data.createdAt.toDate();

                const createdStr = format(createdDate, "yyyy-MM-dd");

                // Find if this booking was made in the last 7 days
                const dayIndex = last7Days.findIndex(d => d.dateStr === createdStr);
                if (dayIndex !== -1) {
                    last7Days[dayIndex].value += amount;
                }
            }
        });

        // 4. Return the formatted data to the frontend
        return NextResponse.json({
            success: true,
            stats: {
                revenue: totalRevenue,
                guests: totalGuests,
                occupancy: activeOccupancy,
                chartData: last7Days.map(d => ({ name: d.name, value: d.value }))
            }
        });

    } catch (error: any) {
        console.error("❌ Failed to fetch partner stats:", error);
        return NextResponse.json({ error: "Failed to load stats", details: error.message }, { status: 500 });
    }
}
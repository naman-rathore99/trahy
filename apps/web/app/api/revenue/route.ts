import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    // --- 1. GET FILTERS ---
    const role = searchParams.get("role") || "admin";
    const partnerId = searchParams.get("partnerId");

    // New: Exact Date Range Filters
    const startDateParam = searchParams.get("startDate"); // YYYY-MM-DD
    const endDateParam = searchParams.get("endDate");     // YYYY-MM-DD
    const timeFilter = searchParams.get("period");        // 'today', '7days' etc. (Fallback)

    try {
        // --- 2. FETCH DATA (Fetch all confirmed first) ---
        // Note: optimization for production would be to filter query by date, 
        // but for now we fetch confirmed & filter in memory for flexibility.
        const [hotelsSnap, vehiclesSnap] = await Promise.all([
            adminDb.collection("bookings").where("status", "==", "confirmed").get(),
            adminDb.collection("vehicle_bookings").where("status", "==", "confirmed").get()
        ]);

        // --- 3. NORMALIZE DATA ---
        const rawHotels = hotelsSnap.docs.map(doc => ({
            id: doc.id,
            type: "Hotel",
            ...doc.data(),
            finalAmount: doc.data().totalAmount || 0,
            createdAtDate: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now()),
            itemName: doc.data().listingName || "Hotel Stay"
        }));

        const rawVehicles = vehiclesSnap.docs.map(doc => ({
            id: doc.id,
            type: "Vehicle",
            ...doc.data(),
            finalAmount: doc.data().totalPrice || doc.data().totalAmount || 0,
            createdAtDate: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now()),
            itemName: doc.data().vehicleName || "Vehicle Rental"
        }));

        let allTransactions = [...rawHotels, ...rawVehicles];

        // --- 4. APPLY PARTNER FILTER ---
        if (role === "partner" && partnerId) {
            allTransactions = allTransactions.filter((t: any) =>
                t.ownerId === partnerId || t.partnerId === partnerId || t.userId === partnerId
            );
        }

        // --- 5. APPLY DATE FILTER (UPDATED LOGIC) ---
        const now = new Date();

        if (startDateParam && endDateParam) {
            // ✅ CASE A: Custom Range (Specific Date, Month, or Year)
            // We assume the frontend passes valid ISO strings (YYYY-MM-DD)
            const start = startOfDay(parseISO(startDateParam));
            const end = endOfDay(parseISO(endDateParam));

            allTransactions = allTransactions.filter((t: any) =>
                t.createdAtDate >= start && t.createdAtDate <= end
            );
        }
        else {
            // ✅ CASE B: Presets (Fallback)
            if (timeFilter === "today") {
                const start = startOfDay(now);
                allTransactions = allTransactions.filter((t: any) => t.createdAtDate >= start);
            } else if (timeFilter === "7days") {
                const start = new Date();
                start.setDate(now.getDate() - 7);
                allTransactions = allTransactions.filter((t: any) => t.createdAtDate >= start);
            } else if (timeFilter === "month") {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                allTransactions = allTransactions.filter((t: any) => t.createdAtDate >= start);
            }
        }

        // --- 6. SORT & CALCULATE ---
        allTransactions.sort((a: any, b: any) => b.createdAtDate.getTime() - a.createdAtDate.getTime());

        const totalGMV = allTransactions.reduce((sum, t: any) => sum + t.finalAmount, 0);
        const adminCommission = totalGMV * 0.20;
        const partnerEarnings = totalGMV * 0.80;

        return NextResponse.json({
            success: true,
            summary: {
                totalSales: totalGMV,
                netRevenue: role === "admin" ? adminCommission : partnerEarnings,
                bookingsCount: allTransactions.length,
            },
            bookings: allTransactions.map((b: any) => ({
                id: b.id,
                type: b.type,
                hotelName: b.itemName,
                guestName: b.userName || "Guest",
                date: b.createdAtDate.toISOString(),
                amount: b.finalAmount,
                yourCut: role === "admin" ? (b.finalAmount * 0.20) : (b.finalAmount * 0.80)
            }))
        });

    } catch (error) {
        console.error("Revenue API Error:", error);
        return NextResponse.json({ error: "Failed to load revenue" }, { status: 500 });
    }
}
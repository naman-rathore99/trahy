import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await initAdmin();
        const db = getFirestore();

        // 1. Validate
        if (!body.vehicleId || !body.customer || !body.startDate || !body.endDate) {
            return NextResponse.json({ error: "Missing vehicle booking details" }, { status: 400 });
        }

        // 2. Construct Booking Object
        const newBooking = {
            // Collection Marker (Optional, but good for debugging)
            sourceCollection: "vehicle_bookings",

            type: "vehicle",
            vehicleId: body.vehicleId,
            vehicleName: body.vehicleName,
            pricePerDay: body.pricePerDay,
            totalPrice: body.totalPrice,
            startDate: body.startDate,
            endDate: body.endDate,
            days: body.days,

            // Customer Info
            customer: {
                name: body.customer.name,
                email: body.customer.email,
                phone: body.customer.phone,
                userId: body.customer.userId || "guest",
            },

            // IMPORTANT: Save userId at root level for "My Trips" queries
            userId: body.customer.userId || "guest",

            // Status
            status: body.status || "confirmed", // Accept "pending_payment" if sent from frontend
            paymentStatus: body.paymentMethod === "online" ? "pending" : "pay_at_pickup",
            paymentMethod: body.paymentMethod || "pay_at_pickup",
            createdAt: new Date(),
        };

        // 3. ✅ SAVE TO 'vehicle_bookings' COLLECTION
        const docRef = await db.collection("vehicle_bookings").add(newBooking);

        return NextResponse.json({
            success: true,
            bookingId: docRef.id,
            message: "Vehicle Booking Created"
        });

    } catch (error) {
        console.error("Vehicle Booking Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
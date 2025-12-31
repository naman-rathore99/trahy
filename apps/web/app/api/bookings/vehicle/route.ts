import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await initAdmin();
        const db = getFirestore();

        // 1. Validate Vehicle Specific Fields
        if (!body.vehicleId || !body.customer || !body.startDate || !body.endDate) {
            return NextResponse.json({ error: "Missing vehicle booking details" }, { status: 400 });
        }

        // 2. Construct Vehicle Booking Object
        const newBooking = {
            type: "vehicle", // 👈 IMPORTANT: Distinguishes from hotels
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

            // Status & Payment (Reusing your existing process)
            status: "confirmed",
            paymentStatus: "pay_at_pickup",
            createdAt: new Date(),
        };

        // 3. Save to the SAME 'bookings' collection (so 'My Trips' shows everything)
        const docRef = await db.collection("bookings").add(newBooking);

        return NextResponse.json({
            success: true,
            bookingId: docRef.id,
            message: "Vehicle Booking Confirmed"
        });

    } catch (error) {
        console.error("Vehicle Booking Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";;
``
import { StandardCheckoutClient, Env } from "pg-sdk-node";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Booking ID

        // 1. Init SDK with Fallback Test Credentials
        const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
        const clientSecret = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
        const clientVersion = 1;
        const env = Env.SANDBOX;

        console.log(`🔍 Checking Status for: ${id}`);

        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

        // 2. Check Status using SDK
        // We use 'getOrderStatus' which is the correct method name for your version
        const response = await (client as any).getOrderStatus(id);

        console.log("✅ PhonePe Response:", JSON.stringify(response, null, 2));

        const paymentState = response.state; // e.g., "COMPLETED", "FAILED"

        // 3. Determine New Status
        let newStatus = "pending";
        let dbPaymentStatus = "pending";

        if (paymentState === "COMPLETED") {
            newStatus = "confirmed";
            dbPaymentStatus = "paid";
        } else if (paymentState === "FAILED") {
            newStatus = "failed";
            dbPaymentStatus = "failed";
        } else {
            return NextResponse.json({
                success: false,
                status: "pending",
                message: "Payment still processing"
            });
        }

        // 4. Update Firestore (SMART CHECK 🧠)
        // initAdmin auto-initialized
        const db = adminDb;

        // Step A: Try finding it in 'bookings' (Hotels)
        let bookingRef = db.collection("bookings").doc(id);
        let docSnap = await bookingRef.get();

        // Step B: If not found, switch to 'vehicle_bookings'
        if (!docSnap.exists) {
            console.log(`⚠️ Document not found in 'bookings', checking 'vehicle_bookings'...`);
            bookingRef = db.collection("vehicle_bookings").doc(id);
            docSnap = await bookingRef.get();

            if (!docSnap.exists) {
                // If still not found, it's a ghost ID
                console.error(`❌ Critical: Booking ID ${id} not found in ANY collection.`);
                return NextResponse.json({ error: "Booking ID Not Found in Database" }, { status: 404 });
            }
        }

        // Step C: Update the correct document found above
        await bookingRef.update({
            status: newStatus,
            paymentStatus: dbPaymentStatus,
            updatedAt: new Date().toISOString()
        });

        console.log(`✅ Database Updated for ${id}: ${dbPaymentStatus}`);

        return NextResponse.json({
            success: true,
            status: newStatus,
            paymentStatus: dbPaymentStatus
        });

    } catch (error: any) {
        console.error("❌ SDK/DB Error:", error);
        return NextResponse.json({ error: "Check failed", details: error.message }, { status: 500 });
    }
}
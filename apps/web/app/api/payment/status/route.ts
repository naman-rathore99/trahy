import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

// Shared logic for both GET (Redirect) and POST (PhonePe)
async function handlePayment(request: Request) {
    const url = new URL(request.url);

    // 1. Try to get ID from URL (The backup plan)
    let bookingId = url.searchParams.get("id");
    let code = url.searchParams.get("code");

    // 2. If not in URL, try Body (The standard plan)
    if (!bookingId) {
        try {
            const formData = await request.formData();
            bookingId = formData.get("merchantTransactionId")?.toString() || null;
            code = formData.get("code")?.toString() || null;
        } catch (e) {
            // Body parsing failed (it's okay, likely a GET request)
        }
    }

    // 3. Validation
    if (!bookingId) {
        // If we are stuck here, force the user back to home instead of showing JSON
        return NextResponse.redirect(new URL("/", request.url), 303);
    }

    // 4. Update Database
    await initAdmin();
    const db = getFirestore();
    const bookingRef = db.collection("bookings").doc(bookingId);

    // If code is missing (GET request), assume success if we made it this far
    const isSuccess = code === "PAYMENT_SUCCESS" || !code;

    if (isSuccess) {
        await bookingRef.update({
            status: "confirmed",
            paymentStatus: "paid",
            updatedAt: new Date().toISOString(),
        });
        // ✅ Redirect to Success Page
        return NextResponse.redirect(new URL(`/book/success/${bookingId}`, request.url), 303);
    } else {
        await bookingRef.update({
            status: "failed",
            paymentStatus: "failed",
            failureReason: code || "unknown",
            updatedAt: new Date().toISOString(),
        });
        // ❌ Redirect to Failure Page
        return NextResponse.redirect(new URL(`/book/failure/${bookingId}`, request.url), 303);
    }
}

// Export BOTH handlers
export async function POST(request: Request) {
    return handlePayment(request);
}

export async function GET(request: Request) {
    return handlePayment(request);
}
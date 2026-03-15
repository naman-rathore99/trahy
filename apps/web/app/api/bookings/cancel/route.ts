import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendCancellationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const { bookingId, sourceCollection, hotelName, customerEmail } =
      await request.json();

    if (!bookingId || !sourceCollection) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Update Database
    await adminDb.collection(sourceCollection).doc(bookingId).update({
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });

    // 2. Send Cancellation Email
    if (customerEmail) {
      try {
        await sendCancellationEmail(
          customerEmail,
          hotelName || "Your Booking",
          bookingId.slice(0, 8).toUpperCase(),
        );
      } catch (err) {
        console.error("Failed to send cancellation email via Resend:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancellation API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendRescheduleEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const {
      bookingId,
      sourceCollection,
      updateData,
      hotelName,
      customerEmail,
      newDates,
    } = await request.json();

    if (!bookingId || !sourceCollection || !updateData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Update Database
    await adminDb
      .collection(sourceCollection)
      .doc(bookingId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

    // 2. Send Reschedule Email
    if (customerEmail && newDates) {
      try {
        await sendRescheduleEmail(
          customerEmail,
          hotelName || "Your Booking",
          bookingId.slice(0, 8).toUpperCase(),
          newDates,
        );
      } catch (err) {
        console.error("Failed to send reschedule email via Resend:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reschedule API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

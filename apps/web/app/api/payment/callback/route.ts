import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

async function handleCallback(request: Request) {
  try {
    const url = new URL(request.url);
    let bookingId = url.searchParams.get("id");
    let code: string | null = null;

    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        code = formData.get("code")?.toString() || null;
        if (!bookingId) {
          bookingId = formData.get("merchantTransactionId")?.toString() || null;
        }
      } catch (e) { }
    }

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      console.error(`Booking ${bookingId} not found in callback`);
      return NextResponse.redirect(new URL("/trips?error=not_found", request.url), 303);
    }

    // Prevent processing an already-finalized booking
    const currentStatus = bookingSnap.data()?.status;
    if (currentStatus === "confirmed" || currentStatus === "failed") {
      return NextResponse.redirect(
        new URL(
          currentStatus === "confirmed"
            ? `/book/success/${bookingId}`
            : `/book/failure/${bookingId}`,
          request.url
        ),
        303
      );
    }

    const isSuccess = code === "PAYMENT_SUCCESS";

    if (isSuccess) {
      await bookingRef.update({
        status: "confirmed",
        paymentStatus: "paid",
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.redirect(
        new URL(`/book/success/${bookingId}`, request.url),
        303
      );
    } else {
      await bookingRef.update({
        status: "failed",
        paymentStatus: "failed",
        failureReason: code || "unknown",
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.redirect(
        new URL(`/book/failure/${bookingId}`, request.url),
        303
      );
    }

  } catch (error) {
    console.error("Web Callback Error:", error);
    return NextResponse.redirect(
      new URL("/trips?error=server_error", request.url),
      303
    );
  }
}

export async function POST(request: Request) { return handleCallback(request); }
export async function GET(request: Request) { return handleCallback(request); }
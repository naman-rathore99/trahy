import { NextResponse } from "next/server";
import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

// --- HELPER: Verify Status with PhonePe Server ---
async function checkPaymentStatus(transactionId: string) {
  const merchantId = process.env.PHONEPE_MERCHANT_ID as string;
  const saltKey = process.env.PHONEPE_SALT_KEY as string;
  const saltIndex = process.env.PHONEPE_SALT_INDEX as string;

  // Create Checksum for Status API
  const finalXHeader =
    crypto
      .createHash("sha256")
      .update(`/pg/v1/status/${merchantId}/${transactionId}` + saltKey)
      .digest("hex") +
    "###" +
    saltIndex;

  const statusUrl = `${process.env.PHONEPE_HOST_URL}/pg/v1/status/${merchantId}/${transactionId}`;

  const response = await fetch(statusUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-MERCHANT-ID": merchantId,
      "X-VERIFY": finalXHeader,
    },
  });

  return response.json();
}

// --- MAIN LOGIC: Handle Both GET and POST ---
async function processPayment(transactionId: string) {
  try {
    await initAdmin();
    const db = getFirestore();

    // 1. Verify Payment Status directly with PhonePe
    const statusData = await checkPaymentStatus(transactionId);

    if (statusData.code === "PAYMENT_SUCCESS") {
      // 2. Success: Update Booking in Database
      await db
        .collection("bookings")
        .doc(transactionId)
        .update({
          status: "confirmed",
          paymentId:
            statusData.data.paymentInstrument?.pgTransactionId || "N/A",
          paidAt: new Date().toISOString(),
        });

      // 3. Redirect to "My Bookings" with Success Banner
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bookings?success=true`,
        302
      );
    } else {
      // 4. Failure: Mark as Failed
      await db.collection("bookings").doc(transactionId).update({
        status: "failed",
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bookings?success=false`,
        302
      );
    }
  } catch (error) {
    console.error("Callback Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/bookings?error=server_error`,
      302
    );
  }
}

// --- ROUTE HANDLERS ---

export async function GET(request: Request) {
  // Handle Browser Redirects (The 405 fix)
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("id");

  if (!transactionId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/bookings?error=missing_id`,
      302
    );
  }

  return await processPayment(transactionId);
}

export async function POST(request: Request) {
  // Handle Server-to-Server callbacks (Just in case)
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("id");

  if (!transactionId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/bookings?error=missing_id`,
      302
    );
  }

  return await processPayment(transactionId);
}

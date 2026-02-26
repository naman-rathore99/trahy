import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

async function handleCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    let code = "";
    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        code = formData.get("code")?.toString() || "";
      } catch (e) { }
    }

    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Prevent double processing
    const currentStatus = bookingSnap.data()?.status;
    if (currentStatus === "confirmed" || currentStatus === "failed") {
      return new NextResponse(getHtmlPage(currentStatus === "confirmed"), {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    const isSuccess = code === "PAYMENT_SUCCESS";

    await bookingRef.update({
      status: isSuccess ? "confirmed" : "failed",
      paymentStatus: isSuccess ? "paid" : "failed",
      ...(isSuccess ? {} : { failureReason: code || "unknown" }),
      updatedAt: new Date().toISOString(),
    });

    // onSnapshot in the mobile app will fire automatically now
    return new NextResponse(getHtmlPage(isSuccess), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });

  } catch (error) {
    console.error("Mobile Callback Error:", error);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}

function getHtmlPage(success: boolean): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; display: flex; justify-content: center;
               align-items: center; min-height: 100vh; background: #f9fafb; }
        .card { background: white; padding: 2rem; border-radius: 16px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 320px; width: 90%; }
        .icon { font-size: 56px; margin-bottom: 1rem; }
        h2 { font-size: 1.4rem; margin-bottom: 0.5rem; color: #111; }
        p { color: #6b7280; font-size: 0.9rem; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${success ? "✅" : "❌"}</div>
        <h2>${success ? "Payment Successful!" : "Payment Failed"}</h2>
        <p>${success
      ? "Your booking is confirmed. You can close this window and return to the app."
      : "Something went wrong. Please close this window and try again."
    }</p>
      </div>
    </body>
  </html>`;
}

export async function POST(request: Request) { return handleCallback(request); }
export async function GET(request: Request) { return handleCallback(request); }
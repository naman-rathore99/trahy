import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const bookingId = url.searchParams.get("id");

        if (!bookingId) {
            return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
        }

        const formData = await request.formData();
        const code = formData.get("code")?.toString() || "";

        const bookingRef = adminDb.collection("bookings").doc(bookingId);
        const isSuccess = code === "PAYMENT_SUCCESS";

        if (isSuccess) {
            await bookingRef.update({
                status: "confirmed",
                paymentStatus: "paid",
                updatedAt: new Date().toISOString(),
            });
        } else {
            await bookingRef.update({
                status: "failed",
                paymentStatus: "failed",
                failureReason: code || "unknown",
                updatedAt: new Date().toISOString(),
            });
        }

        // ✅ Just a simple page — no deep links
        // The mobile app's onSnapshot listener will detect the Firestore change automatically
        return new NextResponse(
            `<!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; 
                   align-items: center; height: 100vh; background: #f9fafb; margin: 0; }
            .card { background: white; padding: 2rem; border-radius: 12px; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 320px; }
            .icon { font-size: 48px; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">${isSuccess ? "✅" : "❌"}</div>
            <h2>${isSuccess ? "Payment Successful!" : "Payment Failed"}</h2>
            <p style="color: gray;">You can close this window and return to the app.</p>
          </div>
        </body>
      </html>`,
            { status: 200, headers: { "Content-Type": "text/html" } }
        );

    } catch (error) {
        console.error("Mobile Callback Error:", error);
        return NextResponse.json({ error: "Callback failed" }, { status: 500 });
    }
}

// PhonePe sometimes sends GET too
export async function GET(request: Request) {
    return POST(request);
}
// app/api/payment/callback-app/route.ts
// This page is shown in the browser when Razorpay redirects back after 3DS/bank auth.
// It reads the bookingId from the URL, checks Firestore, and deep-links back to the app.
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("id");

    if (!bookingId) {
      return new NextResponse(errorHtml("Missing booking ID.", "shubhyatraapk://payment-complete?status=failed"), {
        status: 400,
        headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
      });
    }

    // Read final status from Firestore
    // (The mobile app's RazorpayCheckout.open().then() already updated it)
    let bookingRef = adminDb.collection("bookings").doc(bookingId);
    let docSnap = await bookingRef.get();

    if (!docSnap.exists) {
      bookingRef = adminDb.collection("vehicle_bookings").doc(bookingId);
      docSnap = await bookingRef.get();
    }

    if (!docSnap.exists) {
      return new NextResponse(errorHtml("Booking not found.", "shubhyatraapk://payment-complete?status=failed"), {
        status: 404,
        headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
      });
    }

    const data = docSnap.data()!;
    const isSuccess = data.status === "confirmed" || data.paymentStatus === "paid";
    const deepLink = `shubhyatraapk://payment-complete?status=${isSuccess ? "success" : "failed"}&bookingId=${bookingId}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Shubh Yatra – Payment ${isSuccess ? "Successful" : "Failed"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: ${isSuccess ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "linear-gradient(135deg, #fef2f2, #fee2e2)"};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 28px;
      padding: 44px 32px;
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    }
    .icon-ring {
      width: 88px; height: 88px;
      border-radius: 50%;
      margin: 0 auto 24px;
      display: flex; align-items: center; justify-content: center;
      background: ${isSuccess ? "#d1fae5" : "#fee2e2"};
      animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .icon-inner {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: ${isSuccess ? "#10b981" : "#ef4444"};
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; color: white;
    }
    @keyframes pop {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    h1 { font-size: 22px; font-weight: 900; color: #111827; margin-bottom: 10px; }
    p  { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 32px; }
    .btn {
      display: block; width: 100%;
      background: ${isSuccess ? "#FF5A1F" : "#111827"};
      color: white; font-weight: 800; font-size: 16px;
      padding: 18px; border-radius: 18px;
      text-decoration: none; border: none; cursor: pointer;
      box-shadow: 0 4px 16px ${isSuccess ? "rgba(255,90,31,0.35)" : "rgba(0,0,0,0.25)"};
      transition: transform 0.15s, opacity 0.15s;
    }
    .btn:active { transform: scale(0.97); opacity: 0.9; }
    .note { margin-top: 16px; font-size: 12px; color: #9ca3af; }
    .countdown { font-weight: 700; color: ${isSuccess ? "#10b981" : "#ef4444"}; }
    .brand { margin-bottom: 28px; font-size: 13px; font-weight: 700; color: #9ca3af; letter-spacing: 0.05em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <p class="brand">Shubh Yatra</p>
    <div class="icon-ring">
      <div class="icon-inner">${isSuccess ? "✓" : "✕"}</div>
    </div>
    <h1>${isSuccess ? "Payment Successful!" : "Payment Failed"}</h1>
    <p>${isSuccess
        ? "Your booking is confirmed. Tap below to return to the app and view your trip."
        : "We couldn't process your payment. Return to the app and try again."
      }</p>
    <a href="${deepLink}" class="btn">${isSuccess ? "View My Booking" : "Return to App"}</a>
    <p class="note">Redirecting automatically in <span class="countdown" id="cd">3</span>s...</p>
  </div>
  <script>
    let t = 3;
    const el = document.getElementById("cd");
    const tick = setInterval(() => {
      t--;
      if (el) el.textContent = t;
      if (t <= 0) {
        clearInterval(tick);
        window.location.href = "${deepLink}";
      }
    }, 1000);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
    });

  } catch (error: any) {
    console.error("❌ Callback App Error:", error?.message);
    return new NextResponse(errorHtml("Something went wrong.", "shubhyatraapk://payment-complete?status=failed"), {
      status: 500,
      headers: { "Content-Type": "text/html", "Cache-Control": "no-store" },
    });
  }
}

function errorHtml(message: string, deepLink: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px">
    <h2>⚠️ ${message}</h2>
    <a href="${deepLink}" style="color:#FF5A1F;font-weight:bold">Return to App</a>
  </body></html>`;
}
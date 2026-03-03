import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("id");
    // This is the deep link (e.g., shubhyatraapk://payment-complete)
    const redirectUrl = url.searchParams.get("redirect");

    if (!bookingId || !redirectUrl) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const formData = await request.formData();
    const code = formData.get("code")?.toString() || "";

    const bookingRef = adminDb.collection("bookings").doc(bookingId);

    let isSuccess = false;

    if (code === "PAYMENT_SUCCESS") {
      isSuccess = true;
      await bookingRef.update({
        status: "confirmed",
        paymentStatus: "paid",
        updatedAt: new Date().toISOString()
      });
    } else {
      await bookingRef.update({
        status: "failed",
        paymentStatus: "failed",
        updatedAt: new Date().toISOString()
      });
    }

    // 🎨 YOUR CUSTOM SHUBH YATRA UI
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Shubh Yatra - Transaction Status</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f9fafb;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    text-align: center;
                }
                .container {
                    background: white;
                    padding: 40px 30px;
                    border-radius: 24px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    width: 85%;
                    max-width: 400px;
                }
                .icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 0 auto 20px auto;
                    font-size: 40px;
                }
                .success-icon { background-color: #d1fae5; color: #10b981; }
                .failed-icon { background-color: #fee2e2; color: #ef4444; }
                
                h1 { margin: 0 0 10px 0; font-size: 24px; color: #111827; }
                p { margin: 0 0 30px 0; color: #6b7280; font-size: 15px; line-height: 1.5; }
                
                .btn {
                    background-color: #5f259f;
                    color: white;
                    border: none;
                    padding: 16px 0;
                    width: 100%;
                    border-radius: 16px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    box-sizing: border-box;
                    box-shadow: 0 4px 12px rgba(95, 37, 159, 0.3);
                    transition: transform 0.2s;
                }
                .btn:active { transform: scale(0.98); }
                
                .auto-redirect-text {
                    margin-top: 20px;
                    font-size: 13px;
                    color: #9ca3af;
                }
            </style>
        </head>
        <body>
            <div class="container">
                ${isSuccess
        ? `<div class="icon success-icon">✓</div>
                       <h1>Payment Successful!</h1>
                       <p>Your Shubh Yatra booking is confirmed. You can now return to the app.</p>`
        : `<div class="icon failed-icon">✕</div>
                       <h1>Payment Failed</h1>
                       <p>We couldn't process your payment. Please return to the app to try again.</p>`
      }
                
                <a href="${redirectUrl}" class="btn">Return to App</a>
                
                <div class="auto-redirect-text">
                    Attempting to redirect automatically...
                </div>
            </div>

            <script>
                // Try to automatically click the link after 2 seconds
                setTimeout(function() {
                    window.location.href = "${redirectUrl}";
                }, 2000);
            </script>
        </body>
        </html>
        `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        // This prevents caching so the user always sees fresh status
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error) {
    console.error("Callback App Error:", error);
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
  }
}
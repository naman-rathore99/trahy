import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const bookingId = url.searchParams.get("id");
        // Grab the deep link we passed earlier
        const redirectUrl = url.searchParams.get("redirect");

        if (!bookingId || !redirectUrl) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const formData = await request.formData();
        const code = formData.get("code")?.toString() || "";

        const bookingRef = adminDb.collection("bookings").doc(bookingId);

        if (code === "PAYMENT_SUCCESS") {
            // Update Firestore so the mobile app's onSnapshot triggers!
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

        // 🔥 THE NEW MAGIC: Return an HTML page with a JavaScript redirect!
        // Mobile browsers trust JS redirects, but block 302 header redirects from POSTs.
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redirecting to App...</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9fafb; margin: 0; }
                .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #5f259f; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="spinner"></div>
                <h2>Payment Complete!</h2>
                <p>Returning you to the Shubhyatra app...</p>
                <p style="font-size: 12px; color: gray; margin-top: 15px;">
                    If nothing happens, <a href="${redirectUrl}" style="color: #5f259f; font-weight: bold;">click here</a>.
                </p>
            </div>
            <script>
                // This script executes the moment the page loads, instantly closing the browser
                // and returning the user to the React Native app.
                setTimeout(() => {
                    window.location.href = "${redirectUrl}";
                }, 100);
            </script>
        </body>
        </html>
        `;

        // Return the HTML response
        return new NextResponse(html, {
            status: 200,
            headers: { "Content-Type": "text/html" },
        });

    } catch (error) {
        console.error("Callback App Error:", error);
        return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
    }
}

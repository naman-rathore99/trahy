import { NextResponse } from "next/server";
// 🚨 FIX 1: Import adminAuth from your proxy file to prevent Next.js crashes
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

// Helper: Get User ID
async function getUserId(request: Request) {
    // 🚨 FIX 2: Support Axios lowercase 'authorization' headers!
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const token = authHeader?.split("Bearer ")[1];

    if (!token) return null;

    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

// --- GET: Fetch Stats & Bank Details ---
export async function GET(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = adminDb;

        // 1. Fetch User Profile (to get Bank Details)
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data() || {};

        // 2. Calculate Earnings
        const hotelsSnapshot = await db.collection("hotels").where("ownerId", "==", userId).get();

        let totalEarnings = 0;
        let totalBookings = 0;
        let pendingSettlement = 0;

        await Promise.all(hotelsSnapshot.docs.map(async (hotelDoc) => {
            const bookingsSnapshot = await db.collection("bookings")
                .where("hotelId", "==", hotelDoc.id)
                .get();

            bookingsSnapshot.forEach(doc => {
                const booking = doc.data();
                if (booking.status === "confirmed" || booking.status === "completed") {
                    const price = Number(booking.price) || 0;
                    totalEarnings += price;
                    totalBookings += 1;

                    if (booking.payoutStatus !== "paid") {
                        pendingSettlement += price;
                    }
                }
            });
        }));

        return NextResponse.json({
            bankDetails: userData.bankDetails || null,
            stats: {
                totalEarnings,
                totalBookings,
                pendingSettlement,
                bonus: userData.bonus || 0
            }
        });

    } catch (error: any) {
        console.error("Wallet GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// --- POST: Save Bank Details (One Time Only) ---
export async function POST(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = adminDb;
        const body = await request.json();

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data() || {};

        // SECURITY CHECK: If bank details exist, BLOCK the update
        if (userData.bankDetails && Object.keys(userData.bankDetails).length > 0) {
            return NextResponse.json({ error: "Bank details already locked. Contact Admin to change." }, { status: 403 });
        }

        // Save details
        await userRef.update({
            bankDetails: {
                accountName: body.accountName,
                accountNumber: body.accountNumber,
                ifsc: body.ifsc,
                bankName: body.bankName,
                upiId: body.upiId || "",
                updatedAt: new Date().toISOString() // 🚨 Safe date format for JSON
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Wallet POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
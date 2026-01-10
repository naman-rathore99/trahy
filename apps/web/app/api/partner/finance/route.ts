import { NextResponse } from "next/server";
``
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";;

// Helper: Get User ID
async function getUserId(request: Request) {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return null;
    try {
        // initAdmin auto-initialized
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
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
        // Strategy: Find all hotels owned by this user, then sum their bookings
        const hotelsSnapshot = await db.collection("hotels").where("ownerId", "==", userId).get();

        let totalEarnings = 0;
        let totalBookings = 0;
        let pendingSettlement = 0;

        // We use Promise.all to fetch bookings for all hotels in parallel
        await Promise.all(hotelsSnapshot.docs.map(async (hotelDoc) => {
            const bookingsSnapshot = await db.collection("bookings")
                .where("hotelId", "==", hotelDoc.id)
                .get();

            bookingsSnapshot.forEach(doc => {
                const booking = doc.data();
                // Only count confirmed/paid bookings
                if (booking.status === "confirmed" || booking.status === "completed") {
                    const price = Number(booking.price) || 0;
                    totalEarnings += price;
                    totalBookings += 1;

                    // Simple Logic: If payoutStatus is not 'paid', it's pending
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
                bonus: userData.bonus || 0 // Admin can set this manually in DB
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
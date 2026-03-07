import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
    try {
        // 1. Verify the Partner's Auth Token
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        const partnerId = decodedToken.uid;

        // 2. Fetch the latest bookings for THIS partner from Firestore
        // Note: We only fetch where paymentStatus is "paid" or status is "confirmed"
        const snapshot = await adminDb.collection("bookings")
            .where("partnerId", "==", partnerId)
            .where("status", "in", ["confirmed", "paid"])
            .orderBy("createdAt", "desc")
            .limit(10) // Get the 10 most recent
            .get();

        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Safely convert Firestore timestamps
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            };
        });

        return NextResponse.json({ success: true, bookings });

    } catch (error: any) {
        console.error("❌ Error fetching partner bookings:", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}
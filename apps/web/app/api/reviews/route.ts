import { NextResponse } from "next/server";
``
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";;

// Helper: Get User ID from Token
async function getUserId(request: Request) {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return null;
    try {
        // initAdmin auto-initialized
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        return null;
    }
}

// --- GET: Fetch Reviews for a Hotel ---
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId) return NextResponse.json({ error: "Hotel ID required" }, { status: 400 });

    try {
        // initAdmin auto-initialized
        const db = adminDb;
        const snapshot = await db
            .collection("hotels")
            .doc(hotelId)
            .collection("reviews")
            .orderBy("createdAt", "desc")
            .get();

        // Map docs to data
        const reviews = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to readable format safely
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });

        return NextResponse.json({ reviews });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: Add Review & Update Rating ---
export async function POST(request: Request) {
    try {
        const user = await getUserId(request);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { hotelId, rating, text } = body;

        if (!hotelId || !rating) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const db = adminDb;
        const hotelRef = db.collection("hotels").doc(hotelId);

        // 1. Add the Review
        await hotelRef.collection("reviews").add({
            userId: user.uid,
            user: user.name || (user.email ? user.email.split("@")[0] : "Traveler"),
            rating: Number(rating),
            text: text || "",
            createdAt: new Date(),
        });

        // 2. Recalculate Average Rating
        const reviewsSnapshot = await hotelRef.collection("reviews").get();
        const totalReviews = reviewsSnapshot.size;

        let sumRating = 0;
        reviewsSnapshot.forEach((doc) => {
            sumRating += doc.data().rating || 0;
        });

        const newAverage = totalReviews > 0 ? (sumRating / totalReviews).toFixed(1) : 0;

        // 3. Update Hotel Document with New Rating
        await hotelRef.update({
            rating: Number(newAverage),
            totalReviews: totalReviews
        });

        return NextResponse.json({ success: true, newRating: Number(newAverage) });

    } catch (error: any) {
        console.error("Review Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
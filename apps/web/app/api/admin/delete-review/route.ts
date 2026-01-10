import { NextResponse } from "next/server";
``
import { adminDb } from "@/lib/firebaseAdmin";;

export async function POST(request: Request) {
    try {
        // initAdmin auto-initialized
        const db = adminDb;
        const body = await request.json();
        const { hotelId, reviewId } = body;

        // 1. Delete the review
        const hotelRef = db.collection("hotels").doc(hotelId);
        await hotelRef.collection("reviews").doc(reviewId).delete();

        // 2. Recalculate Average Rating after deletion
        const reviewsSnapshot = await hotelRef.collection("reviews").get();
        const totalReviews = reviewsSnapshot.size;

        let sumRating = 0;
        reviewsSnapshot.forEach((doc) => {
            sumRating += doc.data().rating || 0;
        });

        const newAverage = totalReviews > 0 ? (sumRating / totalReviews).toFixed(1) : 0;

        // 3. Update Hotel stats
        await hotelRef.update({
            rating: Number(newAverage),
            totalReviews: totalReviews
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
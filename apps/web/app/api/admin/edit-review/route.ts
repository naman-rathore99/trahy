import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        await initAdmin();
        const db = getFirestore();
        const { hotelId, reviewId, text, rating } = await request.json();

        const hotelRef = db.collection("hotels").doc(hotelId);

        // 1. Update the Review
        await hotelRef.collection("reviews").doc(reviewId).update({
            text,
            rating: Number(rating)
        });

        // 2. Recalculate Hotel Average Rating
        const reviewsSnapshot = await hotelRef.collection("reviews").get();
        const totalReviews = reviewsSnapshot.size;

        let sumRating = 0;
        reviewsSnapshot.forEach((doc) => {
            sumRating += doc.data().rating || 0;
        });

        const newAverage = totalReviews > 0 ? (sumRating / totalReviews).toFixed(1) : 0;

        // 3. Update Hotel
        await hotelRef.update({
            rating: Number(newAverage)
        });

        return NextResponse.json({ success: true, newRating: newAverage });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
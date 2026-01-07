import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await initAdmin();
        const db = getFirestore();

        // 1. Fetch ALL reviews (REMOVED .orderBy to fix the error)
        const snapshot = await db.collectionGroup("reviews").get();

        // 2. Extract unique Hotel IDs
        const hotelIds = new Set<string>();
        const reviewsData = snapshot.docs.map(doc => {
            const hotelId = doc.ref.parent.parent?.id || "unknown";
            hotelIds.add(hotelId);

            // Convert Timestamp to Date object for sorting later
            const data = doc.data();
            let createdDate = new Date();
            if (data.createdAt?.toDate) {
                createdDate = data.createdAt.toDate();
            } else if (typeof data.createdAt === 'string') {
                createdDate = new Date(data.createdAt);
            }

            return {
                id: doc.id,
                hotelId,
                ...data,
                createdAt: createdDate.toISOString(), // Send string to frontend
                originalDate: createdDate // Keep object for sorting here
            };
        });

        // 3. Fetch Hotel Names
        const hotelNames: Record<string, string> = {};
        await Promise.all(
            Array.from(hotelIds).map(async (id) => {
                const hotelDoc = await db.collection("hotels").doc(id).get();
                hotelNames[id] = hotelDoc.exists ? hotelDoc.data()?.name : "Unknown Hotel";
            })
        );

        // 4. Attach names AND Sort by Date manually (Newest First)
        const reviews = reviewsData
            .map(r => ({
                ...r,
                hotelName: hotelNames[r.hotelId]
            }))
            .sort((a, b) => b.originalDate.getTime() - a.originalDate.getTime()); // ✅ Sort in JS

        return NextResponse.json({ reviews });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    await initAdmin();
    const db = getFirestore();

    try {
        const { userId, action, remark } = await request.json(); // action = 'approve' | 'reject'

        if (!userId) return NextResponse.json({ error: "User ID missing" }, { status: 400 });

        const isApprove = action === "approve";

        // 1. Update USER (The Partner Identity)
        await db.collection("users").doc(userId).update({
            isVerified: isApprove,
            verificationStatus: isApprove ? "verified" : "rejected",
            verificationRemark: remark || "", // Save the rejection reason if any
            updatedAt: new Date(),
        });

        // 2. Update HOTEL (The Property Visibility)
        // Find the hotel owned by this user
        const hotelQuery = await db.collection("hotels").where("ownerId", "==", userId).get();

        if (!hotelQuery.empty) {
            const hotelDoc = hotelQuery.docs[0];

            // If Approving User -> Approve Hotel
            // If Rejecting User -> Set Hotel to Pending/Rejected (Hide it)
            await db.collection("hotels").doc(hotelDoc.id).update({
                status: isApprove ? "APPROVED" : "REJECTED",
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
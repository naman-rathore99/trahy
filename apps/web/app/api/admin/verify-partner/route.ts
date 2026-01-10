import { NextResponse } from "next/server";
``
import { getAuth } from "firebase-admin/auth"; // ✅ Added Auth
import { adminDb } from "@/lib/firebaseAdmin";;

export async function POST(request: Request) {
    // initAdmin auto-initialized
    const db = adminDb;
    const auth = getAuth();

    try {
        // ✅ We added phoneNumber and documentUrl to the request body
        const { userId, action, remark, phoneNumber, documentUrl } = await request.json();

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. APPROVE PARTNER
        if (action === "approve") {
            await db.collection("users").doc(userId).update({
                isVerified: true,
                verificationStatus: "verified",
                verificationRemark: "",
                approvedBy: "admin",
                updatedAt: new Date(),
            });

            // Also Approve their Hotel
            const hotelQuery = await db.collection("hotels").where("ownerId", "==", userId).get();
            if (!hotelQuery.empty) {
                await db.collection("hotels").doc(hotelQuery.docs[0].id).update({
                    status: "APPROVED",
                });
            }
        }

        // 2. REJECT PARTNER
        else if (action === "reject") {
            await db.collection("users").doc(userId).update({
                isVerified: false,
                verificationStatus: "rejected",
                verificationRemark: remark || "Documents rejected",
                updatedAt: new Date(),
            });

            // Hide their Hotel
            const hotelQuery = await db.collection("hotels").where("ownerId", "==", userId).get();
            if (!hotelQuery.empty) {
                await db.collection("hotels").doc(hotelQuery.docs[0].id).update({
                    status: "REJECTED",
                });
            }
        }

        // 3. ✅ NEW: UPDATE PHONE NUMBER (Fixes missing numbers)
        else if (action === "update_phone") {
            if (!phoneNumber) return NextResponse.json({ error: "No phone provided" }, { status: 400 });

            // Update Firestore (Saving both keys to be safe)
            await db.collection("users").doc(userId).update({
                phone: phoneNumber,
                phoneNumber: phoneNumber,
                updatedAt: new Date(),
            });

            // Attempt to update Firebase Auth User (Optional but good)
            try {
                await auth.updateUser(userId, { phoneNumber: phoneNumber });
            } catch (e) {
                console.log("Could not update Auth phone (likely format issue), but Firestore updated.");
            }
        }

        // 4. ✅ NEW: MANUAL IMAGE FIX (Fixes missing images)
        else if (action === "update_doc") {
            if (!documentUrl) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

            await db.collection("users").doc(userId).update({
                idProofUrl: documentUrl,
                // We keep isVerified false so you can review it again
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 
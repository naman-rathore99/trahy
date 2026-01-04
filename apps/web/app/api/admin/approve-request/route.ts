import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

// --- GET: List All Pending Requests ---
export async function GET(request: Request) {
    await initAdmin();
    const db = getFirestore();

    // 1. Fetch pending requests from 'join_requests' collection
    const snapshot = await db.collection("join_requests")
        .where("status", "==", "pending") // Ensure your frontend sends "pending" (lowercase)
        .orderBy("createdAt", "desc")
        .get();

    const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return NextResponse.json({ requests });
}

// --- PUT: Approve/Reject & Create User ---
export async function PUT(request: Request) {
    await initAdmin();
    const db = getFirestore();
    const auth = getAuth();

    try {
        const body = await request.json();
        const { requestId, status, email, password, name, hotelName, hotelAddress, phone } = body;

        if (!requestId || !status) {
            return NextResponse.json({ error: "Missing ID or Status" }, { status: 400 });
        }

        if (status === "APPROVED") {
            let userId = "";

            // 1. Create the User Account (Login)
            try {
                // Check if user exists first to avoid error
                try {
                    const existingUser = await auth.getUserByEmail(email);
                    userId = existingUser.uid;
                } catch (e) {
                    // User doesn't exist, create new
                    const userRecord = await auth.createUser({
                        email,
                        password: password || "Partner@123", // Default temp password if none provided
                        displayName: name,
                        emailVerified: true,
                    });
                    userId = userRecord.uid;
                }

                // Set Role
                await auth.setCustomUserClaims(userId, { role: "partner" });

                // Save User to DB
                await db.collection("users").doc(userId).set({
                    uid: userId,
                    name,
                    email,
                    phone,
                    role: "partner",
                    createdAt: new Date(),
                }, { merge: true });

            } catch (authError: any) {
                console.error("Auth Error:", authError);
                return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
            }

            // 2. Create the HOTEL Record (Empty placeholder for them to edit)
            // This is crucial so they pass the "No Hotel" check immediately
            if (userId) {
                const hotelData = {
                    ownerId: userId,
                    name: hotelName || `${name}'s Hotel`, // Use name from request or fallback
                    description: "Welcome! Please update your hotel description in Settings.",
                    address: hotelAddress || "Address Pending",
                    city: "Mathura", // Default
                    status: "APPROVED", // Auto-approve the hotel since we approved the partner
                    createdAt: new Date(),
                    images: [],
                    amenities: []
                };

                await db.collection("hotels").add(hotelData);
            }
        }

        // 3. Update the Request Status
        await db.collection("join_requests").doc(requestId).update({
            status: status, // APPROVED or REJECTED
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
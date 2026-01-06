import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

// --- GET: List Requests (Smart Filter) ---
export async function GET(request: Request) {
    await initAdmin();
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // e.g. ?status=pending

    try {
        let query = db.collection("join_requests").orderBy("createdAt", "desc");

        // ✅ ONLY filter if the frontend specifically asks for it
        if (statusFilter) {
            // @ts-ignore
            query = query.where("status", "==", statusFilter);
        }

        const snapshot = await query.get();

        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure fields exist to prevent crashes
            email: doc.data().email || "",
            officialIdUrl: doc.data().officialIdUrl || doc.data().idProofUrl || null,
        }));

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("Fetch Requests Error:", error);
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }
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
                        password: password || "Partner@123", // Default temp password
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
                    isVerified: true, // ✅ Mark as verified immediately
                    createdAt: new Date(),
                }, { merge: true });

            } catch (authError: any) {
                console.error("Auth Error:", authError);
                return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
            }

            // 2. Create the HOTEL Record (Auto-Approved)
            if (userId) {
                const hotelData = {
                    ownerId: userId,
                    ownerName: name, // ✅ Added for easy display
                    ownerEmail: email, // ✅ Added for easy display
                    name: hotelName || `${name}'s Hotel`,
                    description: "Welcome! Please update your hotel description in Settings.",
                    address: hotelAddress || "Address Pending",
                    city: "Mathura",
                    location: "Mathura", // Standardize field name
                    status: "approved", // ✅ Lowercase 'approved' matches your dashboard filter
                    pricePerNight: 0,
                    createdAt: new Date(),
                    imageUrls: [],
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
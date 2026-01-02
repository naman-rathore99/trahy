import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

// ✅ 1. POST: Handle Form Submission (Public)
export async function POST(request: Request) {
    await initAdmin();
    const db = getFirestore();

    try {
        const body = await request.json();
        const { name, email, phone, serviceType, officialIdUrl } = body;

        // Validation
        if (!name || !email || !officialIdUrl) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // ✅ FIX: Use 'join_requests' to match your Firebase Console
        const docRef = await db.collection("join_requests").add({
            name,
            email,
            phone: phone || "",
            serviceType: serviceType || "Hotel",
            officialIdUrl,
            status: "pending", // pending | approved | rejected
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            id: docRef.id,
            message: "Application submitted successfully"
        });

    } catch (error: any) {
        console.error("Error submitting request:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

// ✅ 2. GET: Fetch All Requests (For Admin)
export async function GET() {
    await initAdmin();
    const db = getFirestore();

    try {
        // ✅ FIX: Use 'join_requests' here too
        const snapshot = await db
            .collection("join_requests")
            .orderBy("createdAt", "desc")
            .get();

        const requests = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            // specific date handling for serialization
            createdAt: doc.data().createdAt?.toDate
                ? doc.data().createdAt.toDate().toISOString()
                : new Date().toISOString(),
        }));

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return NextResponse.json(
            { error: "Failed to fetch requests" },
            { status: 500 }
        );
    }
}
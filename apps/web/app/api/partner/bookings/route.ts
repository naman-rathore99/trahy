import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin"; // Ensure this matches your file path

export async function GET(request: Request) {
    try {
        // 1. Case-insensitive header check
        const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            console.error("❌ No Bearer token found in headers");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];

        // 2. Use adminAuth to verify the token
        // In your admin file, you exported adminAuth using a Proxy, 
        // so we call it normally here.
        const decodedToken = await adminAuth.verifyIdToken(token);
        const partnerId = decodedToken.uid;

        console.log(`✅ Authenticated Partner: ${partnerId}`);

        // 3. Fetch data
        const snapshot = await adminDb.collection("bookings")
            .where("partnerId", "==", partnerId)
            .where("status", "in", ["confirmed", "paid", "success"])
            .orderBy("createdAt", "desc")
            .get();

        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure dates are stringified for React Native
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
        }));

        return NextResponse.json({ success: true, bookings });

    } catch (error: any) {
        console.error("❌ Auth/API Error:", error.message);

        // Return 401 specifically if the token is expired/invalid
        const status = error.code?.includes('auth/') ? 401 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}
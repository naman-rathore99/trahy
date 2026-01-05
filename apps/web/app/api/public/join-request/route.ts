import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    await initAdmin();
    const db = getFirestore();

    try {
        const body = await request.json();
        const { name, email, phone, hotelName, serviceType, officialIdUrl } = body;

        // 1. Validation
        if (!email || !name || !officialIdUrl) {
            return NextResponse.json({ error: "Missing required fields (Name, Email, or ID)" }, { status: 400 });
        }

        // 2. Check if email already applied
        const existing = await db.collection("join_requests").where("email", "==", email).get();
        if (!existing.empty) {
            return NextResponse.json({ error: "A request with this email already exists." }, { status: 400 });
        }

        // 3. Create the Request
        const newRequest = {
            name,
            email,
            phone,
            hotelName: hotelName || "",
            serviceType: serviceType || "Hotel",
            officialIdUrl,
            status: "pending", // Default status
            createdAt: new Date(),
        };

        await db.collection("join_requests").add(newRequest);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
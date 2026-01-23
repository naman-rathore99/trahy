import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const db = adminDb;

    try {
        const body = await request.json();

        // =========================================================
        // 1. SMART MAPPING (Supports BOTH Website & Mobile)
        // =========================================================

        // EMAIL: Same for both
        const email = body.email;

        // OWNER NAME: 
        // Website sends 'name'. Mobile sends 'ownerName'.
        const finalOwnerName = body.name || body.ownerName;

        // PHONE: 
        // Website sends 'phone'. Mobile sends 'contactNumber'.
        const finalPhone = body.phone || body.contactNumber;

        // BUSINESS NAME:
        // Website sends 'hotelName'. Mobile sends 'name'.
        const finalHotelName = body.hotelName || body.name || "Not Provided";

        // ID URL:
        // Website sends 'officialIdUrl'. Mobile sends 'verificationImage'.
        const finalIdUrl = body.officialIdUrl || body.verificationImage || "";

        // ✅ NEW: CITY MAPPING
        // If the mobile app or website sends 'city', use it.
        // If they send nothing (old website version), default to "Mathura".
        const finalCity = body.city || "Mathura";

        // =========================================================
        // 2. VALIDATION
        // =========================================================
        if (!email || !finalOwnerName || !finalPhone) {
            return NextResponse.json(
                { error: "Missing required fields (Name, Email, or Phone)" },
                { status: 400 }
            );
        }

        // =========================================================
        // 3. DUPLICATE CHECK
        // =========================================================
        const existing = await db.collection("join_requests").where("email", "==", email).get();
        if (!existing.empty) {
            return NextResponse.json(
                { error: "A request with this email already exists." },
                { status: 400 }
            );
        }

        // =========================================================
        // 4. SAVE TO DATABASE (Using WEBSITE Schema)
        // =========================================================
        const newRequest = {
            // ✅ Keep existing keys exactly as they were
            name: finalOwnerName,
            email: email,
            phone: finalPhone,
            hotelName: finalHotelName,
            officialIdUrl: finalIdUrl,

            // ✅ Add the new field (Safe: it won't break the admin panel)
            city: finalCity,

            // Default Fields
            serviceType: body.serviceType || "Hotel",
            status: "pending",
            createdAt: new Date(),

            // Source Tracking
            source: body.verificationImage ? "Mobile App" : "Website",
            verificationId: body.verificationId || ""
        };

        const docRef = await db.collection("join_requests").add(newRequest);

        return NextResponse.json({
            success: true,
            message: "Request received successfully",
            requestId: docRef.id
        });

    } catch (error: any) {
        console.error("Join API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
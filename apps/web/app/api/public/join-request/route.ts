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
        // We prefer 'name' (Website style) for the database.
        const finalOwnerName = body.name || body.ownerName;

        // PHONE: 
        // Website sends 'phone'. Mobile sends 'contactNumber'.
        const finalPhone = body.phone || body.contactNumber;

        // BUSINESS NAME:
        // Website sends 'hotelName'. Mobile sends 'name'.
        // We map mobile's 'name' to 'hotelName' so Admin Panel sees it correctly.
        const finalHotelName = body.hotelName || body.name || "Not Provided";

        // ID URL:
        // Website sends 'officialIdUrl'. Mobile sends 'verificationImage'.
        const finalIdUrl = body.officialIdUrl || body.verificationImage || "";

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
            // ✅ We save using OLD keys so your Admin Panel works perfectly
            name: finalOwnerName,
            email: email,
            phone: finalPhone,
            hotelName: finalHotelName,
            officialIdUrl: finalIdUrl,

            // Default Fields
            serviceType: body.serviceType || "Hotel",
            status: "pending",
            createdAt: new Date(),

            // Extra: Track where it came from (Optional but helpful)
            source: body.verificationImage ? "Mobile App" : "Website",
            verificationId: body.verificationId || "" // Save extra mobile data just in case
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
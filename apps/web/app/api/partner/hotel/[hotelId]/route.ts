import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function PUT(request: Request, { params }: { params: { hotelId: string } }) {
    await initAdmin();
    const db = getFirestore();

    try {
        const { hotelId } = params;
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decodedToken = await getAuth().verifyIdToken(token);

        const body = await request.json();

        // Security: Ensure this partner OWNS this hotel
        const hotelRef = db.collection("hotels").doc(hotelId);
        const hotelDoc = await hotelRef.get();

        if (!hotelDoc.exists) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
        if (hotelDoc.data()?.ownerId !== decodedToken.uid) {
            return NextResponse.json({ error: "You do not own this property" }, { status: 403 });
        }

        // Update allowed fields
        await hotelRef.update({
            name: body.name,
            description: body.description,
            pricePerNight: Number(body.pricePerNight),
            location: body.location,
            imageUrl: body.imageUrl,
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
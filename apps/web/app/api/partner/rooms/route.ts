import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

// GET: Fetch all rooms for a specific hotel
export async function GET(request: Request) {
    await initAdmin();
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId) return NextResponse.json({ error: "Hotel ID required" }, { status: 400 });

    try {
        // 1. Auth Check
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2. Fetch Rooms Sub-collection
        const snapshot = await db.collection("hotels").doc(hotelId).collection("rooms").get();
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ rooms });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a new room
export async function POST(request: Request) {
    await initAdmin();
    const db = getFirestore();

    try {
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decodedToken = await getAuth().verifyIdToken(token);

        const body = await request.json();
        const { hotelId, title, price, capacity, amenities } = body;

        // 1. Verify Ownership
        const hotelRef = db.collection("hotels").doc(hotelId);
        const hotelDoc = await hotelRef.get();

        if (!hotelDoc.exists) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
        if (hotelDoc.data()?.ownerId !== decodedToken.uid) {
            return NextResponse.json({ error: "You do not own this hotel" }, { status: 403 });
        }

        // 2. Add Room
        const newRoom = {
            title,
            price: Number(price),
            capacity: Number(capacity),
            amenities: amenities || [], // Array of strings e.g. ["AC", "Wifi"]
            available: true,
            createdAt: new Date()
        };

        const roomRef = await hotelRef.collection("rooms").add(newRoom);

        return NextResponse.json({ success: true, id: roomRef.id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a room
export async function DELETE(request: Request) {
    await initAdmin();
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");
    const roomId = searchParams.get("roomId");

    if (!hotelId || !roomId) return NextResponse.json({ error: " IDs required" }, { status: 400 });

    try {
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await db.collection("hotels").doc(hotelId).collection("rooms").doc(roomId).delete();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
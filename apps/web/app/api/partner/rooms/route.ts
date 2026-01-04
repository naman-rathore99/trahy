import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

// Helper: Get User ID from Token
async function getUserId(request: Request) {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return null;
    try {
        await initAdmin();
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        return null;
    }
}

// --- GET: Fetch Rooms for Current User's Hotel ---
export async function GET(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = getFirestore();

        // 1. Find the User's Hotel first
        const hotelSnapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (hotelSnapshot.empty) {
            // STOP HERE: If no hotel, return empty list (don't crash!)
            return NextResponse.json({ rooms: [] });
        }

        const hotelId = hotelSnapshot.docs[0].id;

        // 2. Fetch Rooms specifically for this Hotel
        // We assume rooms are stored as a subcollection: hotels/{hotelId}/rooms
        const roomsSnapshot = await db
            .collection("hotels")
            .doc(hotelId)
            .collection("rooms")
            .get();

        const rooms = roomsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ rooms });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: Add a New Room ---
export async function POST(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = getFirestore();
        const body = await request.json();

        // 1. Find the User's Hotel
        const hotelSnapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (hotelSnapshot.empty) {
            return NextResponse.json({ error: "You must create a Hotel Profile first." }, { status: 400 });
        }

        const hotelId = hotelSnapshot.docs[0].id;

        // 2. Add Room to Subcollection
        const newRoom = {
            ...body,
            createdAt: new Date(),
        };

        const ref = await db
            .collection("hotels")
            .doc(hotelId)
            .collection("rooms")
            .add(newRoom);

        return NextResponse.json({ success: true, id: ref.id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
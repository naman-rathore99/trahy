import { NextResponse } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore"; // ✅ Added FieldValue
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";;

// Helper: Get User ID from Token
async function getUserId(request: Request) {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return null;
    try {
        // initAdmin auto-initialized
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

        const db = adminDb;

        // 1. Find the User's Hotel first
        const hotelSnapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (hotelSnapshot.empty) {
            return NextResponse.json({ rooms: [] });
        }

        const hotelId = hotelSnapshot.docs[0].id;

        // 2. Fetch Rooms specifically for this Hotel
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

// --- POST: Add a New Room AND Update Hotel Amenities ---
export async function POST(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = adminDb;
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

        // ---------------------------------------------------------
        // ✅ NEW LOGIC: Bubble Up Amenities to Main Hotel
        // ---------------------------------------------------------
        if (body.amenities && Array.isArray(body.amenities) && body.amenities.length > 0) {
            console.log("Syncing amenities to hotel:", body.amenities);

            // This adds the new amenities to the Hotel document WITHOUT overwriting existing ones
            await db.collection("hotels").doc(hotelId).update({
                amenities: FieldValue.arrayUnion(...body.amenities)
            });
        }
        // ---------------------------------------------------------

        return NextResponse.json({ success: true, id: ref.id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";

// Helper: Get User ID from Token
async function getUserId(request: Request) {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return null;
    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        return null;
    }
}

// --- GET: Fetch Rooms ---
export async function GET(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = adminDb;
        const hotelSnapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (hotelSnapshot.empty) {
            return NextResponse.json({ rooms: [] });
        }

        const hotelId = hotelSnapshot.docs[0].id;
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

        const db = adminDb;
        const body = await request.json();

        const hotelSnapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (hotelSnapshot.empty) {
            return NextResponse.json({ error: "You must create a Hotel Profile first." }, { status: 400 });
        }

        const hotelId = hotelSnapshot.docs[0].id;

        const newRoom = {
            ...body,
            createdAt: new Date(),
        };

        const ref = await db
            .collection("hotels")
            .doc(hotelId)
            .collection("rooms")
            .add(newRoom);

        // Bubble Up Amenities to Main Hotel
        if (body.amenities && Array.isArray(body.amenities) && body.amenities.length > 0) {
            await db.collection("hotels").doc(hotelId).update({
                amenities: FieldValue.arrayUnion(...body.amenities)
            });
        }

        return NextResponse.json({ success: true, id: ref.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- PUT: Edit an Existing Room ---
export async function PUT(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = adminDb;
        const body = await request.json();

        // Extract the room ID from the body, and keep the rest as updateData
        const { id: roomId, ...updateData } = body;

        if (!roomId) {
            return NextResponse.json({ error: "Room ID is required to update" }, { status: 400 });
        }

        const hotelSnapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (hotelSnapshot.empty) {
            return NextResponse.json({ error: "Hotel not found." }, { status: 400 });
        }

        const hotelId = hotelSnapshot.docs[0].id;

        // Update the specific room document
        await db
            .collection("hotels")
            .doc(hotelId)
            .collection("rooms")
            .doc(roomId)
            .update({
                ...updateData,
                updatedAt: new Date()
            });

        // Bubble Up Amenities to Main Hotel
        if (updateData.amenities && Array.isArray(updateData.amenities) && updateData.amenities.length > 0) {
            await db.collection("hotels").doc(hotelId).update({
                amenities: FieldValue.arrayUnion(...updateData.amenities)
            });
        }

        return NextResponse.json({ success: true, message: "Room updated successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- DELETE: Remove a Room ---
export async function DELETE(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = adminDb;
        // Grab the roomId from the URL parameters (e.g., ?roomId=123)
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get("roomId");

        if (!roomId) {
            return NextResponse.json({ error: "Room ID is required to delete" }, { status: 400 });
        }

        const hotelSnapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (hotelSnapshot.empty) {
            return NextResponse.json({ error: "Hotel not found." }, { status: 400 });
        }

        const hotelId = hotelSnapshot.docs[0].id;

        // Delete the room document
        await db
            .collection("hotels")
            .doc(hotelId)
            .collection("rooms")
            .doc(roomId)
            .delete();

        return NextResponse.json({ success: true, message: "Room deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
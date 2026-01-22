import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// 1. GET Rooms (Admin can fetch ANY hotel's rooms)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId) return NextResponse.json({ error: "Hotel ID required" }, { status: 400 });

    const roomsSnapshot = await adminDb
      .collection("hotels")
      .doc(hotelId)
      .collection("rooms")
      .get();

    const rooms = roomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ rooms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST (Admin can add rooms to ANY hotel)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotelId, ...roomData } = body;

    if (!hotelId) return NextResponse.json({ error: "Hotel ID required" }, { status: 400 });

    const newRoom = { ...roomData, createdAt: new Date() };

    const ref = await adminDb
      .collection("hotels")
      .doc(hotelId)
      .collection("rooms")
      .add(newRoom);

    // Sync amenities to main hotel doc
    if (roomData.amenities && Array.isArray(roomData.amenities)) {
        await adminDb.collection("hotels").doc(hotelId).update({
            amenities: FieldValue.arrayUnion(...roomData.amenities)
        });
    }

    return NextResponse.json({ success: true, id: ref.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PUT (Update Room)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const hotelId = searchParams.get("hotelId");
    const body = await request.json();
    
    // Remove IDs from body to prevent overwriting
    const { id, hotelId: _h, ...updateData } = body;

    if (!roomId || !hotelId) return NextResponse.json({ error: "IDs required" }, { status: 400 });

    await adminDb
      .collection("hotels")
      .doc(hotelId)
      .collection("rooms")
      .doc(roomId)
      .update({ ...updateData, updatedAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE (Remove Room)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");
    const roomId = searchParams.get("roomId");

    if (!hotelId || !roomId) return NextResponse.json({ error: "IDs required" }, { status: 400 });

    await adminDb
      .collection("hotels")
      .doc(hotelId)
      .collection("rooms")
      .doc(roomId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
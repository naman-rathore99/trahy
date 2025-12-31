import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

// 1. GET: Fetch all rooms for a specific hotel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await initAdmin();
    const db = getFirestore();

    const snapshot = await db
      .collection("hotels")
      .doc(id)
      .collection("rooms")
      .get();

    const rooms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// 2. POST: Add a new room to the hotel
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await initAdmin();
    const db = getFirestore();

    const newRoom = {
      ...body,
      createdAt: new Date(),
    };

    const docRef = await db
      .collection("hotels")
      .doc(id)
      .collection("rooms")
      .add(newRoom);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add room" }, { status: 500 });
  }
}

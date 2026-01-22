import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// 1. GET Single Hotel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log(`🔍 Admin fetching hotel with ID: ${id}`); // DEBUG LOG

    const db = adminDb;
    const docRef = db.collection("hotels").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.error(`❌ Hotel ID ${id} not found in Firestore.`);
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const hotelData = docSnap.data();
    console.log(`✅ Found Hotel: ${hotelData?.name}`);

    return NextResponse.json({
      hotel: {
        id: docSnap.id,
        ...hotelData,
      },
    });
  } catch (error: any) {
    console.error("🔥 Get Hotel Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// 2. PUT (Update) Hotel
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = adminDb;

    // Prevent overwriting the ID
    const { id: _, ...updateData } = body;

    await db.collection("hotels").doc(id).update({
      ...updateData,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update Hotel Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// 3. DELETE Hotel
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = adminDb;

    await db.collection("hotels").doc(id).delete();

    return NextResponse.json({ success: true, message: "Hotel deleted" });
  } catch (error: any) {
    console.error("Delete Hotel Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
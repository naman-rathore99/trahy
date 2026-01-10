import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin"; // ✅ Import adminDb only

// 1. PUT: Update a specific vehicle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // ❌ OLD LINES REMOVED:
    // await initAdmin();
    // const db = getFirestore();

    // Remove 'id' from body to allow Firestore update
    const { id: _, ...updateData } = body;

    // ✅ USE adminDb DIRECTLY
    await adminDb.collection("vehicles").doc(id).update({
      ...updateData,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

// 2. DELETE: Remove a vehicle
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ❌ OLD LINES REMOVED:
    // await initAdmin();
    // const db = getFirestore();

    // ✅ USE adminDb DIRECTLY
    await adminDb.collection("vehicles").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
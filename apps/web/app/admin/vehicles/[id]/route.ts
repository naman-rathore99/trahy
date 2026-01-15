// app/api/admin/vehicles/[id]/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// ✅ Add this to prevent static optimization
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Firebase Admin

// 1. PUT: Update a specific vehicle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { id: _, ...updateData } = body;

    await adminDb
      .collection("vehicles")
      .doc(id)
      .update({
        ...updateData,
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 }
    );
  }
}

// 2. DELETE: Remove a vehicle
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await adminDb.collection("vehicles").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}

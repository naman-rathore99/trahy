import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";;
``

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // initAdmin auto-initialized
    const db = adminDb;

    const newVehicle = {
      ...body,
      createdAt: new Date(),
    };

    const docRef = await db.collection("vehicles").add(newVehicle);
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}
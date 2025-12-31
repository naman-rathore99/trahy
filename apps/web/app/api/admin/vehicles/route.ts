import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await initAdmin();
    const db = getFirestore();

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
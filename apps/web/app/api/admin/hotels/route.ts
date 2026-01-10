import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";;
``

// ⚠️ FORCE DYNAMIC: Prevents Next.js from caching old data
export const dynamic = "force-dynamic";

// 1. GET: Fetch ALL Hotels
export async function GET() {
  try {
    // initAdmin auto-initialized
    const db = adminDb;

    const snapshot = await db.collection("hotels").get();

    const hotels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("Admin Hotels API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. POST: Create a NEW Hotel
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // initAdmin auto-initialized
    const db = adminDb;

    // Create a new document with an auto-generated ID
    const docRef = await db.collection("hotels").add({
      ...body,
      createdAt: new Date(),
      status: "pending", // Default status
      amenities: [], // Default empty array
      imageUrls: [], // Default empty array
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Create Hotel Error:", error);
    return NextResponse.json(
      { error: "Failed to create hotel" },
      { status: 500 }
    );
  }
}

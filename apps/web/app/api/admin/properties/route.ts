import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";
import { headers } from "next/headers";

// GET: Fetch All Hotels + Owner Details
export async function GET() {
  await initAdmin();
  const db = getFirestore();
  const auth = getAuth();

  try {
    // 1. Get all hotels
    const snapshot = await db
      .collection("hotels")
      .orderBy("createdAt", "desc")
      .get();

    // 2. Map through hotels and find their owners
    const properties = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let ownerName = "Unknown";
        let ownerEmail = "No Email";

        // If hotel has an ownerId, fetch their name from Auth
        if (data.ownerId) {
          try {
            const userRecord = await auth.getUser(data.ownerId);
            ownerName = userRecord.displayName || "No Name";
            ownerEmail = userRecord.email || "No Email";
          } catch (e) {
            console.log(`Could not find owner for hotel ${doc.id}`);
          }
        }

        return {
          id: doc.id,
          ...data,
          ownerName,
          ownerEmail,
          // Convert timestamp to readable date if needed
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
        };
      })
    );

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Add a New Hotel (Fixes the "Missing Partner" issue)
export async function POST(request: Request) {
  await initAdmin();
  const db = getFirestore();
  const auth = getAuth();

  try {
    // 1. Verify who is trying to add the hotel
    const headerList = await headers();
    const authHeader = headerList.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid; // <--- This is YOU

    // 2. Parse the form data
    const body = await request.json();

    // 3. Save to Database with ownerId
    const newHotel = {
      ...body,
      ownerId: userId, // ✅ CRITICAL: This links the hotel to you
      status: "approved", // Admins auto-approve their own listings
      createdAt: new Date(),
      rating: 0,
      reviews: 0,
    };

    const docRef = await db.collection("hotels").add(newHotel);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Hotel added successfully",
    });
  } catch (error) {
    console.error("Error adding property:", error);
    return NextResponse.json(
      { error: "Failed to add property" },
      { status: 500 }
    );
  }
}

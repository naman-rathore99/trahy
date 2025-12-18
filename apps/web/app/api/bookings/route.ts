import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  await initAdmin();
  const db = getFirestore();
  const auth = getAuth();

  try {
    // 1. Security: Get the User ID from the Token
    // The frontend apiRequest automatically sends the "Authorization: Bearer <token>"
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get the Booking Data
    const body = await request.json();
    const {
      listingId,
      listingName,
      listingImage,
      checkIn,
      checkOut,
      guests,
      totalAmount,
      serviceType,
    } = body;

    // 3. Save to "bookings" collection in Firestore
    const bookingRef = await db.collection("bookings").add({
      userId, // Important: This links the booking to the user!
      listingId,
      listingName,
      listingImage: listingImage || "",
      serviceType: serviceType || "hotel",
      checkIn,
      checkOut,
      guests,
      totalAmount,
      status: "confirmed", // You can change this to 'pending' if you want payment logic later
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, bookingId: bookingRef.id });
  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// --- ADD THIS NEW GET FUNCTION ---
export async function GET(request: Request) {
  await initAdmin();
  const db = getFirestore();
  const auth = getAuth();

  try {
    // 1. Verify User Token (Security Check)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid; // <--- This is the logged-in user's ID

    // 2. Query ONLY this user's bookings
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("userId", "==", userId) // <--- The Filter Magic
      .orderBy("createdAt", "desc") // Show newest first
      .get();

    const bookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
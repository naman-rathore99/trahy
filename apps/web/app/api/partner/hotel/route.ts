import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

// Helper: Verify Token & Get User ID
async function getUserId(request: Request) {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return null;
    try {
        await initAdmin();
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        return null;
    }
}

// --- 1. GET: Fetch My Hotel ---
export async function GET(request: Request) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getFirestore();

    // Find the hotel owned by this user
    const snapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

    if (snapshot.empty) {
        return NextResponse.json({ error: "No hotel found" }, { status: 404 });
    }

    // Return the first (and only) hotel found
    const doc = snapshot.docs[0];
    return NextResponse.json({ hotel: { id: doc.id, ...doc.data() } });
}

// --- 2. POST: Create New Hotel ---
export async function POST(request: Request) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getFirestore();
    const body = await request.json();

    // Check if user already has a hotel
    const existing = await db.collection("hotels").where("ownerId", "==", userId).get();
    if (!existing.empty) {
        return NextResponse.json({ error: "You already have a hotel listed" }, { status: 400 });
    }

    // Create Hotel
    const newHotel = {
        ownerId: userId,
        name: body.name,
        description: body.description,
        address: body.address,
        city: body.city || "Mathura",
        email: body.email,
        phone: body.phone,
        mainImage: body.mainImage || "",
        images: body.images || [],
        amenities: body.amenities || [],
        createdAt: new Date(),
        status: "PENDING",
    };

    const ref = await db.collection("hotels").add(newHotel);

    return NextResponse.json({ success: true, hotelId: ref.id });
}

// --- 3. PUT: Update My Hotel ---
export async function PUT(request: Request) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getFirestore();
    const body = await request.json();

    // Find the user's hotel
    const snapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

    if (snapshot.empty) {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const docId = snapshot.docs[0].id;

    // Update
    await db.collection("hotels").doc(docId).update({
        name: body.name,
        description: body.description,
        address: body.address,
        city: body.city,
        email: body.email,
        phone: body.phone,
        mainImage: body.mainImage,
        images: body.images,
        amenities: body.amenities,
        updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
}
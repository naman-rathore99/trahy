import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

// Helper: Verify Token & Get User ID
async function getUserId(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split("Bearer ")[1];
    try {
        await initAdmin();
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error("Auth Token Verify Error:", error);
        return null;
    }
}

// --- 1. GET: Fetch My Hotel ---
export async function GET(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = getFirestore();

        // Find the hotel owned by this user
        const snapshot = await db.collection("hotels").where("ownerId", "==", userId).limit(1).get();

        if (snapshot.empty) {
            return NextResponse.json({ error: "No hotel found" }, { status: 404 });
        }

        const doc = snapshot.docs[0];
        return NextResponse.json({ hotel: { id: doc.id, ...doc.data() } });
    } catch (error: any) {
        console.error("GET Hotel Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

// --- 2. POST: Create New Hotel ---
export async function POST(request: Request) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const db = getFirestore();
        const body = await request.json();

        // Check if user already has a hotel
        const existing = await db.collection("hotels").where("ownerId", "==", userId).get();
        if (!existing.empty) {
            return NextResponse.json({ error: "You already have a hotel listed" }, { status: 400 });
        }

        // Create Hotel (Ensure no undefined values)
        const newHotel = {
            ownerId: userId,
            name: body.name || "New Hotel",
            description: body.description || "",
            address: body.address || "",
            city: body.city || "Mathura",
            email: body.email || "",
            phone: body.phone || "",
            mainImage: body.mainImage || "",
            images: body.images || [],
            amenities: body.amenities || [],
            createdAt: new Date(),
            status: "PENDING",
        };

        const ref = await db.collection("hotels").add(newHotel);
        return NextResponse.json({ success: true, hotelId: ref.id });

    } catch (error: any) {
        console.error("POST Hotel Error:", error);
        return NextResponse.json({ error: "Failed to create hotel" }, { status: 500 });
    }
}

// --- 3. PUT: Update My Hotel (FIXED MAPPING) ---
export async function PUT(request: Request) {
    try {
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

        const updateData: any = { updatedAt: new Date() };

        // ✅ STANDARD MAPPING:
        // Use 'imageUrl' (singular) for the main cover image
        // Use 'imageUrls' (plural) for the gallery

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.city !== undefined) updateData.city = body.city;
        if (body.email !== undefined) updateData.ownerEmail = body.email; // Save as ownerEmail for admin view
        if (body.phone !== undefined) updateData.phone = body.phone;

        // FIX: Map 'mainImage' from form to 'imageUrl' in DB
        if (body.mainImage !== undefined) updateData.imageUrl = body.mainImage;

        // FIX: Map 'images' from form to 'imageUrls' in DB
        if (body.images !== undefined) updateData.imageUrls = body.images;

        if (body.amenities !== undefined) updateData.amenities = body.amenities;
        if (body.pricePerNight !== undefined) updateData.pricePerNight = Number(body.pricePerNight);

        await db.collection("hotels").doc(docId).update(updateData);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("PUT Hotel Error:", error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
    }
}
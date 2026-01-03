import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

// GET: Fetch Partner's Vehicles
export async function GET(request: Request) {
    await initAdmin();
    const db = getFirestore();

    try {
        // 1. Auth Check
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decodedToken = await getAuth().verifyIdToken(token);

        // 2. Fetch Vehicles where ownerId == current user
        const snapshot = await db.collection("vehicles")
            .where("ownerId", "==", decodedToken.uid)
            .orderBy("createdAt", "desc")
            .get();

        const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ vehicles });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add New Vehicle
export async function POST(request: Request) {
    await initAdmin();
    const db = getFirestore();

    try {
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decodedToken = await getAuth().verifyIdToken(token);

        const body = await request.json();
        const { number, model, driver, status, eta } = body;

        if (!number || !model) return NextResponse.json({ error: "Details required" }, { status: 400 });

        const newVehicle = {
            ownerId: decodedToken.uid,
            number,
            model,
            driver: driver || "Unassigned",
            status: status || "Available", // Available, On Trip, Maintenance
            eta: eta || "On Station",
            createdAt: new Date()
        };

        const docRef = await db.collection("vehicles").add(newVehicle);

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
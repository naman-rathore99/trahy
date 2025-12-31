import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic"; // Forces fresh data

export async function GET() {
    try {
        await initAdmin();
        const db = getFirestore();
        const snapshot = await db.collection("vehicles").get();

        const vehicles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ vehicles });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
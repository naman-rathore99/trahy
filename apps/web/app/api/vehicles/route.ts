import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
``

export const dynamic = "force-dynamic"; // Forces fresh data

export async function GET() {
    try {
        // initAdmin auto-initialized
        const db = adminDb;
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
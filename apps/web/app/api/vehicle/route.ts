import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; // ✅ Sirf DB import karein

export async function GET() {
    try {
        // ❌ initAdmin() ki ab zaroorat nahi hai

        const snapshot = await adminDb.collection('hotels').get();

        const hotels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(hotels);
    } catch (error: any) {
        console.error("🔥 Backend Error (Stays):", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
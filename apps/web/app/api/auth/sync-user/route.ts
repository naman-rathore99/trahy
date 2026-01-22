import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, email, displayName, photoURL, phone } = body;

        if (!uid || !email) {
            return NextResponse.json({ error: "Missing UID or Email" }, { status: 400 });
        }

        // Reference to the user document
        const userRef = adminDb.collection("users").doc(uid);
        const doc = await userRef.get();

        // If user doesn't exist in DB, create them
        if (!doc.exists) {
            await userRef.set({
                uid,
                email,
                displayName: displayName || "User",
                photoURL: photoURL || "",
                phoneNumber: phone || "",
                role: "user", // Default role
                createdAt: new Date(),
                platform: "mobile", // specific tag to know they came from app
                isActive: true,
            });
        } else {
            // If they exist, just update last login
            await userRef.update({
                lastLogin: new Date(),
            });
        }

        return NextResponse.json({ success: true, message: "User Synced" });

    } catch (error: any) {
        console.error("Sync User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
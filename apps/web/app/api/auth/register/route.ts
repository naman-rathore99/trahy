import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";; // Aapki existing init file
import { getAuth } from "firebase-admin/auth";
``

export async function POST(request: Request) {
    // initAdmin auto-initialized
    const db = adminDb;
    const auth = getAuth();

    try {
        const { name, email, phone, password, role } = await request.json();

        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Create User in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            phoneNumber: phone || undefined, // Optional
        });

        // 2. Set Custom Role (Claims) -> 'user' or 'partner'
        await auth.setCustomUserClaims(userRecord.uid, { role });

        // 3. Save User Details in Firestore Database
        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            phone: phone || "",
            role, // Important
            createdAt: new Date(),
            isVerified: role === "user" ? true : false, // Users verified by default, Partners need approval
            status: "active"
        });

        return NextResponse.json({ success: true, message: "User created successfully" });

    } catch (error: any) {
        console.error("Signup Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
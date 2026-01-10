import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";;
``
import axios from "axios";

export async function POST(request: Request) {
    // initAdmin auto-initializedinitialized
    const db = adminDb;

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        // 1. Verify Password using Firebase REST API
        // Ensure FIREBASE_API_KEY is in your .env file
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Server Error: API Key missing" }, { status: 500 });
        }

        const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

        let firebaseResponse;
        try {
            firebaseResponse = await axios.post(verifyUrl, {
                email,
                password,
                returnSecureToken: true,
            });
        } catch (err: any) {
            // Wrong password or user not found
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const { idToken, localId } = firebaseResponse.data;

        // 2. Fetch User Details from Firestore
        // (Taaki hum App ko bata sakein ki ye Partner hai ya User)
        const userDoc = await db.collection("users").doc(localId).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        const userData = userDoc.data();

        // 3. Return Token & Data
        return NextResponse.json({
            success: true,
            token: idToken,
            user: {
                uid: localId,
                name: userData?.name,
                email: userData?.email,
                role: userData?.role, // 'partner' | 'user' | 'admin'
                isVerified: userData?.isVerified
            }
        });

    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
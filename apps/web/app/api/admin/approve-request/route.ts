import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth"; // 1. Import Auth
import { initAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    await initAdmin();
    const db = getFirestore();
    const auth = getAuth(); // 2. Initialize Auth

    try {
        const body = await request.json();
        const { requestId, status, email, password, name } = body;

        // 3. Validation
        if (!requestId || !status) {
            return NextResponse.json(
                { error: "Missing Request ID or Status" },
                { status: 400 }
            );
        }

        // 4. If Status is APPROVED, Create User Account
        if (status === "approved") {
            // We need email and password to create an account
            if (!email || !password) {
                return NextResponse.json(
                    { error: "Email and Password are required to approve partner" },
                    { status: 400 }
                );
            }

            try {
                // A. Create Authentication User (Login)
                const userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: name,
                    emailVerified: true, // Auto-verify since Admin approved it
                });

                // B. Set "partner" Role
                await auth.setCustomUserClaims(userRecord.uid, { role: "partner" });

                // C. Create User Document in 'users' collection (Database)
                await db.collection("users").doc(userRecord.uid).set({
                    uid: userRecord.uid,
                    name: name,
                    email: email,
                    role: "partner",
                    createdAt: new Date(),
                    approvedBy: "admin", // Optional audit trail
                });

                console.log(`✅ User created: ${email} (${userRecord.uid})`);

            } catch (authError: any) {
                // Handle case where user might already exist
                console.warn("⚠️ User creation warning:", authError.message);
                // We continue executing to update the request status, 
                // even if the user account already existed.
            }
        }

        // 5. Update Request Status in 'join_requests'
        const requestRef = db.collection("join_requests").doc(requestId);
        await requestRef.update({
            status: status, // 'approved' or 'rejected'
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: `Request ${status} successfully. User account created (if approved).`
        });

    } catch (error: any) {
        console.error("❌ Error updating request:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
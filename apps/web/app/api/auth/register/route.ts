import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { sendWelcomeEmail } from "@/lib/mail"; // <--- 1. Import this

export async function POST(request: Request) {
  const db = adminDb;
  const auth = getAuth();

  try {
    const { name, email, phone, password, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Create User in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone || undefined,
    });

    // 2. Set Custom Role
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Save User Details in Firestore
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        name,
        email,
        phone: phone || "",
        role,
        createdAt: new Date(),
        isVerified: role === "user" ? true : false,
        status: "active",
      });

    // 4. SEND WELCOME EMAIL 📧
    // We don't await this so the API responds faster to the user
    sendWelcomeEmail(email, name, role as "user" | "partner").catch((err) =>
      console.error("Failed to send welcome email:", err),
    );

    return NextResponse.json({
      success: true,
      message: "User created successfully",
    });
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { sendWelcomeEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const db = adminDb;
  const auth = getAuth();

  try {
    // Now expecting 'otp' in the body
    const { name, email, phone, password, role, otp } = await request.json();

    if (!email || !password || !name || !role || !otp) {
      return NextResponse.json(
        { error: "Missing required fields (including OTP)" },
        { status: 400 },
      );
    }

    // =====================================================
    // 🔐 STEP 1: VERIFY OTP
    // =====================================================
    const otpRef = db.collection("otps").doc(email);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    const otpData = otpDoc.data();
    const now = new Date();
    const expiresAt = new Date(otpData?.expiresAt);

    // Check if OTP matches
    if (otpData?.code !== otp) {
      return NextResponse.json(
        { error: "Incorrect OTP code" },
        { status: 400 },
      );
    }

    // Check if OTP is expired
    if (now > expiresAt) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // OTP is valid! Delete it so it can't be reused
    await otpRef.delete();

    // =====================================================
    // 🚀 STEP 2: CREATE USER (Existing Logic)
    // =====================================================

    // Create User in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone || undefined,
    });

    // Set Role
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // Save to Database
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
        isVerified: role === "user", // Users auto-verified via OTP
        status: "active",
      });

    // =====================================================
    // 📧 STEP 3: SEND WELCOME EMAIL
    // =====================================================
    sendWelcomeEmail(email, name, role as "user" | "partner").catch((err) =>
      console.error("Failed to welcome email:", err),
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

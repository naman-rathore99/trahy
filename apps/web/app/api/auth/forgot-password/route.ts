import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin"; // Ensure this path matches your project
import { getAuth } from "firebase-admin/auth";

export async function POST(request: Request) {
  const db = adminDb;
  const auth = getAuth();

  try {
    // Expect email, otp, and the NEW password
    const { email, otp, password } = await request.json();

    if (!email || !otp || !password) {
      return NextResponse.json(
        { error: "Missing email, OTP, or new password" },
        { status: 400 },
      );
    }

    // =====================================================
    // 🔐 STEP 1: VERIFY OTP (Exact same logic as Signup)
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
    const expiresAt = new Date(otpData?.expiresAt); // Ensure your OTP saver stores this as ISO string or Timestamp

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

    // OTP is valid! Delete it immediately to prevent reuse
    await otpRef.delete();

    // =====================================================
    // 🔄 STEP 2: UPDATE PASSWORD (Admin SDK)
    // =====================================================

    // 1. Get the user by email to find their UID
    const userRecord = await auth.getUserByEmail(email);

    // 2. Update the password
    await auth.updateUser(userRecord.uid, {
      password: password,
    });

    // 3. Security: Revoke all refresh tokens
    // This forces the user to log in again on all devices with the new password
    await auth.revokeRefreshTokens(userRecord.uid);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);

    // Handle case where user doesn't exist
    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "No user found with this email" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

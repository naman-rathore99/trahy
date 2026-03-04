import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin"; // ✅ Use proxied adminAuth

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || !otp || !password) {
      return NextResponse.json(
        { error: "Missing email, OTP, or new password" },
        { status: 400 },
      );
    }

    // =====================================================
    // 🔐 STEP 1: VERIFY OTP
    // =====================================================
    const otpRef = adminDb.collection("otps").doc(email);
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

    if (otpData?.code !== otp) {
      return NextResponse.json(
        { error: "Incorrect OTP code" },
        { status: 400 },
      );
    }

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    await otpRef.delete();

    // =====================================================
    // 🔄 STEP 2: UPDATE PASSWORD
    // =====================================================
    const userRecord = await adminAuth.getUserByEmail(email);

    await adminAuth.updateUser(userRecord.uid, { password });

    await adminAuth.revokeRefreshTokens(userRecord.uid);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);

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
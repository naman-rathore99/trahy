import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { sendWelcomeEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const db = adminDb;
  const auth = getAuth();

  try {
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
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const otpData = otpDoc.data();
    const now = new Date();
    const expiresAt = new Date(otpData?.expiresAt);

    if (otpData?.code !== otp) {
      return NextResponse.json({ error: "Incorrect OTP code" }, { status: 400 });
    }

    if (now > expiresAt) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    await otpRef.delete();

    // =====================================================
    // 🧹 STEP 1.5: FORMAT PHONE NUMBER FOR FIREBASE (E.164)
    // =====================================================
    let formattedPhone = undefined;

    if (phone && typeof phone === "string" && phone.trim() !== "") {
      // Strip everything except digits and the plus sign
      const cleanPhone = phone.replace(/[^\d+]/g, "");

      if (cleanPhone.startsWith("+")) {
        formattedPhone = cleanPhone; // Perfect, already E.164
      } else if (cleanPhone.length === 10) {
        formattedPhone = `+91${cleanPhone}`; // Standard 10-digit Indian number
      } else {
        formattedPhone = `+${cleanPhone}`; // Fallback (e.g., they typed 919876543210)
      }
    }

    // =====================================================
    // 🚀 STEP 2: CREATE USER 
    // =====================================================

    // Create User in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      // Safely inject the phone number ONLY if we successfully formatted it
      ...(formattedPhone && { phoneNumber: formattedPhone }),
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
        phone: formattedPhone || phone || "", // Save formatted version to DB if we have it
        role,
        createdAt: new Date(),
        isVerified: role === "user",
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
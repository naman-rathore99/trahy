import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save to Firestore (Collection: 'otps')
    // We use the email as the Document ID so we can easily find it later
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes expiry

    await adminDb.collection("otps").doc(email).set({
      code: otp,
      expiresAt: expiresAt.toISOString(),
    });

    // 3. Send Email
    await sendOtpEmail(email, otp);

    return NextResponse.json({ success: true, message: "OTP sent to email" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

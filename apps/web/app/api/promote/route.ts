import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET() {
  await initAdmin();
  const auth = getAuth();

  // YOUR SPECIFIC USER ID (From the data you sent me)
  const myUid = "4dGTqKtETxOor0tQBhK8mJCPrw63";

  try {
    // 1. Force the 'admin' label onto your account
    await auth.setCustomUserClaims(myUid, { role: "admin" });

    return NextResponse.json({
      message: "SUCCESS! You are now an Admin.",
      instruction: "Please LOG OUT and LOG BACK IN to see the changes.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendWelcomeEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = adminDb;
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  try {
    let query = db.collection("join_requests").orderBy("createdAt", "desc");

    if (statusFilter) {
      // @ts-ignore
      query = query.where("status", "==", statusFilter);
    }

    const snapshot = await query.get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      email: doc.data().email || "",
      officialIdUrl: doc.data().officialIdUrl || doc.data().idProofUrl || null,
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch Requests Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}

// --- PUT: Approve/Reject & Create User ---
export async function PUT(request: Request) {
  const db = adminDb;
  const auth = getAuth();

  try {
    const body = await request.json();
    const {
      requestId,
      status,
      email,
      password,
      name,
      hotelName,
      hotelAddress,
      phone,
    } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "Missing ID or Status" },
        { status: 400 },
      );
    }

    if (status === "APPROVED") {
      let userId = "";
      // ✅ Capture the password used (Default OR Custom)
      const finalPassword = password || "Partner@123";

      // 1. Create the User Account (Login)
      try {
        // Check if user exists first to avoid error
        try {
          const existingUser = await auth.getUserByEmail(email);
          userId = existingUser.uid;
        } catch (e) {
          // User doesn't exist, create new
          const userRecord = await auth.createUser({
            email,
            password: finalPassword, // Use the captured password
            displayName: name,
            emailVerified: true,
          });
          userId = userRecord.uid;
        }

        // Set Role
        await auth.setCustomUserClaims(userId, { role: "partner" });

        // Save User to DB
        await db.collection("users").doc(userId).set(
          {
            uid: userId,
            name,
            email,
            phone,
            role: "partner",
            isVerified: true,
            createdAt: new Date(),
          },
          { merge: true },
        );
      } catch (authError: any) {
        console.error("Auth Error:", authError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 },
        );
      }

      // 2. Create the HOTEL Record (Auto-Approved)
      if (userId) {
        const hotelData = {
          ownerId: userId,
          ownerName: name,
          ownerEmail: email,
          name: hotelName || `${name}'s Hotel`,
          description:
            "Welcome! Please update your hotel description in Settings.",
          address: hotelAddress || "Address Pending",
          city: "Mathura",
          location: "Mathura",
          status: "approved", // Matches your dashboard filter
          pricePerNight: 0,
          createdAt: new Date(),
          imageUrls: [],
          amenities: [],
        };

        await db.collection("hotels").add(hotelData);
      }

      // 3. 📧 SEND WELCOME EMAIL
      // ✅ We pass 'finalPassword' so the email logic knows which message to send
      try {
        console.log(`Sending Partner Welcome Email to ${email}...`);
        await sendWelcomeEmail(email, name, "partner", finalPassword);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    // 4. Update the Request Status
    await db.collection("join_requests").doc(requestId).update({
      status: status, // APPROVED or REJECTED
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}

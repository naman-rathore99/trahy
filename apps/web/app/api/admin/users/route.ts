import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  await initAdmin();
  const auth = getAuth();
  const db = getFirestore();

  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");

    // 1. Get All Users
    const listUsersResult = await auth.listUsers(1000);

    // 2. Get All Owners (Hotels & Vehicles)
    // We check the DB to see who actually owns business assets
    const [hotelsSnap, vehiclesSnap] = await Promise.all([
      db.collection("hotels").get(),
      db.collection("vehicles").get(),
    ]);

    const propertyOwners = new Set(
      hotelsSnap.docs.map((doc) => doc.data().ownerId)
    );
    const vehicleOwners = new Set(
      vehiclesSnap.docs.map((doc) => doc.data().ownerId)
    );

    // 3. Merge Data
    let users = listUsersResult.users.map((userRecord) => {
      const uid = userRecord.uid;
      const hasProperty = propertyOwners.has(uid);
      const hasVehicle = vehicleOwners.has(uid);

      // ✅ LOGIC: You are a partner if you own something OR have the label
      const isPartner =
        hasProperty ||
        hasVehicle ||
        userRecord.customClaims?.role === "partner";

      return {
        uid: uid,
        email: userRecord.email,
        displayName: userRecord.displayName || "No Name",
        photoURL: userRecord.photoURL || "",
        role: userRecord.customClaims?.role || "user",
        createdAt: userRecord.metadata.creationTime,
        phone: userRecord.phoneNumber,
        // New flags for your dashboard
        hasProperty,
        hasVehicle,
        isPartner,
      };
    });

    // 4. Apply Filters
    if (roleFilter) {
      if (roleFilter === "partner") {
        // ✅ FIX: Use the 'isPartner' flag we just calculated
        // This ensures Admins who own hotels appear in the list
        users = users.filter((u) => u.isPartner);
      } else {
        // For 'user' or 'admin' tabs, keep the strict check
        users = users.filter((u) => u.role === roleFilter);
      }
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

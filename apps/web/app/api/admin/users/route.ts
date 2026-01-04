export const dynamic = "force-dynamic"; // ✅ Fixes caching
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

    // 1. Get All Auth Users
    const listUsersResult = await auth.listUsers(1000);

    // 2. Fetch DATA from Firestore (Hotels, Vehicles, AND User Profiles)
    const [hotelsSnap, vehiclesSnap, usersSnap] = await Promise.all([
      db.collection("hotels").get(),
      db.collection("vehicles").get(),
      db.collection("users").get(), // <--- ✅ ADDED: Fetch user profiles
    ]);

    // 3. Create Lookup Maps for Speed
    const propertyOwners = new Set(hotelsSnap.docs.map((doc) => doc.data().ownerId));
    const vehicleOwners = new Set(vehiclesSnap.docs.map((doc) => doc.data().ownerId));

    // Create a map of UID -> User Data (to find isVerified)
    const userProfiles: Record<string, any> = {};
    usersSnap.forEach((doc) => {
      userProfiles[doc.id] = doc.data();
    });

    // 4. Merge Data
    let users = listUsersResult.users.map((userRecord) => {
      const uid = userRecord.uid;
      const hasProperty = propertyOwners.has(uid);
      const hasVehicle = vehicleOwners.has(uid);

      // Get Firestore data for this user (if it exists)
      const firestoreData = userProfiles[uid] || {};

      // Logic: Partner if they have role OR own assets
      const isPartner =
        hasProperty ||
        hasVehicle ||
        userRecord.customClaims?.role === "partner" ||
        firestoreData.role === "partner";

      return {
        uid: uid,
        email: userRecord.email,
        displayName: userRecord.displayName || firestoreData.name || "No Name",
        photoURL: userRecord.photoURL || "",
        role: userRecord.customClaims?.role || firestoreData.role || "user",
        createdAt: userRecord.metadata.creationTime,
        phone: userRecord.phoneNumber || firestoreData.phone,

        // ✅ CRITICAL FIX: Read isVerified from Firestore
        isVerified: firestoreData.isVerified === true,

        // Dashboard Flags
        hasProperty,
        hasVehicle,
        isPartner,
      };
    });

    // 5. Apply Filters
    if (roleFilter) {
      if (roleFilter === "partner") {
        users = users.filter((u) => u.isPartner);
      } else {
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
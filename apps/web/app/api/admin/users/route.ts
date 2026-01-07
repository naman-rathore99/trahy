export const dynamic = "force-dynamic";
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

    // 1. Get Users from Auth
    const listUsersResult = await auth.listUsers(1000);

    // 2. Fetch DATA from Firestore
    const [hotelsSnap, vehiclesSnap, usersSnap] = await Promise.all([
      db.collection("hotels").get(),
      db.collection("vehicles").get(),
      db.collection("users").get(),
    ]);

    // 3. Create Lookup Maps
    const propertyOwners = new Set(hotelsSnap.docs.map((doc) => doc.data().ownerId));
    const vehicleOwners = new Set(vehiclesSnap.docs.map((doc) => doc.data().ownerId));

    // Map: UID -> User Data
    const userProfiles: Record<string, any> = {};
    usersSnap.forEach((doc) => {
      userProfiles[doc.id] = doc.data();
    });

    // 4. Merge Data
    let users = listUsersResult.users.map((userRecord) => {
      const uid = userRecord.uid;

      // Get Firestore data
      const firestoreData = userProfiles[uid] || {};


      const hasProperty = propertyOwners.has(uid);
      const hasVehicle = vehicleOwners.has(uid);

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
        creationTime: userRecord.metadata.creationTime,

        // SPREAD DATA
        ...firestoreData,

        // FORCE PHONE PRIORITY
        phone: firestoreData.phone || firestoreData.phoneNumber || userRecord.phoneNumber || "",

        role: userRecord.customClaims?.role || firestoreData.role || "user",
        isVerified: firestoreData.isVerified === true,
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
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
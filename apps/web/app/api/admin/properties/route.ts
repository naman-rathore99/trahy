import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin"; // Uses the backend file

export async function GET() {
  await initAdmin();
  const db = getFirestore();

  try {
    // 1. Fetch all properties
    const propertiesSnap = await db.collection("properties").get();

    // 2. Loop through properties and find the Owner's Name
    const properties = await Promise.all(
      propertiesSnap.docs.map(async (doc: any) => {
        const data = doc.data();
        let ownerName = "Unknown Owner";
        let ownerEmail = "No Email";

        // Lookup the Owner (User) details
        if (data.ownerId) {
          try {
            const userRecord = await getAuth().getUser(data.ownerId);
            ownerName = userRecord.displayName || "No Name";
            ownerEmail = userRecord.email || "No Email";
          } catch (e) {
            console.log("Owner lookup failed", e);
          }
        }

        return {
          id: doc.id,
          ...data,
          ownerName,
          ownerEmail,
        };
      })
    );

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

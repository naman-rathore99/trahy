import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  await initAdmin();
  const auth = getAuth();

  try {
    // OPTIONAL: Filter by role (e.g., ?role=admin)
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    // Fetch up to 1000 users
    const listUsersResult = await auth.listUsers(1000);

    let users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "No Name",
      photoURL: userRecord.photoURL || "",
      role: userRecord.customClaims?.role || "user", // Get the custom role
      createdAt: userRecord.metadata.creationTime,
    }));

    // If the frontend asked for a specific role (like "admin" or "user"), filter it here
    if (role) {
      users = users.filter((u) => u.role === role);
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

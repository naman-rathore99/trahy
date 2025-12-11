import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";

// 1. SETUP & CONFIGURATION
dotenv.config(); // Load secrets from .env file

const serviceAccount = require("../serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(); // Database access
const app = express(); // The server app

app.use(cors()); // Security: Allow requests from other domains (like your frontend)
app.use(express.json()); // Utility: specific parsing for JSON data in requests

// 2. TYPESCRIPT DEFINITIONS
// We teach TypeScript that a "Request" might have a "user" attached to it later
interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

// ==================================================================
// 3. MIDDLEWARE (The Bouncer)
// ==================================================================
// This function runs BEFORE protected routes. It checks if the user is logged in.
const checkAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Look for the "Authorization: Bearer <TOKEN>" header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split("Bearer ")[1];

    if (!token) {
      res.status(401).send({ error: "No token provided" });
      return;
    }

    // Ask Firebase: "Is this token real?"
    const decodedToken = await getAuth().verifyIdToken(token);

    // If real, attach the user info to the request so the next function can use it
    req.user = decodedToken;
    next(); // Pass control to the next function (the actual route)
  } catch (error) {
    res.status(403).send({ error: "Unauthorized" });
  }
};

// ==================================================================
// 4. PUBLIC ROUTES (Open to Everyone)
// ==================================================================

// Health Check - Just to see if server is alive
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running (TypeScript)!" });
});

// [NEW] JOIN REQUEST - Anyone can submit this form
// We do NOT use 'checkAuth' here because the user is a stranger (not logged in yet)
app.post("/api/public/join-request", async (req: any, res: any) => {
  try {
    const { name, email, phone, serviceType, officialIdUrl } = req.body;

    // Save to a separate "requests" collection (Inbox)
    await db.collection("join_requests").add({
      name,
      email,
      phone,
      serviceType,
      officialIdUrl,
      status: "pending", // Mark as "Waiting for Admin"
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, message: "Request received" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/hotels", async (req: any, res: any) => {
  try {
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", "approved")
      .get();
    const hotels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ hotels });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 5. PROTECTED ROUTES (Logged In Users Only)
// ==================================================================
app.post("/api/admin/add-hotel", checkAuth, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "admin")
      return res.status(403).json({ error: "Denied" });

    const {
      name,
      location,
      pricePerNight,
      description,
      imageUrls,
      hasVehicle,
      vehicleDetails,
    } = req.body;

    const hotelData = {
      name,
      location,
      pricePerNight: Number(pricePerNight),
      description,
      imageUrls: imageUrls || [],
      imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : "",
      hasVehicle: !!hasVehicle,
      vehicleDetails: hasVehicle
        ? { ...vehicleDetails, pricePerDay: Number(vehicleDetails.pricePerDay) }
        : null,

      // NEW FIELDS
      status: "pending", // Default to pending so it goes to review
      createdAt: new Date().toISOString(),
    };

    await db.collection("hotels").add(hotelData);
    res.json({ success: true, message: "Property submitted for review!" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. NEW: Get Properties by Status (For Admin Dashboard)
app.get("/api/admin/properties", checkAuth, async (req: any, res: any) => {
  try {
    const status = req.query.status || "pending"; // Default to pending
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", status)
      .get();
    const properties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ properties });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. NEW: Get Single Property (For Editing)
app.get("/api/hotels/:id", async (req: any, res: any) => {
  try {
    const doc = await db.collection("hotels").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. NEW: Update/Approve Property
app.put("/api/admin/hotels/:id", checkAuth, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "admin")
      return res.status(403).json({ error: "Denied" });

    // Updates can include changing status to 'approved'
    await db
      .collection("hotels")
      .doc(req.params.id)
      .update({
        ...req.body,
        updatedAt: new Date().toISOString(),
      });

    res.json({ success: true, message: "Property Updated!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. NEW: Public "Home Page" Route (Approved Only)
app.get("/api/hotels", async (req: any, res: any) => {
  try {
    // Only fetch APPROVED hotels
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", "approved")
      .get();
    const hotels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ hotels });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// Update Profile - Users updating their own data
app.get("/api/user/me", checkAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Return the full profile data (including role)
    res.json({ user: doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.post(
  "/api/user/update",
  checkAuth, // <--- Bouncer checks ID first
  async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid; // We know this exists because of checkAuth
      const {
        name,
        phone,
        aadharNumber,
        licenseNumber,
        aadharUrl,
        licenseUrl,
      } = req.body;

      // Save to "users" collection
      await db.collection("users").doc(uid).set(
        {
          name,
          phone,
          aadharNumber,
          licenseNumber,
          aadharUrl,
          licenseUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ); // Merge means "update existing fields, don't delete others"

      res.status(200).json({ success: true, message: "Profile updated" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ==================================================================
// 6. ADMIN ROUTES (Boss Only)
// ==================================================================

// [NEW] Get All Join Requests (Inbox)
app.get("/api/admin/requests", checkAuth, async (req: any, res: any) => {
  try {
    // Security Check: Is this user actually an Admin?
    const uid = req.user.uid;
    const adminDoc = await db.collection("users").doc(uid).get();
    if (adminDoc.data()?.role !== "admin")
      return res.status(403).json({ error: "Denied" });

    // Fetch only "pending" requests
    const snapshot = await db
      .collection("join_requests")
      .where("status", "==", "pending")
      .get();
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// [NEW] Approve Request (Create the User)
app.post(
  "/api/admin/approve-request",
  checkAuth,
  async (req: any, res: any) => {
    try {
      const uid = req.user.uid;
      // 1. Verify Admin
      const adminDoc = await db.collection("users").doc(uid).get();
      if (adminDoc.data()?.role !== "admin")
        return res.status(403).json({ error: "Denied" });

      const { requestId, email, name, password } = req.body;

      // 2. Create the Account in Firebase Auth (Login System)
      // This allows them to actually log in with Email/Password
      const newUser = await getAuth().createUser({
        email: email,
        password: password,
        displayName: name,
      });

      // 3. Create the Document in Firestore (Database System)
      // This stores their profile data
      await db.collection("users").doc(newUser.uid).set({
        name,
        email,
        role: "user", // They start as a regular partner
        createdAt: new Date().toISOString(),
        isLicenseVerified: false,
      });

      // 4. Mark Request as Approved (Move out of Inbox)
      await db.collection("join_requests").doc(requestId).update({
        status: "approved",
        approvedBy: uid,
        approvedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "User Created!",
        userId: newUser.uid,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Add Hotel (With Multi-Image Support)
app.post("/api/admin/add-hotel", checkAuth, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;

    // Verify Admin
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Access Denied" });
    }

    const {
      name,
      location,
      pricePerNight,
      description,
      imageUrls, // Array of images
      hasVehicle,
      vehicleDetails,
    } = req.body;

    const hotelData = {
      name,
      location,
      pricePerNight: Number(pricePerNight),
      description,
      imageUrls: imageUrls || [], // Save the list
      imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : "", // Main image
      hasVehicle: !!hasVehicle,
      vehicleDetails: hasVehicle
        ? {
            name: vehicleDetails.name,
            type: vehicleDetails.type,
            pricePerDay: Number(vehicleDetails.pricePerDay),
            imageUrl: vehicleDetails.imageUrl,
          }
        : null,
      createdAt: new Date().toISOString(),
    };

    await db.collection("hotels").add(hotelData);

    res.json({ success: true, message: "Hotel added!" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Users (For Dashboard)
app.get("/api/admin/users", checkAuth, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    const adminDoc = await db.collection("users").doc(uid).get();
    if (adminDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Access Denied" });
    }

    const snapshot = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

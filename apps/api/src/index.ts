import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore"; // ✅ ADDED: Missing Firestore Import

// 1. SETUP & CONFIGURATION
dotenv.config();

// --- SMART CREDENTIAL LOADING (Local vs Cloud) ---
let serviceAccount: ServiceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("✅ Loaded Firebase credentials from Environment Variable.");
  } catch (e) {
    console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var.");
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require("../serviceAccountKey.json");
    console.log("✅ Loaded Firebase credentials from local file.");
  } catch (e) {
    console.error(
      "❌ Fatal Error: Could not find serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var."
    );
    process.exit(1);
  }
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(); // ✅ FIXED: Replaced undefined 'adminDb' with actual getFirestore()
const app = express();

app.use(cors());
app.use(express.json());

// 2. TYPESCRIPT INTERFACE
export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

// 3. MIDDLEWARE
const checkAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split("Bearer ")[1];

    if (!token) {
      res.status(401).send({ error: "No token provided" });
      return;
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).send({ error: "Unauthorized" });
  }
};

// ==========================================
// 4. PUBLIC ROUTES (No Login Required)
// ==========================================

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running!" });
});

app.post("/api/public/join-request", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, serviceType, officialIdUrl } = req.body;
    await db.collection("join_requests").add({
      name,
      email,
      phone,
      serviceType,
      officialIdUrl,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, message: "Request received" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIXED: Removed duplicate `/api/hotels`. Merged logic to show only approved by default.
app.get("/api/hotels", async (req: Request, res: Response) => {
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

app.get("/api/hotels/:id", async (req: Request, res: Response) => {
  try {
    const doc = await db.collection("hotels").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/register", async (req: Request, res: Response): Promise<any> => {
  try {
    const { uid, email, name, role } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: "Missing user data" });
    }

    await db.collection("users").doc(uid).set({
      uid,
      email,
      name: name || "User",
      role: role || "user",
      createdAt: new Date().toISOString(),
      isLicenseVerified: false,
      emailVerified: false,
      phoneVerified: false,
      totalSpend: 0,
    });

    res.json({ success: true, message: "User registered" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. USER ROUTES (Login Required)
// ==========================================

app.get("/api/user/me", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "Profile not found" });
    res.json({ user: doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/user/update", checkAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { name, phone, aadharNumber, licenseNumber, aadharUrl, licenseUrl } = req.body;

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
    );

    res.status(200).json({ success: true, message: "Profile updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. BOOKING ROUTES
// ==========================================

app.post("/api/bookings", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { listingId, listingName, listingImage, serviceType, checkIn, checkOut, guests, totalAmount } = req.body;

    if (!listingId || !checkIn || !checkOut || !totalAmount) {
      return res.status(400).json({ error: "Missing required booking details" });
    }

    const bookingData = {
      userId: req.user!.uid,
      customerName: req.user!.name || "Valued Guest",
      customerEmail: req.user!.email,
      listingId,
      serviceName: listingName || "Unknown Service",
      imageUrl: listingImage || "",
      serviceType: serviceType || "hotel",
      checkIn,
      checkOut,
      guests: Number(guests),
      totalAmount: Number(totalAmount),
      status: "confirmed",
      paymentStatus: "pending",
      invoiceSent: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("bookings").add(bookingData);
    res.json({ success: true, bookingId: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. ADMIN ROUTES (Admin Role Required)
// ==========================================

app.get("/api/admin/users", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const adminDoc = await db.collection("users").doc(uid).get();
    if (adminDoc.data()?.role !== "admin") return res.status(403).json({ error: "Access Denied" });

    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/requests", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const adminDoc = await db.collection("users").doc(uid).get();
    if (adminDoc.data()?.role !== "admin") return res.status(403).json({ error: "Denied" });

    const snapshot = await db.collection("join_requests").where("status", "==", "pending").get();
    const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/approve-request", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const adminDoc = await db.collection("users").doc(uid).get();
    if (adminDoc.data()?.role !== "admin") return res.status(403).json({ error: "Denied" });

    const { requestId, email, name, password } = req.body;

    const newUser = await getAuth().createUser({ email, password, displayName: name });

    await db.collection("users").doc(newUser.uid).set({
      name,
      email,
      role: "partner",
      createdAt: new Date().toISOString(),
      isLicenseVerified: false,
    });

    await db.collection("join_requests").doc(requestId).update({
      status: "approved",
      approvedBy: uid,
      approvedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: "User Created!", userId: newUser.uid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIXED: Removed duplicate `/api/admin/add-hotel` endpoints and combined them into one robust endpoint.
app.post("/api/admin/add-hotel", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "admin") return res.status(403).json({ error: "Denied" });

    const {
      type, // 'hotel' | 'vehicle'
      name, location, price, description, imageUrls,
      amenities, hasVehicle, vehicleDetails,
      vehicleType, seats, transmission, fuelType,
    } = req.body;

    const listingData = {
      type: type || "hotel",
      name,
      location,
      price: Number(price),
      description,
      imageUrls: imageUrls || [],
      imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : "",
      status: "pending",
      createdAt: new Date().toISOString(),
      ownerId: uid,

      // Keep support for both of your previous object structures
      hasVehicle: !!hasVehicle,
      vehicleDetails: hasVehicle ? { ...vehicleDetails, pricePerDay: Number(vehicleDetails?.pricePerDay || 0) } : null,

      details: type === "vehicle" ? { vehicleType, seats: Number(seats), transmission, fuelType } : { amenities: amenities || [] }
    };

    await db.collection("hotels").add(listingData);
    res.json({ success: true, message: `${type === "vehicle" ? "Vehicle" : "Property"} submitted for review!` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/admin/bookings", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "admin" && userDoc.data()?.role !== "partner") {
      return res.status(403).json({ error: "Denied" });
    }

    const snapshot = await db.collection("bookings").orderBy("createdAt", "desc").get();
    const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ bookings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/verify-user", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const adminDoc = await db.collection("users").doc(uid).get();
    if (adminDoc.data()?.role !== "admin") return res.status(403).json({ error: "Denied" });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    await db.collection("users").doc(userId).update({
      isLicenseVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: "User verified successfully!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/hotels", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const status = req.query.status || "pending";
    const snapshot = await db.collection("hotels").where("status", "==", status).get();
    const hotels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ hotels });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/hotels/:id", checkAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const uid = req.user!.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "admin") return res.status(403).json({ error: "Denied" });

    await db.collection("hotels").doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: "Property Updated!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
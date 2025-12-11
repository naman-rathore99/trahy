import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";

dotenv.config();

const serviceAccount = require("../serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const app = express();

app.use(cors());
app.use(express.json());

// 2. Define Custom Request Interface
interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

// 3. Auth Middleware
const checkAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
// 4. ROUTES
// ==========================================

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running (TypeScript)!" });
});

// Update User Profile
app.post(
  "/api/user/update",
  checkAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not identified" });
        return;
      }

      const uid = req.user.uid;
      const {
        name,
        phone,
        aadharNumber,
        licenseNumber,
        aadharUrl,
        licenseUrl,
      } = req.body;

      const userData = {
        name,
        phone,
        aadharNumber,
        licenseNumber,
        aadharUrl,
        licenseUrl,
        updatedAt: new Date().toISOString(),
      };

      await db.collection("users").doc(uid).set(userData, { merge: true });

      res
        .status(200)
        .json({ success: true, message: "Profile updated successfully" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ADMIN ROUTE: Add Hotel (UPDATED FOR MULTI-IMAGES)
app.post("/api/admin/add-hotel", checkAuth, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;

    // 1. Verify User is Admin
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (userData?.role !== "admin") {
      return res.status(403).json({ error: "Access Denied: Admins only." });
    }

    // 2. Get Data from Body
    const {
      name,
      location,
      pricePerNight,
      description,
      imageUrls, // <--- CHANGED: Now expecting an Array of strings
      hasVehicle,
      vehicleDetails,
    } = req.body;

    // 3. Construct Hotel Object
    const hotelData = {
      name,
      location,
      pricePerNight: Number(pricePerNight),
      description,

      // Save the Full Gallery
      imageUrls: imageUrls || [],

      // Auto-select the first image as the "Main" image (for cards/previews)
      imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : "",

      hasVehicle: !!hasVehicle,
      // Only add vehicle details if the toggle is ON
      vehicleDetails: hasVehicle
        ? {
            name: vehicleDetails.name,
            type: vehicleDetails.type,
            pricePerDay: Number(vehicleDetails.pricePerDay),
            imageUrl: vehicleDetails.imageUrl, // Vehicle still uses single image
          }
        : null,
      createdAt: new Date().toISOString(),
    };

    // 4. Save to Firestore
    await db.collection("hotels").add(hotelData);

    res.json({ success: true, message: "Hotel added successfully!" });
  } catch (error: any) {
    console.error("Add Hotel Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN ROUTE: Get All Users
app.get("/api/admin/users", checkAuth, async (req: any, res: any) => {
  try {
    // 1. Check Admin Role
    const uid = req.user.uid;
    const adminDoc = await db.collection("users").doc(uid).get();
    if (adminDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Access Denied" });
    }

    // 2. Fetch Users
    const snapshot = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .get();

    // 3. Format Data
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

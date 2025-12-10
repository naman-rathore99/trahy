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
// This tells TypeScript: "Our requests might have a 'user' property"
interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

// 3. Auth Middleware (Type-Safe)
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

// 4. Routes

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend is running (TypeScript)!" }); // <--- This sends JSON
});

// Update Profile
app.post(
  "/api/user/update",
  checkAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      // TypeScript knows req.user exists because of our checkAuth middleware logic
      // but to be strict, we check existence:
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

      // TypeScript Tip: You could create an Interface for the User data here too!
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

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

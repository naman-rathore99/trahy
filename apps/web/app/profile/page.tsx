"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, updateProfile, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload"; // ✅ Your existing component
import {
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  Camera,
  Save,
  Loader2,
  ShieldCheck,
  Edit3,
  FileText,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalTrips: 0, memberSince: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Consolidated Form Data (Personal + Documents)
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    address: "",
    photoURL: "",
    // Your Verification Fields
    aadharNumber: "",
    licenseNumber: "",
    aadharUrl: "",
    licenseUrl: "",
  });

  // --- 1. FETCH USER DATA ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        // A. Fetch Firestore Data
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        let firestoreData: any = {};
        if (userSnap.exists()) {
          firestoreData = userSnap.data();
        }

        // B. Fetch Booking Stats
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getCountFromServer(bookingsQuery);

        setStats({
          totalTrips: snapshot.data().count,
          memberSince: currentUser.metadata.creationTime
            ? format(new Date(currentUser.metadata.creationTime), "MMM yyyy")
            : "N/A",
        });

        // C. Set Form Data (Merge Auth + Firestore)
        setFormData({
          displayName: currentUser.displayName || "",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          phoneNumber: firestoreData.phoneNumber || "",
          address: firestoreData.address || "",
          aadharNumber: firestoreData.aadharNumber || "",
          licenseNumber: firestoreData.licenseNumber || "",
          aadharUrl: firestoreData.aadharUrl || "",
          licenseUrl: firestoreData.licenseUrl || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // --- 2. HANDLERS ---
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // 1. Update Auth Profile (Name & Photo)
      if (
        user.displayName !== formData.displayName ||
        user.photoURL !== formData.photoURL
      ) {
        await updateProfile(user, {
          displayName: formData.displayName,
          photoURL: formData.photoURL,
        });
      }

      // 2. Update Firestore (Everything else)
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          aadharNumber: formData.aadharNumber,
          licenseNumber: formData.licenseNumber,
          aadharUrl: formData.aadharUrl,
          licenseUrl: formData.licenseUrl,
          updatedAt: new Date(),
          isVerified: false, // Reset verification on edit if needed
        },
        { merge: true }
      );

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors">
      <Navbar variant="default" />

      <div className="max-w-6xl mx-auto px-4 pt-32">
        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your identity and verification documents.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- LEFT: IDENTITY CARD --- */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>

              <div className="relative mt-8 mb-4">
                <div className="w-28 h-28 mx-auto rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-200 shadow-lg relative group">
                  <img
                    src={
                      formData.photoURL ||
                      `https://ui-avatars.com/api/?name=${formData.displayName}&background=random`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {formData.displayName || "User"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {formData.email}
              </p>

              <div className="flex justify-center gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.totalTrips}
                  </div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Trips
                  </div>
                </div>
                <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    4.9
                  </div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Rating
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-2xl shadow-xl border border-gray-800">
              <div className="flex justify-between items-start mb-8">
                <ShieldCheck className="text-emerald-500" size={32} />
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                  {formData.aadharUrl && formData.licenseUrl
                    ? "UNDER REVIEW"
                    : "PENDING"}
                </span>
              </div>
              <div className="text-sm text-gray-400 mb-1">Member Since</div>
              <div className="font-mono text-lg tracking-widest">
                {stats.memberSince}
              </div>
            </div>
          </div>

          {/* --- RIGHT: DETAILS FORM --- */}
          <div className="w-full lg:w-2/3 space-y-8">
            {/* 1. PERSONAL DETAILS */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <User size={20} className="text-blue-600" /> Personal
                  Information
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Edit3 size={16} /> Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+91..."
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium dark:text-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isEditing}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. VERIFICATION DOCUMENTS (Your Custom Logic) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" /> Identity
                  Documents
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Required for booking approval.
                </p>
              </div>

              <div className="p-6 space-y-8">
                {/* Aadhar Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      disabled={!isEditing}
                      value={formData.aadharNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aadharNumber: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium dark:text-white"
                    />
                  </div>
                  <div
                    className={
                      !isEditing ? "opacity-60 pointer-events-none" : ""
                    }
                  >
                    {/* ✅ Using your ImageUpload Component */}
                    <ImageUpload
                      label="Upload Aadhar (Front)"
                      currentUrl={formData.aadharUrl}
                      onUpload={(url) =>
                        setFormData((prev) => ({ ...prev, aadharUrl: url }))
                      }
                    />
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>

                {/* License Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                      Driving License
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          licenseNumber: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium dark:text-white"
                    />
                  </div>
                  <div
                    className={
                      !isEditing ? "opacity-60 pointer-events-none" : ""
                    }
                  >
                    <ImageUpload
                      label="Upload License"
                      currentUrl={formData.licenseUrl}
                      onUpload={(url) =>
                        setFormData((prev) => ({ ...prev, licenseUrl: url }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Save Button Area */}
              {isEditing && (
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    Save & Verify
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

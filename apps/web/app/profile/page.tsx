"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import ImageUpload from "@/components/ImageUpload";
import LoginButton from "@/components/LoginButton";
import { apiRequest } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  // State for form data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    aadharNumber: "",
    licenseNumber: "",
    aadharUrl: "",
    licenseUrl: "",
  });

  // 1. Load User & Auto-fill Name
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        // FIX: Initialize the name immediately so it's not empty on submit
        setFormData((prev) => ({
          ...prev,
          name: currentUser.displayName || "",
        }));
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // DEBUG: Print exactly what we are sending to the backend
    console.log("Submitting Form Data:", formData);

    if (!formData.aadharUrl || !formData.licenseUrl) {
      alert("Please wait for images to finish uploading!");
      return;
    }

    try {
      await apiRequest("/api/user/update", "POST", formData);
      alert("Profile Saved Successfully!");
    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  if (loadingUser) return <div className="p-10 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoginButton onLoginSuccess={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Complete Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            value={formData.name} // FIX: Controlled input (value comes from state)
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full p-2 border rounded"
            placeholder="1234567890"
          />
        </div>

        {/* Identity Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Aadhar Number
            </label>
            <input
              value={formData.aadharNumber}
              onChange={(e) =>
                setFormData({ ...formData, aadharNumber: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              License Number
            </label>
            <input
              value={formData.licenseNumber}
              onChange={(e) =>
                setFormData({ ...formData, licenseNumber: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Image Uploads */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div
            className={
              formData.aadharUrl ? "border-green-500 border-2 rounded" : ""
            }
          >
            <ImageUpload
              label="Aadhar Card"
              onUpload={(url) => {
                console.log("Setting Aadhar URL:", url); // Verify this prints
                setFormData((prev) => ({ ...prev, aadharUrl: url }));
              }}
            />
            {formData.aadharUrl && (
              <p className="text-xs text-green-600 text-center">✓ Uploaded</p>
            )}
          </div>

          <div
            className={
              formData.licenseUrl ? "border-green-500 border-2 rounded" : ""
            }
          >
            <ImageUpload
              label="Driving License"
              onUpload={(url) => {
                console.log("Setting License URL:", url); // Verify this prints
                setFormData((prev) => ({ ...prev, licenseUrl: url }));
              }}
            />
            {formData.licenseUrl && (
              <p className="text-xs text-green-600 text-center">✓ Uploaded</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

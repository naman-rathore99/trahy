"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import ImageUpload from "@/components/ImageUpload";
import { apiRequest } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    aadharNumber: "",
    licenseNumber: "",
    aadharUrl: "",
    licenseUrl: "",
  });

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u)
        router.push("/login"); // Redirect if not logged in
      else {
        setUser(u);
        setFormData((prev) => ({ ...prev, name: u.displayName || "" }));
      }
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aadharUrl || !formData.licenseUrl) {
      alert("Please upload both documents before saving.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/user/update", "POST", formData);
      alert("Success! Profile submitted for verification.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-blue-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">
              Complete Your Profile
            </h1>
            <p className="text-blue-100 mt-1">
              Please provide your details for identity verification.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
            {/* Section 1: Personal Info */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Documents */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">
                Identity Documents
              </h3>

              {/* Aadhar Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12-digit UID"
                    value={formData.aadharNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, aadharNumber: e.target.value })
                    }
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <ImageUpload
                  label="Upload Aadhar Card (Front)"
                  onUpload={(url) =>
                    setFormData((prev) => ({ ...prev, aadharUrl: url }))
                  }
                  currentUrl={formData.aadharUrl}
                />
              </div>

              {/* License Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driving License Number
                  </label>
                  <input
                    type="text"
                    placeholder="DL Number"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <ImageUpload
                  label="Upload Driving License"
                  onUpload={(url) =>
                    setFormData((prev) => ({ ...prev, licenseUrl: url }))
                  }
                  currentUrl={formData.licenseUrl}
                />
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"}
                `}
              >
                {loading ? "Submitting..." : "Save & Verify Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

export default function JoinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    serviceType: "Hotel", // Default option
    officialIdUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.officialIdUrl)
      return alert("Please upload an Official ID proof.");

    setLoading(true);
    try {
      // We will add this backend route in the next step
      await apiRequest("/api/public/join-request", "POST", formData);

      alert("Application Sent! We will review your ID and email you shortly.");
      router.push("/login"); // Send them back to login
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-black px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Join the Family</h1>
          <p className="text-gray-400 mt-1">
            Apply to list your Hotel or Vehicles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              required
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <input
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              What do you provide?
            </label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
              value={formData.serviceType}
              onChange={(e) =>
                setFormData({ ...formData, serviceType: e.target.value })
              }
            >
              <option value="Hotel">Hotel Rooms</option>
              <option value="Vehicle">Vehicle Services</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div>
            <ImageUpload
              label="Upload Official ID (Govt ID / Business Card)"
              onUpload={(url) =>
                setFormData({ ...formData, officialIdUrl: url })
              }
              currentUrl={formData.officialIdUrl}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Submitting Application..." : "Submit Application"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/login" className="text-gray-600 hover:underline">
              &larr; Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

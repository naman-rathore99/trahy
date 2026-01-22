"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import {
  Building2,
  MapPin,
  Save,
  Loader2,
  FileText,
  Phone,
  CheckCircle,
  AlertCircle,
  IndianRupee,
} from "lucide-react";

export default function PropertySettings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "Mathura",
    phone: "",
    email: "",
    pricePerNight: "", // ✅ ADDED: Price field state
    mainImage: "",
    images: [] as string[],
    amenities: [] as string[],
  });

  // Load existing hotel data (if any)
  useEffect(() => {
    fetchHotelDetails();
  }, []);

  const fetchHotelDetails = async () => {
    try {
      const data = await apiRequest("/api/partner/hotel", "GET");
      if (data && data.hotel) {
        // ✅ MAP DATA: Ensure we map the database 'pricePerNight' to our form
        setFormData({
          ...data.hotel,
          pricePerNight: data.hotel.pricePerNight || "",
          mainImage: data.hotel.imageUrl || data.hotel.mainImage || "", // Handle mismatch names
        });
      }
    } catch (error: any) {
      if (error.message.includes("No hotel")) {
        setIsNew(true);
      } else {
        console.error("Fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = isNew ? "POST" : "PUT";
      await apiRequest("/api/partner/hotel", method, formData);
      alert(
        isNew
          ? "Property Created Successfully! Now you can add rooms."
          : "Settings Saved!",
      );
      setIsNew(false);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isNew ? "Setup Your Property" : "Property Settings"}
          </h1>
          <p className="text-gray-500 mt-1">
            {isNew
              ? "Complete your hotel profile to start accepting bookings."
              : "Update your hotel details, address, and contacts."}
          </p>
        </div>
        {isNew && (
          <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <AlertCircle size={16} /> Action Required
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Basic Info */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 size={20} className="text-rose-600" /> Basic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-white">
                Hotel Name
              </label>
              <input
                required
                className="w-full p-3 bg-gray-50  dark:bg-gray-900 text-black dark:text-white border rounded-xl outline-none"
                placeholder="Ex: Grand Shubhyatra Hotel"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-black dark:text-white ">
                Official Email
              </label>
              <input
                type="email"
                required
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border text-black dark:text-white rounded-xl outline-none"
                placeholder="contact@hotel.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* ✅ NEW: Price Input Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-black dark:text-white flex items-center gap-1">
              <IndianRupee size={12} /> Starting Price (Per Night)
            </label>
            <input
              type="number"
              required
              min="0"
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border text-black dark:text-white rounded-xl outline-none font-bold text-lg"
              placeholder="Ex: 1500"
              value={formData.pricePerNight}
              onChange={(e) =>
                setFormData({ ...formData, pricePerNight: e.target.value })
              }
            />
            <p className="text-xs text-gray-400">
              This price will be shown on the home page card.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-black dark:text-white">
              Description
            </label>
            <textarea
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border rounded-xl outline-none h-32"
              placeholder="Tell travelers what makes your stay special..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </section>

        {/* 2. Location */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MapPin size={20} className="text-rose-600 " /> Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase  text-black dark:text-white">
                Street Address
              </label>
              <input
                required
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-black dark:text-white outline-none"
                placeholder="123, Temple Road, Near Prem Mandir"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-black dark:text-white">
                City
              </label>
              <select
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border text-black dark:text-white rounded-xl outline-none"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              >
                <option>Mathura</option>
                <option>Vrindavan</option>
                <option>Govardhan</option>
                <option>Barsana</option>
              </select>
            </div>
          </div>
        </section>

        {/* 3. Main Image */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileText size={20} className="text-rose-600" /> Main Cover Photo
          </h3>
          <div className="h-64 bg-gray-50 dark:bg-gray-900 border-2 text-black dark:text-white border-dashed border-gray-200 rounded-xl overflow-hidden relative">
            <ImageUpload
              className="h-64"
              currentUrl={formData.mainImage}
              onUpload={(url) => setFormData({ ...formData, mainImage: url })}
            />
            {!formData.mainImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-black dark:text-white">
                Upload Main Hotel Image
              </div>
            )}
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-8 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {isNew ? "Create Property" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

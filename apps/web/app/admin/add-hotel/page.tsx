"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Building2, Car, UploadCloud, Loader2 } from "lucide-react";

export default function AddListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. TOGGLE STATE: 'hotel' or 'vehicle'
  const [listingType, setListingType] = useState<"hotel" | "vehicle">("hotel");

  // FORM STATE
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    description: "",
    imageUrl: "",
    // Vehicle Specifics
    vehicleType: "Sedan",
    seats: "4",
    transmission: "Manual",
    fuelType: "Petrol",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest("/api/admin/add-hotel", "POST", {
        ...formData,
        type: listingType,
        imageUrls: [formData.imageUrl], // Sending as array for compatibility
      });

      alert(
        `${listingType === "vehicle" ? "Vehicle" : "Property"} submitted successfully!`
      );
      router.push("/admin/properties");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Add New Listing</h1>

      {/* --- 1. TYPE SELECTOR TABS --- */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setListingType("hotel")}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
            listingType === "hotel"
              ? "bg-white shadow-md text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 size={20} /> Add Property
        </button>
        <button
          onClick={() => setListingType("vehicle")}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
            listingType === "vehicle"
              ? "bg-white shadow-md text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Car size={20} /> Add Vehicle
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
      >
        {/* COMMON FIELDS */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {listingType === "hotel" ? "Property Name" : "Vehicle Model Name"}
          </label>
          <input
            required
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-black/5"
            placeholder={
              listingType === "hotel"
                ? "e.g. Ocean View Villa"
                : "e.g. Toyota Innova Crysta"
            }
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Location / Pickup City
          </label>
          <input
            required
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-black/5"
            placeholder="e.g. Mumbai, Goa"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {listingType === "hotel"
              ? "Price per Night (₹)"
              : "Price per Day (₹)"}
          </label>
          <input
            required
            type="number"
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-black/5"
            placeholder="e.g. 2500"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
          />
        </div>

        {/* --- VEHICLE SPECIFIC FIELDS --- */}
        {listingType === "vehicle" && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Type
              </label>
              <select
                className="w-full p-3 border rounded-lg bg-white"
                value={formData.vehicleType}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleType: e.target.value })
                }
              >
                <option>Sedan</option>
                <option>SUV</option>
                <option>Hatchback</option>
                <option>Luxury</option>
                <option>Bike</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Seats
              </label>
              <select
                className="w-full p-3 border rounded-lg bg-white"
                value={formData.seats}
                onChange={(e) =>
                  setFormData({ ...formData, seats: e.target.value })
                }
              >
                <option>2</option>
                <option>4</option>
                <option>5</option>
                <option>7</option>
                <option>10+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Fuel
              </label>
              <select
                className="w-full p-3 border rounded-lg bg-white"
                value={formData.fuelType}
                onChange={(e) =>
                  setFormData({ ...formData, fuelType: e.target.value })
                }
              >
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Transmission
              </label>
              <select
                className="w-full p-3 border rounded-lg bg-white"
                value={formData.transmission}
                onChange={(e) =>
                  setFormData({ ...formData, transmission: e.target.value })
                }
              >
                <option>Manual</option>
                <option>Automatic</option>
              </select>
            </div>
          </div>
        )}

        {/* IMAGE URL (Simplified for now) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Main Image URL
          </label>
          <div className="flex gap-2">
            <input
              required
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-black/5"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
            />
            <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <UploadCloud size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Paste a link from Unsplash for testing.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            required
            rows={4}
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-black/5"
            placeholder={
              listingType === "hotel"
                ? "Tell us about the property..."
                : "Tell us about the car condition & rules..."
            }
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Submit for Review"}
        </button>
      </form>
    </div>
  );
}

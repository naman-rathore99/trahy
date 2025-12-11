"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; // Use useParams for ID
import { apiRequest } from "@/lib/api";
import MultiImageUpload from "@/components/MultiImageUpload";

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hotel, setHotel] = useState<any>({
    name: "",
    location: "",
    pricePerNight: "",
    description: "",
    imageUrls: [],
    hasVehicle: false,
    vehicleDetails: null,
  });

  // 1. Fetch Property Data
  useEffect(() => {
    apiRequest(`/api/hotels/${id}`, "GET")
      .then((data) => {
        setHotel(data);
        setLoading(false);
      })
      .catch((err) => alert("Error loading: " + err.message));
  }, [id]);

  // 2. Handle Save / Approve
  // Handle Save function
  const handleSave = async (status: "approved" | "pending" | "banned") => {
    // Added 'banned'
    setSaving(true);
    try {
      await apiRequest(`/api/admin/hotels/${id}`, "PUT", {
        ...hotel,
        status: status,
      });

      if (status === "banned") alert("Property has been BANNED.");
      else if (status === "approved") alert("Property Published Live!");
      else alert("Changes Saved.");

      router.push("/admin/properties");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-black px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Review Property</h1>
          <span className="bg-white/20 text-white px-3 py-1 rounded text-sm">
            ID: {id}
          </span>
        </div>

        <div className="p-8 space-y-6">
          {/* EDITABLE FIELDS */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={hotel.name}
                onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                value={hotel.location}
                onChange={(e) =>
                  setHotel({ ...hotel, location: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                value={hotel.pricePerNight}
                onChange={(e) =>
                  setHotel({ ...hotel, pricePerNight: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={hotel.description}
                onChange={(e) =>
                  setHotel({ ...hotel, description: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="col-span-2">
              <MultiImageUpload
                label="Images"
                urls={hotel.imageUrls || [hotel.imageUrl]}
                onChange={(urls) =>
                  setHotel({ ...hotel, imageUrls: urls, imageUrl: urls[0] })
                }
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-between items-center border-t pt-6 mt-6">
            {/* NEW: Ban Button (Left Side) */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to BAN this property? It will be removed from the home page."
                  )
                ) {
                  handleSave("banned");
                }
              }}
              disabled={saving}
              className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100"
            >
              Ban Property
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => handleSave("pending")}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                Save (Pending)
              </button>
              <button
                onClick={() => handleSave("approved")}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg"
              >
                {saving ? "Publishing..." : "Approve & Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

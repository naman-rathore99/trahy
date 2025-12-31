"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { apiRequest } from "@/lib/api";
import {
  Loader2,
  Save,
  ArrowLeft,
  Trash2,
  Wifi,
  Car,
  Tv,
  Snowflake,
  Droplets,
  Waves,
  MapPin,
  IndianRupee,
  ImageIcon,
} from "lucide-react";

// --- AMENITIES CONFIG ---
const AMENITIES_LIST = [
  { id: "wifi", label: "Fast Wifi", icon: <Wifi size={20} /> },
  { id: "parking", label: "Free Parking", icon: <Car size={20} /> },
  { id: "ac", label: "AC & Cooling", icon: <Snowflake size={20} /> },
  { id: "geyser", label: "Hot Water", icon: <Droplets size={20} /> },
  { id: "tv", label: "Smart TV", icon: <Tv size={20} /> },
  { id: "pool", label: "Swimming Pool", icon: <Waves size={20} /> },
];

export default function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    apiRequest(`/api/admin/hotels/${id}`, "GET")
      .then((data) => {
        setHotel({
          ...data.hotel,
          amenities: data.hotel.amenities || [],
          imageUrls: data.hotel.imageUrls || [],
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // --- HANDLERS ---
  const toggleAmenity = (amenityId: string) => {
    const currentList = hotel.amenities || [];
    if (currentList.includes(amenityId)) {
      setHotel({
        ...hotel,
        amenities: currentList.filter((id: string) => id !== amenityId),
      });
    } else {
      setHotel({ ...hotel, amenities: [...currentList, amenityId] });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest(`/api/admin/hotels/${id}`, "PUT", hotel);
      router.push(`/admin/hotels/${id}`);
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to add gallery image
  const addGalleryImage = (url: string) => {
    if (!url) return;
    setHotel({ ...hotel, imageUrls: [...hotel.imageUrls, url] });
  };

  // Helper to remove gallery image
  const removeGalleryImage = (indexToRemove: number) => {
    setHotel({
      ...hotel,
      imageUrls: hotel.imageUrls.filter(
        (_: any, idx: number) => idx !== indexToRemove
      ),
    });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );

  if (!hotel) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 pb-32 transition-colors">
      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold hidden md:block">
                {hotel.name || "Untitled Property"}
              </h1>
              <p className="text-xs text-gray-500 font-mono">ID: {id}</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20 dark:shadow-white/10 disabled:opacity-50 disabled:scale-100"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN (2/3 width) --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. COVER IMAGE (Large Preview) */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-4 pb-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ImageIcon size={20} className="text-rose-500" /> Cover Photo
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                This is the main image guests will see.
              </p>
            </div>
            {/* Custom Uploader Component */}
            <div className="p-2">
              <ImageUpload
                label=""
                currentUrl={hotel.imageUrl}
                onUpload={(url) => setHotel({ ...hotel, imageUrl: url })}
              />
            </div>
          </div>

          {/* 2. GALLERY GRID */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-lg mb-4">Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Existing Images */}
              {hotel.imageUrls.map((url: string, index: number) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={url}
                    className="w-full h-full object-cover"
                    alt="Gallery"
                  />
                  <button
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Add New Image Button - FIXED */}
              <div className="aspect-square">
                <ImageUpload
                  label="" // No label needed inside the grid
                  onUpload={addGalleryImage}
                  className="h-full" // Forces it to fill the square perfectly
                  clearOnSuccess={true}
                />
              </div>
            </div>
          </div>

          {/* 3. BASIC INFO */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 space-y-5">
            <h3 className="font-bold text-lg">Property Details</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                Property Name
              </label>
              <input
                value={hotel.name || ""}
                onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-medium text-lg transition-all"
                placeholder="e.g. Sunset Villa"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                Description
              </label>
              <textarea
                rows={6}
                value={hotel.description || ""}
                onChange={(e) =>
                  setHotel({ ...hotel, description: e.target.value })
                }
                className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none leading-relaxed transition-all"
                placeholder="Tell guests what makes your place special..."
              />
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN (1/3 width) --- */}
        <div className="space-y-8">
          {/* 4. STATUS CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-lg mb-4">Availability</h3>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
              Status
            </label>
            <div className="relative">
              <select
                value={hotel.status || "pending"}
                onChange={(e) => setHotel({ ...hotel, status: e.target.value })}
                className={`w-full p-4 appearance-none rounded-xl font-bold outline-none border cursor-pointer transition-all ${hotel.status === "approved"
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-black dark:text-white dark:border-gray-800"
                  }`}
              >
                <option value="pending">⚠️ Pending Review</option>
                <option value="approved">✅ Active & Public</option>
                <option value="banned">🚫 Banned / Hidden</option>
              </select>
            </div>
          </div>

          {/* 5. PRICING & LOCATION */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                Price Per Night
              </label>
              <div className="relative">
                <IndianRupee
                  size={18}
                  className="absolute left-4 top-4 text-gray-400"
                />
                <input
                  type="number"
                  value={hotel.pricePerNight || ""}
                  onChange={(e) =>
                    setHotel({
                      ...hotel,
                      pricePerNight: Number(e.target.value),
                    })
                  }
                  className="w-full pl-10 p-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-mono text-lg font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-4 top-4 text-gray-400"
                />
                <input
                  value={hotel.location || ""}
                  onChange={(e) =>
                    setHotel({ ...hotel, location: e.target.value })
                  }
                  className="w-full pl-10 p-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* 6. AMENITIES */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-lg mb-4">Amenities</h3>
            <div className="grid grid-cols-1 gap-2">
              {AMENITIES_LIST.map((item) => {
                const isSelected = (hotel.amenities || []).includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleAmenity(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${isSelected
                      ? "bg-black text-white border-black dark:bg-white dark:text-black shadow-md transform scale-[1.02]"
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

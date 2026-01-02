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
  LayoutGrid,
  BedDouble,
  Plus
} from "lucide-react";
import RoomManager from "@/components/RoomManager";

// Amenities Config
const AMENITIES_LIST = [
  { id: "wifi", label: "Fast Wifi", icon: <Wifi size={20} /> },
  { id: "parking", label: "Free Parking", icon: <Car size={20} /> },
  { id: "ac", label: "AC & Cooling", icon: <Snowflake size={20} /> },
  { id: "geyser", label: "Hot Water", icon: <Droplets size={20} /> },
  { id: "tv", label: "Smart TV", icon: <Tv size={20} /> },
  { id: "pool", label: "Swimming Pool", icon: <Waves size={20} /> },
];

export default function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "rooms">("details"); // ✅ TAB STATE

  // --- FETCH DATA ---
  useEffect(() => {
    apiRequest(`/api/admin/hotels/${id}`, "GET")
      .then((data) => {
        if (data && data.hotel) {
          setHotel({
            ...data.hotel,
            amenities: data.hotel.amenities || [],
            imageUrls: data.hotel.imageUrls || [],
          });
        }
      })
      .catch((err) => console.error("Fetch Error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // --- HANDLERS ---
  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest(`/api/admin/hotels/${id}`, "PUT", hotel);
      alert("Saved Successfully!");
      router.refresh();
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    const currentList = hotel.amenities || [];
    if (currentList.includes(amenityId)) {
      setHotel({ ...hotel, amenities: currentList.filter((id: string) => id !== amenityId) });
    } else {
      setHotel({ ...hotel, amenities: [...currentList, amenityId] });
    }
  };

  const addGalleryImage = (url: string) => {
    if (!url) return;
    setHotel({ ...hotel, imageUrls: [...(hotel.imageUrls || []), url] });
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setHotel({
      ...hotel,
      imageUrls: hotel.imageUrls.filter((_: any, idx: number) => idx !== indexToRemove),
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-rose-600" size={32} /></div>;
  if (!hotel) return <div className="p-10 text-center">Hotel not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 pb-32 transition-colors">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold hidden md:block">{hotel.name || "Edit Hotel"}</h1>
              <p className="text-xs text-gray-500 font-mono">ID: {id}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Tab Switcher (Desktop) */}
            <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'details' ? "bg-white dark:bg-black shadow-sm" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("rooms")}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'rooms' ? "bg-white dark:bg-black shadow-sm" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
              >
                Rooms
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span className="hidden sm:inline">Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher (Mobile) */}
      <div className="md:hidden px-6 pt-4 pb-2">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'details' ? "bg-white dark:bg-black shadow-sm" : "text-gray-500"}`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'rooms' ? "bg-white dark:bg-black shadow-sm" : "text-gray-500"}`}
          >
            Rooms
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6">

        {/* ✅ TAB 1: HOTEL DETAILS */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cover Photo */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                  <h3 className="font-bold text-sm uppercase text-gray-500 flex items-center gap-2"><ImageIcon size={16} /> Cover Image</h3>
                </div>
                <div className="p-4">
                  <ImageUpload label="" currentUrl={hotel.imageUrl} onUpload={(url) => setHotel({ ...hotel, imageUrl: url })} />
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Property Name</label>
                  <input
                    value={hotel.name || ""}
                    onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                    placeholder="Hotel Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Description</label>
                  <textarea
                    rows={5}
                    value={hotel.description || ""}
                    onChange={(e) => setHotel({ ...hotel, description: e.target.value })}
                    className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all leading-relaxed resize-none"
                    placeholder="Describe your property..."
                  />
                </div>
              </div>

              {/* Gallery */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-sm uppercase text-gray-500 mb-4">Image Gallery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {hotel.imageUrls.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700">
                      <img src={url} className="w-full h-full object-cover" alt="Gallery" />
                      <button onClick={() => removeGalleryImage(index)} className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="aspect-square">
                    <ImageUpload label="" onUpload={addGalleryImage} className="h-full" clearOnSuccess={true} />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8">
              {/* Status Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-sm uppercase text-gray-500 mb-4">Publishing Status</h3>
                <select
                  value={hotel.status || "pending"}
                  onChange={(e) => setHotel({ ...hotel, status: e.target.value })}
                  className="w-full p-3 rounded-lg font-bold border bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="pending">⚠️ Pending Review</option>
                  <option value="approved">✅ Active & Public</option>
                  <option value="banned">🚫 Banned / Hidden</option>
                </select>
              </div>

              {/* Pricing & Location */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Base Price (₹)</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-4 top-4 text-gray-400" />
                    <input
                      type="number"
                      value={hotel.pricePerNight || ""}
                      onChange={(e) => setHotel({ ...hotel, pricePerNight: Number(e.target.value) })}
                      className="w-full pl-10 p-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                    <input
                      value={hotel.location || ""}
                      onChange={(e) => setHotel({ ...hotel, location: e.target.value })}
                      className="w-full pl-10 p-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-sm uppercase text-gray-500 mb-4">Amenities</h3>
                <div className="space-y-2">
                  {AMENITIES_LIST.map((item) => {
                    const isSelected = (hotel.amenities || []).includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleAmenity(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"}`}
                      >
                        {item.icon}
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TAB 2: ROOM MANAGER */}
        {activeTab === "rooms" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Room Types</h2>
                  <p className="text-sm text-gray-500">Manage room categories, pricing, and availability.</p>
                </div>
              </div>
              {/* The RoomManager Component handles the list & edit modal internally */}
              <RoomManager hotelId={id} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
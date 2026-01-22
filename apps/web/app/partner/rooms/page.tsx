"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import MultiImageUpload from "@/components/MultiImageUpload";
import {
  Plus,
  Trash2,
  Edit,
  BedDouble,
  Users,
  IndianRupee,
  CheckCircle2,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Bath,
  Loader2,
  X,
  CarFront,
  ChevronDown,
  Refrigerator,
  Utensils,
  MountainSnow,
  Shirt,
  Dumbbell,
  Waves,
  MonitorSmartphone,
} from "lucide-react";

// --- EXPANDED AMENITIES LIST ---
const AMENITIES_LIST = [
  { id: "ac", label: "AC", icon: Wind },
  { id: "wifi", label: "Free WiFi", icon: Wifi },
  { id: "tv", label: "TV", icon: Tv },
  { id: "geyser", label: "Geyser", icon: Bath },
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "parking", label: "Parking", icon: CarFront },
  { id: "fridge", label: "Mini Fridge", icon: Refrigerator },
  { id: "room_service", label: "Room Service", icon: Utensils },
  { id: "balcony", label: "Balcony", icon: MountainSnow },
  { id: "housekeeping", label: "Housekeeping", icon: Shirt },
  { id: "gym", label: "Gym Access", icon: Dumbbell },
  { id: "pool", label: "Pool Access", icon: Waves },
  { id: "smart_tv", label: "Smart TV", icon: MonitorSmartphone },
];

const ROOM_TYPES = [
  "Standard",
  "Deluxe",
  "Super Deluxe",
  "Suite",
  "Family Room",
  "Dormitory",
  "Cottage",
  "Villa",
];

export default function RoomManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Custom Amenity Input State
  const [customAmenity, setCustomAmenity] = useState("");

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    type: "Deluxe",
    basePrice: "",
    discountPrice: "",
    maxAdults: 2,
    maxChildren: 1,
    totalStock: 5,
    amenities: [] as string[],
    images: [] as string[],
    description: "",
  });

  // --- LOAD ROOMS ---
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await apiRequest("/api/partner/rooms", "GET");
      setRooms(data.rooms || []);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("No hotel")) {
        alert("Please complete your Hotel Profile first!");
        router.push("/partner/settings");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const toggleAmenity = (label: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(label);
      if (exists)
        return {
          ...prev,
          amenities: prev.amenities.filter((a) => a !== label),
        };
      return { ...prev, amenities: [...prev.amenities, label] };
    });
  };

  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    if (formData.amenities.includes(customAmenity.trim())) return; // Prevent duplicates

    setFormData((prev) => ({
      ...prev,
      amenities: [...prev.amenities, customAmenity.trim()],
    }));
    setCustomAmenity(""); // Clear input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0)
      return alert("Please upload at least one image");

    setSubmitting(true);
    try {
      await apiRequest("/api/partner/rooms", "POST", formData);
      alert("Room Added Successfully!");
      setIsFormOpen(false);
      fetchRooms(); // Refresh list

      // Reset Form
      setFormData({
        type: "Deluxe",
        basePrice: "",
        discountPrice: "",
        maxAdults: 2,
        maxChildren: 1,
        totalStock: 5,
        amenities: [],
        images: [],
        description: "",
      });
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (room: any) => {
    if (!confirm("Are you sure you want to delete this room type?")) return;
    try {
      const query = `?roomId=${room.id}&hotelId=${room.hotelId || ""}`;
      await apiRequest(`/api/partner/rooms${query}`, "DELETE");
      fetchRooms();
    } catch (error: any) {
      alert("Failed to delete: " + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Room Inventory
          </h1>
          <p className="text-gray-500 mt-1">
            Manage types, pricing, and availability.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-all shadow-sm active:scale-95"
        >
          <Plus size={20} /> Add Room
        </button>
      </div>

      {/* --- ROOM LIST GRID --- */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={40} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <BedDouble size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No rooms listed
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Add your first room category to start accepting bookings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-md transition-all"
            >
              {/* Image Preview */}
              <div className="h-48 bg-gray-100 dark:bg-gray-800 relative group-hover:scale-[1.02] transition-transform duration-500">
                {room.images?.[0] ? (
                  <img
                    src={room.images[0]}
                    alt={room.type}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
                    <BedDouble size={24} />{" "}
                    <span className="text-xs">No Image</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md">
                  {room.totalStock} Available
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {room.type}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Users size={14} /> Max {room.maxAdults} Adults,{" "}
                      {room.maxChildren} Kids
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-600">
                      ₹{room.basePrice}
                    </p>
                    {room.discountPrice && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{Number(room.basePrice) * 1.2}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amenities Tags */}
                <div className="flex flex-wrap gap-2">
                  {room.amenities?.slice(0, 3).map((am: string) => (
                    <span
                      key={am}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-[10px] uppercase font-bold rounded text-gray-600 dark:text-gray-400"
                    >
                      {am}
                    </span>
                  ))}
                  {(room.amenities?.length || 0) > 3 && (
                    <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] rounded text-gray-400">
                      +{room.amenities.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button className="flex-1 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room)}
                    className="flex-1 py-2.5 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD ROOM FORM OVERLAY --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-100 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFormOpen(false)}
          ></div>

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-black h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white dark:bg-black z-10 py-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Room
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-10">
              {/* 1. Room Details */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Room Details
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">
                      Type
                    </span>
                    <div className="relative">
                      <select
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none appearance-none font-medium text-gray-900 dark:text-white"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                      >
                        {ROOM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
                        size={16}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">
                      Inventory
                    </span>
                    <input
                      type="number"
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none font-medium text-gray-900 dark:text-white"
                      value={formData.totalStock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalStock: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <textarea
                  placeholder="Room description (e.g. Sea view, King size bed...)"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none h-24 text-sm font-medium resize-none text-gray-900 dark:text-white"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
              </div>

              {/* 2. Pricing & Capacity */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Pricing & Capacity
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Base Price"
                      className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none font-medium text-gray-900 dark:text-white"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, basePrice: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Offer Price"
                      className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none text-rose-600 font-bold"
                      value={formData.discountPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPrice: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                    <Users size={16} className="text-gray-400 ml-2" />
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none font-medium text-gray-900 dark:text-white"
                      placeholder="Adults"
                      value={formData.maxAdults}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxAdults: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                    <span className="text-[10px] font-bold text-gray-400 ml-2 uppercase">
                      Kids
                    </span>
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none font-medium text-gray-900 dark:text-white"
                      placeholder="Children"
                      value={formData.maxChildren}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxChildren: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 3. Amenities (ENHANCED) */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Amenities
                </label>

                {/* Standard List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AMENITIES_LIST.map((am) => {
                    const Icon = am.icon;
                    const isSelected = formData.amenities.includes(am.label); // Match by Label now
                    return (
                      <button
                        key={am.id}
                        type="button"
                        onClick={() => toggleAmenity(am.label)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/20 dark:border-rose-500/50 dark:text-rose-400"
                            : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        <Icon
                          size={20}
                          className={
                            isSelected ? "text-rose-600" : "text-gray-400"
                          }
                        />
                        {am.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amenity Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom amenity (e.g. River View)"
                    className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none text-sm text-gray-900 dark:text-white"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomAmenity();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-xl hover:opacity-80 transition-opacity"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Selected Custom Amenities Display */}
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full border border-gray-200 dark:border-gray-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleAmenity(tag)}
                        className="hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Images */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Gallery
                </label>
                <MultiImageUpload
                  label="Upload Room Photos"
                  urls={formData.images}
                  onChange={(newUrls) =>
                    setFormData((prev) => ({ ...prev, images: newUrls }))
                  }
                  maxFiles={6}
                />
              </div>

              {/* 5. Submit (Static Bottom) */}
              <div className="pt-6 mt-8 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold shadow-xl shadow-rose-600/30 disabled:opacity-50 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  {submitting ? "Saving..." : "Save Room Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

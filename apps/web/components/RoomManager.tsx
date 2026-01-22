"use client";

import { useState, useEffect } from "react";
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

// --- AMENITIES LIST ---
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

interface RoomManagerProps {
  hotelId?: string;
}

export default function RoomManager({ hotelId }: RoomManagerProps) {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [customAmenity, setCustomAmenity] = useState("");

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

  const apiBase = hotelId ? `/api/admin/rooms` : `/api/partner/rooms`;

  useEffect(() => {
    fetchRooms();
  }, [hotelId]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const url = hotelId ? `${apiBase}?hotelId=${hotelId}` : apiBase;
      const data = await apiRequest(url, "GET");

      // ✅ DATA NORMALIZER: Fixes mismatch between old 'title' and new 'type'
      const normalizedRooms = (data.rooms || []).map((r: any) => ({
        ...r,
        // If 'type' is missing, use 'title' (Legacy Support)
        type: r.type || r.title || "Standard Room",
        // If 'basePrice' is missing, use 'price'
        basePrice: r.basePrice || r.price || "0",
        // If 'maxAdults' is missing, parse 'capacity'
        maxAdults: r.maxAdults || Number(r.capacity) || 2,
        // Ensure amenities is an array
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
        // Ensure images is an array
        images: Array.isArray(r.images) ? r.images : [],
        // Default stock if missing
        totalStock: r.totalStock || 5,
      }));

      setRooms(normalizedRooms);
    } catch (error: any) {
      console.error("Failed to load rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (room: any) => {
    setEditingRoomId(room.id);
    // Populate form with normalized data
    setFormData({
      type: room.type || room.title || "Deluxe", // Fallback for old data
      basePrice: room.basePrice || room.price || "",
      discountPrice: room.discountPrice || "",
      maxAdults: room.maxAdults || Number(room.capacity) || 2,
      maxChildren: room.maxChildren || 1,
      totalStock: room.totalStock || 5,
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      images: Array.isArray(room.images) ? room.images : [],
      description: room.description || "",
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
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
    setEditingRoomId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, hotelId };

      if (editingRoomId) {
        const query = hotelId
          ? `?roomId=${editingRoomId}&hotelId=${hotelId}`
          : `?roomId=${editingRoomId}`;
        await apiRequest(`${apiBase}${query}`, "PUT", payload);
      } else {
        await apiRequest(apiBase, "POST", payload);
      }

      alert("Room Saved Successfully!");
      setIsFormOpen(false);
      fetchRooms();
      resetForm();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Delete this room permanently?")) return;
    try {
      const query = hotelId
        ? `?roomId=${roomId}&hotelId=${hotelId}`
        : `?roomId=${roomId}`;
      await apiRequest(`${apiBase}${query}`, "DELETE");
      fetchRooms();
    } catch (error: any) {
      alert("Failed to delete: " + error.message);
    }
  };

  // Helper: Toggle Amenity
  const toggleAmenity = (label: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(label);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== label)
          : [...prev.amenities, label],
      };
    });
  };

  // Helper: Add Custom Amenity
  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    if (!formData.amenities.includes(customAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()],
      }));
    }
    setCustomAmenity("");
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BedDouble className="text-rose-600" /> Room Inventory
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage pricing, stock, and amenities.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={20} /> Add Room
        </button>
      </div>

      {/* --- ROOM LIST GRID --- */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-rose-600" size={40} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 font-medium">No rooms found.</p>
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
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs flex-col gap-2">
                    <BedDouble size={24} /> No Image
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md">
                  {room.totalStock} Units
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
                        ₹{room.discountPrice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amenities Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {room.amenities?.slice(0, 3).map((am: string, i: number) => (
                    <span
                      key={i}
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
                  <button
                    onClick={() => handleEditClick(room)}
                    className="flex-1 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="flex-1 py-2 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD/EDIT FORM OVERLAY --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-100 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFormOpen(false)}
          ></div>

          <div className="relative w-full max-w-lg bg-white dark:bg-black h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white dark:bg-black z-10 py-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingRoomId ? "Edit Room" : "Add New Room"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
              {/* 1. Details */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Room Details
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <select
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none appearance-none font-bold text-gray-900 dark:text-white"
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
                  <input
                    type="number"
                    placeholder="Stock (e.g. 5)"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none font-bold text-gray-900 dark:text-white"
                    value={formData.totalStock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalStock: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <textarea
                  placeholder="Room description..."
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
                  Pricing
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
                      className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none font-bold text-gray-900 dark:text-white"
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
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                    <Users size={16} className="text-gray-400 ml-2" />
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none ml-2 font-bold text-gray-900 dark:text-white"
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
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-400 ml-2">
                      KIDS
                    </span>
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none ml-2 font-bold text-gray-900 dark:text-white"
                      placeholder="Kids"
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

              {/* 3. Amenities */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Amenities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AMENITIES_LIST.map((am) => {
                    const Icon = am.icon;
                    const isSelected = formData.amenities.includes(am.label);
                    return (
                      <button
                        key={am.id}
                        type="button"
                        onClick={() => toggleAmenity(am.label)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/20"
                            : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-800 hover:border-gray-300"
                        }`}
                      >
                        <Icon
                          size={16}
                          className={
                            isSelected ? "text-rose-600" : "text-gray-400"
                          }
                        />
                        {am.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom (e.g. Sea View)"
                    className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none text-sm font-bold text-gray-900 dark:text-white"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addCustomAmenity())
                    }
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-xl"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-bold rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {tag}{" "}
                      <button type="button" onClick={() => toggleAmenity(tag)}>
                        <X size={12} className="hover:text-red-500" />
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

              {/* Submit */}
              <div className="pt-4 sticky bottom-0 bg-white dark:bg-black pb-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-rose-600/20"
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

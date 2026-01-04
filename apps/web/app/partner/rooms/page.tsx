"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import MultiImageUpload from "@/components/MultiImageUpload"; // <--- Ensure this path matches where you saved the component
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
    CarFront
} from "lucide-react";

// --- CONSTANTS ---
const ROOM_TYPES = ["Standard", "Deluxe", "Super Deluxe", "Suite", "Family Room", "Dormitory"];
const AMENITIES_LIST = [
    { id: "ac", label: "AC", icon: Wind },
    { id: "wifi", label: "Free WiFi", icon: Wifi },
    { id: "tv", label: "TV", icon: Tv },
    { id: "geyser", label: "Geyser", icon: Bath },
    { id: "breakfast", label: "Breakfast", icon: Coffee },
    { id: "parking", label: "Parking", icon: CarFront },
];

export default function RoomManager() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        type: "Deluxe",
        basePrice: "",
        discountPrice: "",
        maxAdults: 2,
        maxChildren: 1,
        totalStock: 5,
        amenities: [] as string[],
        images: [] as string[], // Stores array of URLs
        description: ""
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
            // Handle Missing Hotel Profile
            if (error.message.includes("No hotel") || error.message.includes("Hotel ID required")) {
                alert("Please complete your Hotel Profile first!");
                router.push("/partner/settings");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const toggleAmenity = (id: string) => {
        setFormData(prev => {
            const exists = prev.amenities.includes(id);
            if (exists) return { ...prev, amenities: prev.amenities.filter(a => a !== id) };
            return { ...prev, amenities: [...prev.amenities, id] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.images.length === 0) return alert("Please upload at least one image");

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
                description: ""
            });

        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this room type?")) return;
        try {
            await apiRequest(`/api/partner/rooms?id=${id}`, "DELETE");
            fetchRooms();
        } catch (error: any) {
            alert("Failed to delete (Ensure API DELETE method is implemented)");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Manager</h1>
                    <p className="text-gray-500">Manage your room inventory, pricing, and amenities.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> Add New Room
                </button>
            </div>

            {/* --- ROOM LIST GRID --- */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-600" size={40} /></div>
            ) : rooms.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <BedDouble size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-600">No rooms added yet</h3>
                    <p className="text-gray-400 text-sm">Start by adding your first room category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                        <div key={room.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:border-rose-500/30 transition-all">
                            {/* Image Preview */}
                            <div className="h-48 bg-gray-100 relative">
                                {room.images?.[0] ? (
                                    <img src={room.images[0]} alt={room.type} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                )}
                                <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md">
                                    {room.totalStock} Units
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{room.type}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <Users size={14} /> Max {room.maxAdults} Adults, {room.maxChildren} Kids
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-rose-600">₹{room.price || room.basePrice}</p>
                                        <p className="text-xs text-gray-400 line-through">₹{room.discountPrice || Number(room.basePrice) * 1.2}</p>
                                    </div>
                                </div>

                                {/* Amenities Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {room.amenities?.slice(0, 3).map((am: string) => (
                                        <span key={am} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-md text-gray-600 dark:text-gray-300 capitalize">
                                            {am}
                                        </span>
                                    ))}
                                    {(room.amenities?.length || 0) > 3 && (
                                        <span className="px-2 py-1 bg-gray-50 text-xs rounded-md text-gray-400">+{room.amenities.length - 3}</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <button className="flex-1 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2">
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(room.id)}
                                        className="flex-1 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- ADD ROOM FORM OVERLAY (Slide-over) --- */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>

                    {/* Panel */}
                    <div className="relative w-full max-w-lg bg-white dark:bg-black h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">

                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Add New Room</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* 1. Basic Info */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase text-gray-500">Room Details</label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-400 mb-1 block">Room Type</span>
                                        <select
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 mb-1 block">Total Rooms (Stock)</span>
                                        <input
                                            type="number"
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                                            value={formData.totalStock}
                                            onChange={e => setFormData({ ...formData, totalStock: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <textarea
                                    placeholder="Room description (e.g. Sea view, King size bed...)"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none h-24 text-sm"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            {/* 2. Pricing & Capacity */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase text-gray-500">Pricing & Capacity</label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3 top-3.5 text-gray-400" />
                                        <input
                                            type="number"
                                            placeholder="Base Price"
                                            className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none"
                                            value={formData.basePrice}
                                            onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3 top-3.5 text-gray-400" />
                                        <input
                                            type="number"
                                            placeholder="Offer Price"
                                            className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none text-rose-600 font-bold"
                                            value={formData.discountPrice}
                                            onChange={e => setFormData({ ...formData, discountPrice: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border">
                                        <Users size={16} className="text-gray-400 ml-2" />
                                        <input
                                            type="number"
                                            className="w-full bg-transparent outline-none"
                                            placeholder="Adults"
                                            value={formData.maxAdults}
                                            onChange={e => setFormData({ ...formData, maxAdults: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border">
                                        <span className="text-xs font-bold text-gray-400 ml-2">KIDS</span>
                                        <input
                                            type="number"
                                            className="w-full bg-transparent outline-none"
                                            placeholder="Children"
                                            value={formData.maxChildren}
                                            onChange={e => setFormData({ ...formData, maxChildren: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Amenities */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase text-gray-500">Amenities</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {AMENITIES_LIST.map((am) => {
                                        const Icon = am.icon;
                                        const isSelected = formData.amenities.includes(am.id);
                                        return (
                                            <button
                                                key={am.id}
                                                type="button"
                                                onClick={() => toggleAmenity(am.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${isSelected
                                                        ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/20"
                                                        : "bg-gray-50 border-gray-100 text-gray-500 dark:bg-gray-900 dark:border-gray-800"
                                                    }`}
                                            >
                                                <Icon size={18} className={isSelected ? "text-rose-600" : "text-gray-400"} />
                                                {am.label}
                                                {isSelected && <CheckCircle2 size={16} className="ml-auto text-rose-600" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* 4. Images (UPDATED to use MultiImageUpload) */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                                <MultiImageUpload
                                    label="Room Photos"
                                    urls={formData.images}
                                    onChange={(newUrls) => {
                                        setFormData(prev => ({ ...prev, images: newUrls }));
                                    }}
                                    maxFiles={6}
                                />
                            </div>

                            {/* Submit */}
                            <div className="pt-6 sticky bottom-0 bg-white dark:bg-black pb-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {submitting && <Loader2 className="animate-spin" size={20} />}
                                    Save Room
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
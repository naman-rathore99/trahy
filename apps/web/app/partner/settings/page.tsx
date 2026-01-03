"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import { Save, Loader2, Hotel, MapPin } from "lucide-react";

export default function PartnerSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hotel, setHotel] = useState<any>(null);

    // Load current hotel details
    useEffect(() => {
        const fetchHotel = async () => {
            try {
                const res = await apiRequest("/api/partner/my-hotel", "GET");
                if (res.hotel) setHotel(res.hotel);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Create a specific PUT route for hotel updates later, 
            // or reuse an admin one if secured properly.
            // For now, let's assume this endpoint exists:
            await apiRequest(`/api/partner/hotel/${hotel.id}`, "PUT", hotel);
            alert("Settings saved successfully!");
        } catch (err: any) {
            alert("Failed to save: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-600" /></div>;
    if (!hotel) return <div className="p-10">No hotel found.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Property Settings</h1>
                <p className="text-gray-500">Update your hotel information and appearance.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">

                {/* Basic Info Section */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Hotel size={20} className="text-rose-600" /> General Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Property Name</label>
                            <input
                                className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold dark:text-white"
                                value={hotel.name}
                                onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Base Price (₹)</label>
                            <input
                                type="number"
                                className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-mono dark:text-white"
                                value={hotel.pricePerNight}
                                onChange={(e) => setHotel({ ...hotel, pricePerNight: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Location Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                                    value={hotel.location}
                                    onChange={(e) => setHotel({ ...hotel, location: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Description</label>
                            <textarea
                                rows={4}
                                className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                                value={hotel.description}
                                onChange={(e) => setHotel({ ...hotel, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Media Section */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Cover Image</h2>
                    <div className="h-64 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black overflow-hidden">
                        <ImageUpload
                            label="Change Cover Photo"
                            currentUrl={hotel.imageUrl}
                            onUpload={(url) => setHotel({ ...hotel, imageUrl: url })}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>

            </form>
        </div>
    );
}
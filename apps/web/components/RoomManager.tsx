"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Plus, Trash2, BedDouble, Users, IndianRupee, Wifi, Wind, Loader2, X } from "lucide-react";

interface RoomManagerProps {
  hotelId: string;
}

export default function RoomManager({ hotelId }: RoomManagerProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    capacity: "2",
    hasAC: false,
    hasWifi: false,
  });

  // 1. Fetch Rooms
  const fetchRooms = async () => {
    try {
      const res = await apiRequest(`/api/partner/rooms?hotelId=${hotelId}`, "GET");
      setRooms(res.rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) fetchRooms();
  }, [hotelId]);

  // 2. Add Room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Construct amenities array
    const amenities = [];
    if (formData.hasAC) amenities.push("AC");
    if (formData.hasWifi) amenities.push("Wifi");

    try {
      await apiRequest("/api/partner/rooms", "POST", {
        hotelId,
        title: formData.title,
        price: formData.price,
        capacity: formData.capacity,
        amenities
      });
      await fetchRooms(); // Refresh list
      setIsModalOpen(false); // Close modal
      setFormData({ title: "", price: "", capacity: "2", hasAC: false, hasWifi: false }); // Reset
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 3. Delete Room
  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await apiRequest(`/api/partner/rooms?hotelId=${hotelId}&roomId=${roomId}`, "DELETE");
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (err: any) {
      alert("Failed to delete");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-rose-600" /></div>;

  return (
    <div>
      {/* HEADER ACTION */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black dark:bg-white text-white dark:text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} /> Add New Room
        </button>
      </div>

      {/* ROOM GRID */}
      {rooms.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <BedDouble size={32} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">No rooms added yet</h3>
          <p className="text-sm text-gray-500">Start by adding your first room type.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative group">

              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl">
                  <BedDouble size={24} />
                </div>
                <button onClick={() => handleDelete(room.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{room.title}</h3>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 flex items-baseline gap-1">
                ₹{room.price} <span className="text-xs font-medium text-gray-400">/ night</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="flex items-center gap-1 font-bold"><Users size={14} /> {room.capacity} Guests</span>
                {room.amenities?.includes("AC") && <span className="flex items-center gap-1"><Wind size={14} /> AC</span>}
                {room.amenities?.includes("Wifi") && <span className="flex items-center gap-1"><Wifi size={14} /> Wifi</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD ROOM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Room Type</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Room Title</label>
                <input required className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  placeholder="e.g. Super Deluxe King"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Price (₹)</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input required type="number" className="w-full pl-9 p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                      placeholder="2500"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Capacity</label>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input required type="number" className="w-full pl-9 p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="2"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Amenities</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 dark:border-gray-800 rounded-xl flex-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <input type="checkbox" checked={formData.hasAC} onChange={e => setFormData({ ...formData, hasAC: e.target.checked })} className="w-5 h-5 accent-rose-600" />
                    <span className="font-bold text-sm">Air Conditioning</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 dark:border-gray-800 rounded-xl flex-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <input type="checkbox" checked={formData.hasWifi} onChange={e => setFormData({ ...formData, hasWifi: e.target.checked })} className="w-5 h-5 accent-rose-600" />
                    <span className="font-bold text-sm">Free Wifi</span>
                  </label>
                </div>
              </div>

              <button disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 transition-all">
                {saving ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Create Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
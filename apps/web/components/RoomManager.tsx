"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  BedDouble,
  Users,
  IndianRupee,
  Check,
  ImageIcon
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

export default function RoomManager({ hotelId }: { hotelId: string }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null); // null = Add Mode
  const [saving, setSaving] = useState(false);

  // --- FETCH ROOMS ---
  useEffect(() => {
    fetchRooms();
  }, [hotelId]);

  const fetchRooms = async () => {
    try {
      const data = await apiRequest(`/api/hotels/${hotelId}/rooms`, "GET");
      setRooms(data.rooms || []);
    } catch (err) {
      console.error("Failed to load rooms", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOpenModal = (room?: any) => {
    setEditingRoom(room || { name: "", price: "", capacity: 2, description: "", imageUrl: "" });
    setIsModalOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room type?")) return;
    try {
      await apiRequest(`/api/admin/rooms/${roomId}`, "DELETE");
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const handleSave = async () => {
    if (!editingRoom.name || !editingRoom.price) return alert("Name and Price required");

    setSaving(true);
    try {
      if (editingRoom.id) {
        // UPDATE Existing Room
        await apiRequest(`/api/admin/rooms/${editingRoom.id}`, "PUT", editingRoom);
        setRooms(rooms.map(r => r.id === editingRoom.id ? editingRoom : r));
      } else {
        // CREATE New Room
        const res = await apiRequest(`/api/admin/hotels/${hotelId}/rooms`, "POST", editingRoom);
        if (res.roomId) {
          fetchRooms(); // Refresh to get the new ID
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save room.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500"><Loader2 className="animate-spin inline" /> Loading rooms...</div>;

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
          <BedDouble className="text-rose-600" size={24} /> Room Configuration
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          <Plus size={18} /> Add Room
        </button>
      </div>

      {/* ROOM LIST */}
      {rooms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 text-sm">No room types added yet.</p>
          <button onClick={() => handleOpenModal()} className="text-rose-600 font-bold text-sm mt-2 hover:underline">Add your first room</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl relative group hover:border-rose-500 transition-colors shadow-sm flex flex-col h-full">

              {/* Room Image Preview */}
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 overflow-hidden relative">
                {room.imageUrl ? (
                  <img src={room.imageUrl} className="w-full h-full object-cover" alt={room.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={32} />
                  </div>
                )}
                {/* Price Tag Overlay */}
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 backdrop-blur-md text-black dark:text-white px-3 py-1 rounded-lg text-xs font-bold font-mono shadow-sm">
                  ₹{room.price}
                </div>
              </div>

              {/* Info */}
              <div className="mb-2">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{room.name}</h4>
              </div>

              <div className="flex gap-3 text-xs text-gray-500 mb-6">
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded-md font-medium">
                  <Users size={14} /> {room.capacity} Guests
                </span>
              </div>

              {/* Actions */}
              <div className="mt-auto grid grid-cols-4 gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                <button
                  onClick={() => handleOpenModal(room)}
                  className="col-span-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit2 size={14} /> Edit Details
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="col-span-1 p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD / EDIT ROOM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg max-h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl relative border border-gray-200 dark:border-gray-800 flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRoom?.id ? "Edit Room Type" : "Add New Room"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

              {/* Room Name */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Room Name</label>
                <input
                  className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-medium"
                  placeholder="e.g. Super Deluxe"
                  value={editingRoom.name}
                  onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                />
              </div>

              {/* Price & Capacity Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Price (₹)</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-4 top-4 text-gray-400" />
                    <input
                      type="number"
                      className="w-full p-4 pl-10 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-mono font-bold"
                      placeholder="2500"
                      value={editingRoom.price}
                      onChange={(e) => setEditingRoom({ ...editingRoom, price: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Capacity</label>
                  <div className="relative">
                    <Users size={16} className="absolute left-4 top-4 text-gray-400" />
                    <input
                      type="number"
                      className="w-full p-4 pl-10 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-bold"
                      value={editingRoom.capacity}
                      onChange={(e) => setEditingRoom({ ...editingRoom, capacity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload - CLEAN LAYOUT */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Room Image</label>
                <div className="h-48 w-full bg-gray-50 dark:bg-black rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden">
                  <ImageUpload
                    currentUrl={editingRoom.imageUrl}
                    onUpload={(url) => setEditingRoom({ ...editingRoom, imageUrl: url })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Description (Optional)</label>
                <textarea
                  rows={3}
                  className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-rose-500 resize-none dark:text-white leading-relaxed"
                  placeholder="Details about bed size, view, amenities etc."
                  value={editingRoom.description || ""}
                  onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-2 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 rounded-b-3xl">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 transition-all active:scale-95 text-lg"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                {editingRoom?.id ? "Update Room" : "Create Room"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
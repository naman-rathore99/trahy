"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Plus, Trash2, Bed, Users, IndianRupee, Loader2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

export default function RoomManager({ hotelId }: { hotelId: string }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Room Form State
  const [newRoom, setNewRoom] = useState({
    name: "",
    price: "",
    capacity: "2",
    imageUrl: "",
  });

  // Fetch Rooms
  useEffect(() => {
    fetchRooms();
  }, [hotelId]);

  const fetchRooms = async () => {
    try {
      const data = await apiRequest(
        `/api/admin/hotels/${hotelId}/rooms`,
        "GET"
      );
      setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.price) return alert("Fill in details!");
    setSaving(true);
    try {
      await apiRequest(`/api/admin/hotels/${hotelId}/rooms`, "POST", {
        ...newRoom,
        price: Number(newRoom.price),
        capacity: Number(newRoom.capacity),
      });
      setIsAdding(false);
      setNewRoom({ name: "", price: "", capacity: "2", imageUrl: "" });
      fetchRooms(); // Refresh list
    } catch (err) {
      alert("Error adding room");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Bed className="text-rose-600" size={20} /> Room Types
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm font-bold bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Plus size={16} /> Add Room
        </button>
      </div>

      {/* --- ADD ROOM FORM --- */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-bold text-sm mb-4">New Room Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Room Name (e.g. Deluxe Suite)"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              className="p-3 rounded-xl border bg-white dark:bg-black border-gray-200 dark:border-gray-700 outline-none font-medium"
            />
            <div className="relative">
              <IndianRupee
                size={16}
                className="absolute left-3 top-3.5 text-gray-400"
              />
              <input
                type="number"
                placeholder="Price"
                value={newRoom.price}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, price: e.target.value })
                }
                className="w-full p-3 pl-9 rounded-xl border bg-white dark:bg-black border-gray-200 dark:border-gray-700 outline-none font-medium"
              />
            </div>
            <div className="relative">
              <Users
                size={16}
                className="absolute left-3 top-3.5 text-gray-400"
              />
              <input
                type="number"
                placeholder="Capacity"
                value={newRoom.capacity}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, capacity: e.target.value })
                }
                className="w-full p-3 pl-9 rounded-xl border bg-white dark:bg-black border-gray-200 dark:border-gray-700 outline-none font-medium"
              />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                label="Room Photo"
                currentUrl={newRoom.imageUrl}
                onUpload={(url) => setNewRoom({ ...newRoom, imageUrl: url })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRoom}
              disabled={saving}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="animate-spin" size={14} />} Save
              Room
            </button>
          </div>
        </div>
      )}

      {/* --- ROOM LIST --- */}
      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="animate-spin inline text-rose-600" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
          No rooms added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center gap-4 p-3 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {room.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Bed className="m-auto mt-4 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {room.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {room.capacity} Guests
                  </span>
                  <span className="font-bold text-rose-600">₹{room.price}</span>
                </div>
              </div>
              {/* Future: Add Edit/Delete buttons here */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

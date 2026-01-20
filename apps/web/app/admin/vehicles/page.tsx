"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import {
  Plus,
  Trash2,
  Edit2,
  Fuel,
  Users,
  IndianRupee,
  Loader2,
  X,
  Check,
  Cog,
  Car,
  Search,
} from "lucide-react";

// --- SMART FEATURE CONFIGURATION ---
const FEATURES_CONFIG = {
  "Car Rental": [
    "AC",
    "Music System",
    "GPS Navigation",
    "Bluetooth",
    "Airbags",
    "Sunroof",
    "Carrier",
    "Fastag",
    "USB Charger",
    "First Aid Kit",
  ],
  "City Ride": [
    "Driver Included",
    "Fan",
    "Music System",
    "Curtains",
    "First Aid Kit",
  ],
  "2-Wheeler": [
    "Helmet Included",
    "Electric Start",
    "Disc Brakes",
    "Tubeless Tyres",
    "Mobile Holder",
    "USB Charger",
    "First Aid Kit",
  ],
};

const DEFAULT_FEATURES = ["First Aid Kit", "GPS"];

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Car Rental",
    type: "",
    price: "",
    seats: "4",
    fuel: "Diesel",
    imageUrl: "",
    features: [] as string[],
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/vehicles", "GET");
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      category: "Car Rental",
      type: "",
      price: "",
      seats: "4",
      fuel: "Diesel",
      imageUrl: "",
      features: [],
    });
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: any) => {
    setEditingId(vehicle.id);
    setFormData({
      name: vehicle.name,
      category: vehicle.category,
      type: vehicle.type,
      price: vehicle.price,
      seats: vehicle.seats,
      fuel: vehicle.fuel,
      imageUrl: vehicle.imageUrl,
      features: vehicle.features || [],
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => {
      const exists = prev.features.includes(feature);
      return exists
        ? { ...prev, features: prev.features.filter((f) => f !== feature) }
        : { ...prev, features: [...prev.features, feature] };
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.imageUrl)
      return alert("Please fill name, price, and upload an image.");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        seats: Number(formData.seats),
      };
      if (editingId)
        await apiRequest(`/api/admin/vehicles/${editingId}`, "PUT", payload);
      else await apiRequest("/api/admin/vehicles", "POST", payload);
      setIsFormOpen(false);
      setEditingId(null);
      fetchVehicles();
    } catch (err) {
      alert("Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await apiRequest(`/api/admin/vehicles/${id}`, "DELETE");
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const availableFeatures =
    FEATURES_CONFIG[formData.category as keyof typeof FEATURES_CONFIG] ||
    DEFAULT_FEATURES;

  return (
    <div className="max-w-6xl mx-auto font-sans pb-20">
      {" "}
      {/* ✅ Clean container, no extra padding */}
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Vehicle Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your fleet inventory and pricing.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleAddNew}
            className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity shadow-lg"
          >
            <Plus size={20} /> Add Vehicle
          </button>
        )}
      </div>
      {/* FORM */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="font-bold text-lg">
              {editingId ? "Edit Vehicle" : "Add New Vehicle"}
            </h2>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Vehicle Photo
              </label>
              <ImageUpload
                label="Upload Photo"
                currentUrl={formData.imageUrl}
                onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>

            {/* Inputs */}
            <div className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        features: [],
                      })
                    }
                  >
                    <option value="Car Rental">Car Rental</option>
                    <option value="2-Wheeler">2-Wheeler</option>
                    <option value="City Ride">City Ride (Auto)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                    Vehicle Name
                  </label>
                  <input
                    placeholder="e.g. Innova Crysta"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                    Type
                  </label>
                  <input
                    placeholder="e.g. SUV, Sedan"
                    className="input-field"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                    Price / Day
                  </label>
                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="number"
                      className="input-field pl-8"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                      Seats
                    </label>
                    <div className="relative">
                      <Users
                        size={16}
                        className="absolute left-3 top-3.5 text-gray-400"
                      />
                      <input
                        type="number"
                        className="input-field pl-8"
                        value={formData.seats}
                        onChange={(e) =>
                          setFormData({ ...formData, seats: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                      Fuel
                    </label>
                    <div className="relative">
                      <Fuel
                        size={16}
                        className="absolute left-3 top-3.5 text-gray-400"
                      />
                      <select
                        className="input-field pl-8"
                        value={formData.fuel}
                        onChange={(e) =>
                          setFormData({ ...formData, fuel: e.target.value })
                        }
                      >
                        <option>Diesel</option>
                        <option>Petrol</option>
                        <option>Electric</option>
                        <option>CNG</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase flex items-center gap-2">
                  <Cog size={14} /> Features
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${formData.features.includes(feature) ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700"}`}
                    >
                      {formData.features.includes(feature) && (
                        <Check size={12} />
                      )}{" "}
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}{" "}
                  Save Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* LIST */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-rose-600" size={32} />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
          <Car className="text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">No vehicles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="h-48 bg-gray-100 dark:bg-gray-800 relative">
                <img
                  src={v.imageUrl || "/placeholder.jpg"}
                  className="w-full h-full object-cover"
                  alt={v.name}
                />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                  {v.type}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {v.name}
                  </h3>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white">
                      ₹{v.price}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      / day
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    <Users size={12} /> {v.seats} Seats
                  </span>
                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    <Fuel size={12} /> {v.fuel}
                  </span>
                </div>

                <div className="mt-auto flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleEdit(v)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

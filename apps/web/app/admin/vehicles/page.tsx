"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import { Plus, Trash2, Edit2, Fuel, Users, IndianRupee, Loader2, X, Check, Cog, Car } from "lucide-react";

// --- SMART FEATURE CONFIGURATION ---
const FEATURES_CONFIG = {
  "Car Rental": ["AC", "Music System", "GPS Navigation", "Bluetooth", "Airbags", "Sunroof", "Carrier", "Fastag", "USB Charger", "First Aid Kit"],
  "City Ride": ["Driver Included", "Fan", "Music System", "Curtains", "First Aid Kit"],
  "2-Wheeler": ["Helmet Included", "Electric Start", "Disc Brakes", "Tubeless Tyres", "Mobile Holder", "USB Charger", "First Aid Kit"]
};

// Default features if category matches nothing
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
    features: [] as string[]
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

  // --- FORM HANDLERS ---

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
      features: []
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
      features: vehicle.features || []
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle Feature Selection
  const toggleFeature = (feature: string) => {
    setFormData(prev => {
      const exists = prev.features.includes(feature);
      if (exists) {
        return { ...prev, features: prev.features.filter(f => f !== feature) };
      } else {
        return { ...prev, features: [...prev.features, feature] };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.imageUrl) {
      return alert("Please fill name, price, and upload an image.");
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        seats: Number(formData.seats),
      };

      if (editingId) {
        await apiRequest(`/api/admin/vehicles/${editingId}`, "PUT", payload);
      } else {
        await apiRequest("/api/admin/vehicles", "POST", payload);
      }

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
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // Get available features based on selected category
  const availableFeatures = FEATURES_CONFIG[formData.category as keyof typeof FEATURES_CONFIG] || DEFAULT_FEATURES;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      <Navbar variant="default" />

      <div className="max-w-5xl mx-auto px-4 pt-24 md:pt-32">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Vehicle Management</h1>
          {!isFormOpen && (
            <button
              onClick={handleAddNew}
              className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-colors"
            >
              <Plus size={20} /> Add Vehicle
            </button>
          )}
        </div>

        {/* --- FORM (Add or Edit) --- */}
        {isFormOpen && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{editingId ? "Edit Vehicle" : "New Vehicle Details"}</h2>
              <button onClick={() => setIsFormOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left: Image Upload */}
              <div className="md:row-span-3">
                <label className="block text-sm font-bold mb-2">Vehicle Image</label>
                <ImageUpload
                  label="Upload Photo"
                  currentUrl={formData.imageUrl}
                  onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                />
              </div>

              {/* Right: Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Category</label>
                    <select
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none font-medium"
                      value={formData.category}
                      onChange={(e) => setFormData({
                        ...formData,
                        category: e.target.value,
                        features: [] // Clear features when switching category to avoid mismatch
                      })}
                    >
                      <option value="Car Rental">Car Rental</option>
                      <option value="2-Wheeler">2-Wheeler</option>
                      <option value="City Ride">City Ride (Auto)</option>
                    </select>
                  </div>
                </div>

                <input
                  placeholder="Vehicle Name (e.g. Innova Crysta)"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder={formData.category === "2-Wheeler" ? "Type (e.g. Scooty, Bike)" : "Type (e.g. SUV, Sedan)"}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none font-medium"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input type="number" placeholder="Price / Day" className="w-full pl-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none font-medium"
                      value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Seats"
                      className="w-full pl-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none font-medium"
                      value={formData.seats}
                      onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                      // Auto-set seats to 2 for bikes for convenience
                      onFocus={() => formData.category === "2-Wheeler" && !formData.seats && setFormData({ ...formData, seats: "2" })}
                    />
                  </div>
                  <div className="relative">
                    <Fuel size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <select className="w-full pl-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none font-medium"
                      value={formData.fuel} onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}>
                      <option>Diesel</option>
                      <option>Petrol</option>
                      <option>Electric</option>
                      <option>CNG</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* --- SMART FEATURES SECTION --- */}
            <div className="mb-6">
              <label className="text-sm font-bold mb-3 block flex items-center gap-2">
                <Cog size={16} className="text-rose-600" />
                Vehicle Features ({formData.category})
              </label>
              <div className="flex flex-wrap gap-2">
                {availableFeatures.map((feature) => {
                  const isSelected = formData.features.includes(feature);
                  return (
                    <button
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${isSelected
                        ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400"
                        : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400 hover:border-gray-300"
                        }`}
                    >
                      {isSelected && <Check size={12} />} {feature}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setIsFormOpen(false)} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={14} />} {editingId ? "Update Vehicle" : "Save Vehicle"}
              </button>
            </div>
          </div>
        )}

        {/* --- LIST --- */}
        {loading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin text-rose-600 mx-auto" size={32} /></div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <Car className="mx-auto text-gray-300 mb-2" size={48} />
            <p className="text-gray-500 font-medium">No vehicles added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-200 dark:border-gray-800 flex gap-4 items-start group hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0">
                  <img src={v.imageUrl || "/placeholder.jpg"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{v.name}</h3>
                      <p className="text-xs text-rose-600 font-bold uppercase">{v.type}</p>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">₹{v.price}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Users size={12} /> {v.seats}</span>
                    <span className="flex items-center gap-1"><Fuel size={12} /> {v.fuel}</span>
                  </div>
                  {/* Tags Preview */}
                  <div className="flex gap-1 mt-2 overflow-hidden h-5">
                    {(v.features || []).slice(0, 3).map((f: string, i: number) => (
                      <span key={i} className="text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 rounded text-gray-500">{f}</span>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(v)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-300" title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
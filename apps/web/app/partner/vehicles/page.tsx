"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Car, Plus, Clock, Loader2, X, Check } from "lucide-react";

export default function PartnerVehiclesPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // New Vehicle Form State
    const [newVehicle, setNewVehicle] = useState({
        number: "",
        model: "",
        driver: "",
        status: "Available",
        eta: "On Station"
    });

    // 1. Fetch Vehicles
    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await apiRequest("/api/partner/vehicles", "GET");
            setVehicles(res.vehicles || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Add Vehicle Handler
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVehicle.number || !newVehicle.model) return alert("Number and Model required");

        setSaving(true);
        try {
            await apiRequest("/api/partner/vehicles", "POST", newVehicle);
            await fetchVehicles(); // Refresh list
            setIsModalOpen(false); // Close modal
            setNewVehicle({ number: "", model: "", driver: "", status: "Available", eta: "On Station" }); // Reset
        } catch (err: any) {
            alert("Failed to add: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-600" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Fleet</h1>
                    <p className="text-gray-500">Manage your vehicles and track live status.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-lg active:scale-95 transition-all"
                >
                    <Plus size={18} /> Add Vehicle
                </button>
            </div>

            {vehicles.length === 0 ? (
                <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500">No vehicles added yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((v) => (
                        <div key={v.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group hover:border-rose-500 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                    <Car size={24} />
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${v.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {v.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{v.number}</h3>
                            <p className="text-sm text-gray-500 mb-4">{v.model} • {v.driver || "No Driver"}</p>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300">
                                    <Clock size={14} className="text-gray-400" /> {v.eta}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD VEHICLE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Vehicle</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Vehicle Number</label>
                                <input className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none font-bold uppercase"
                                    placeholder="UP85 AB 1234"
                                    value={newVehicle.number}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Model Name</label>
                                <input className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
                                    placeholder="e.g. Innova Crysta"
                                    value={newVehicle.model}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Driver Name</label>
                                <input className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
                                    placeholder="Driver Name"
                                    value={newVehicle.driver}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, driver: e.target.value })}
                                />
                            </div>
                            <button disabled={saving} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4">
                                {saving ? <Loader2 className="animate-spin" /> : <Check size={18} />} Save Vehicle
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
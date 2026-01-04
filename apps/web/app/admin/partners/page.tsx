"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import {
  Search,
  CheckCircle,
  AlertCircle,
  Building2,
  Car,
  MoreHorizontal,
  Loader2,
  Briefcase,
  Phone,
  MapPin,
  Filter,
  X
} from "lucide-react";

// Mock Data Helpers
const CITIES = ["Mathura", "Vrindavan", "Govardhan", "Gokul", "Barsana"];
const getRandomCity = () => CITIES[Math.floor(Math.random() * CITIES.length)];

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiRequest("/api/admin/users?role=partner", "GET");

        // Enhance data
        const enhancedData = data.users.map((u: any) => ({
          ...u,
          businessName: u.displayName ? `${u.displayName}'s Ventures` : "New Enterprise",
          activeListings: u.hasProperty ? 1 : Math.floor(Math.random() * 5),
          phone: u.phone || "+91 98765 00000",
          isLicenseVerified: u.isVerified || false,
          city: u.city || getRandomCity(),
        }));

        setPartners(enhancedData);
      } catch (err) {
        console.error("Partners Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTERING LOGIC ---
  const filtered = partners.filter((p) => {
    const matchesSearch =
      p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.businessName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = cityFilter === "All" || p.city === cityFilter;

    const matchesStatus = statusFilter === "All"
      ? true
      : statusFilter === "Verified"
        ? p.isLicenseVerified
        : !p.isLicenseVerified;

    return matchesSearch && matchesCity && matchesStatus;
  });

  const totalListings = filtered.reduce((acc, curr) => acc + (curr.activeListings || 0), 0);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partner Network</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage business partners and verify their documents.
            </p>
          </div>

          <div className="flex gap-3 text-xs font-medium">
            <div className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
              Partners: <span className="font-bold">{filtered.length}</span>
            </div>
            <div className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
              Total Listings: <span className="font-bold">{totalListings}</span>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              placeholder="Search by name, email, or business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white transition-all"
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-1 md:pb-0">
            <div className="relative min-w-[140px]">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium cursor-pointer"
              >
                <option value="All">All Areas</option>
                {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="relative min-w-[140px]">
              <Filter className="absolute left-3 top-3 text-gray-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Verified">Verified Only</option>
                <option value="Pending">Pending Docs</option>
              </select>
            </div>

            {(cityFilter !== "All" || statusFilter !== "All" || searchTerm) && (
              <button
                onClick={() => { setCityFilter("All"); setStatusFilter("All"); setSearchTerm(""); }}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Partner Business</th>
                <th className="px-6 py-4">Area / City</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Inventory</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((partner) => (
                <tr key={partner.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {partner.businessName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {partner.displayName || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <MapPin size={12} /> {partner.city}
                    </span>
                  </td>

                  {/* STATUS BADGE - REFINED */}
                  <td className="px-6 py-4">
                    <Link href={`/admin/partners/${partner.uid}`} className="inline-block">
                      {partner.isLicenseVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-900/30">
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                          <AlertCircle size={12} /> Verify Now
                        </span>
                      )}
                    </Link>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className={`flex items-center gap-1.5 ${partner.hasProperty ? 'text-gray-900 dark:text-white font-medium' : 'opacity-50'}`}>
                        <Building2 size={16} /> {partner.activeListings}
                      </div>
                      <div className={`flex items-center gap-1.5 ${partner.hasVehicle ? 'text-gray-900 dark:text-white font-medium' : 'opacity-50'}`}>
                        <Car size={16} /> {partner.hasVehicle ? 1 : 0}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <a href={`mailto:${partner.email}`} className="text-xs text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors truncate max-w-[150px]">
                        {partner.email}
                      </a>
                      <span className="text-xs font-mono text-gray-400">{partner.phone}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/partners/${partner.uid}`} className="p-2 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all inline-block">
                      <MoreHorizontal size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE CARD VIEW --- */}
        <div className="md:hidden grid gap-4">
          {filtered.map((partner) => (
            <div key={partner.uid} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {partner.businessName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{partner.displayName}</span>
                    </div>
                  </div>
                </div>
                <Link href={`/admin/partners/${partner.uid}`} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <MoreHorizontal size={20} />
                </Link>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">

                {/* Clickable Status */}
                <Link href={`/admin/partners/${partner.uid}`}>
                  {partner.isLicenseVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2.5 py-1.5 rounded-lg">
                      <CheckCircle size={12} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900">
                      <AlertCircle size={12} /> Tap to Verify
                    </span>
                  )}
                </Link>

                <div className="flex gap-3">
                  <a href={`tel:${partner.phone}`} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500">
                    <Phone size={18} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
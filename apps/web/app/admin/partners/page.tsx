"use client";

import { useEffect, useState } from "react";
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
  Mail,
} from "lucide-react";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ FIX: Request 'partner' role.
        // The backend now intelligently returns Admins if they own properties.
        const data = await apiRequest("/api/admin/users?role=partner", "GET");

        // Enhance with Mock Data (Business logic we don't store yet)
        const enhancedData = data.users.map((u: any) => ({
          ...u,
          // If no business name, make one up from their name
          businessName: u.displayName
            ? `${u.displayName}'s Ventures`
            : "New Enterprise",
          // If they are on this list, they have at least 1 listing (or we mock it)
          activeListings: u.hasProperty ? 1 : Math.floor(Math.random() * 5) + 1,
          phone: u.phone || "+91 98765 00000",
          isLicenseVerified: u.role === "admin" ? true : Math.random() > 0.3, // Admins auto-verified for demo
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

  const filtered = partners.filter(
    (p) =>
      p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Partner Management</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          Manage business partners (including Admins with properties).
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        <input
          placeholder="Search partners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black shadow-sm"
        />
      </div>

      {/* --- DESKTOP TABLE --- */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Partner Business</th>
              <th className="px-6 py-4">Document Status</th>
              <th className="px-6 py-4">Active Listings</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((partner) => (
              <tr
                key={partner.uid}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {partner.businessName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Owner: {partner.displayName || "Unknown"}
                        {partner.role === "admin" && (
                          <span className="ml-2 text-[10px] bg-black text-white px-1 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {partner.isLicenseVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                      <CheckCircle size={12} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                      <AlertCircle size={12} /> Docs Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1" title="Properties">
                      <Building2 size={14} />{" "}
                      {partner.hasProperty ? partner.activeListings : 0}
                    </div>
                    <div className="flex items-center gap-1" title="Vehicles">
                      <Car size={14} /> {partner.hasVehicle ? 1 : 0}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{partner.email}</div>
                  <div className="font-mono text-xs mt-0.5">
                    {partner.phone}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-black">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No partners found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="md:hidden grid gap-4">
        {filtered.map((partner) => (
          <div
            key={partner.uid}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {partner.businessName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {partner.displayName}
                    {partner.role === "admin" && (
                      <span className="ml-1 text-[10px] bg-black text-white px-1 rounded">
                        ADMIN
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button className="text-gray-400">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                <div className="text-xs text-gray-500 font-bold flex items-center gap-1">
                  <Building2 size={12} /> Properties
                </div>
                <span className="font-bold">
                  {partner.hasProperty ? partner.activeListings : 0}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                <div className="text-xs text-gray-500 font-bold flex items-center gap-1">
                  <Car size={12} /> Vehicles
                </div>
                <span className="font-bold">{partner.hasVehicle ? 1 : 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {partner.isLicenseVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle size={10} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  <AlertCircle size={10} /> Pending
                </span>
              )}

              <div className="flex gap-3">
                <button className="text-gray-400 hover:text-blue-600">
                  <Phone size={16} />
                </button>
                <button className="text-gray-400 hover:text-blue-600">
                  <Mail size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

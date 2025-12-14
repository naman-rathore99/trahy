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
} from "lucide-react";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiRequest("/api/admin/users", "GET");
        // Filter: ONLY Partners
        const partnerList = data.users.filter((u: any) => u.role === "partner");

        // Mock Business Data
        const enhancedData = partnerList.map((u: any) => ({
          ...u,
          businessName: u.name + " Enterprises", // Mock business name
          activeListings: Math.floor(Math.random() * 5),
          phone: u.phone || "+91 98765 00000",
        }));
        setPartners(enhancedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = partners.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Partner Management</h1>
        <p className="text-gray-500">
          Manage business partners, verify documents, and track listings.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        <input
          placeholder="Search partners by name or business..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              <tr key={partner.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {partner.businessName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Owner: {partner.name}
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
                    <div className="flex items-center gap-1">
                      <Building2 size={14} /> {partner.activeListings}
                    </div>
                    <div className="flex items-center gap-1">
                      <Car size={14} /> 0
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

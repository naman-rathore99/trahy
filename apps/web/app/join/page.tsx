"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import {
  Hotel,
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  CheckCircle,
  ShieldCheck,
  Building2 // Added icon for Hotel Name
} from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    hotelName: "", // Added Hotel Name
    email: "",
    phone: "",
    serviceType: "Hotel", // Default hidden value
    officialIdUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.officialIdUrl)
      return alert("Please upload an Official ID proof.");

    setLoading(true);
    try {
      // ✅ FIX: Send to the PUBLIC API (which creates the request)
      await apiRequest("/api/public/join-request", "POST", formData);
      alert("Application Sent! We will review your ID and email you shortly.");
      router.push("/login");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-black transition-colors duration-300">

      {/* --- LEFT PANEL (Branding) --- */}
      <div className="relative bg-black text-white p-10 lg:p-20 flex flex-col justify-between overflow-hidden">

        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>

        {/* Top Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity mb-12">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center mb-8">
            <Hotel size={32} className="text-white" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Partner with <br />
            <span className="text-rose-500">Shubhyatra</span>
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed max-w-md">
            Join the fastest-growing hospitality network in Mathura & Vrindavan. List your property, manage bookings, and grow your business with us.
          </p>
        </div>

        {/* Bottom Stats / Footer */}
        <div className="relative z-10 mt-12 pt-12 border-t border-white/10">
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-gray-500">Active Partners</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-gray-500">Support Team</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL (Form) --- */}
      <div className="flex items-center justify-center p-6 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Partner Account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your property details to apply.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Inputs */}
            <div className="space-y-5">

              {/* Hotel Name (New Field) */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Hotel / Business Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors" size={18} />
                  <input
                    required
                    className="w-full pl-11 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-600 dark:text-white font-medium transition-all"
                    placeholder="Grand Plaza Mathura"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  />
                </div>
              </div>

              {/* Full Name (Owner Name) */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Owner Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors" size={18} />
                  <input
                    required
                    className="w-full pl-11 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-600 dark:text-white font-medium transition-all"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors" size={18} />
                  <input
                    required
                    type="email"
                    className="w-full pl-11 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-600 dark:text-white font-medium transition-all"
                    placeholder="partner@business.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-rose-600 transition-colors" size={18} />
                  <input
                    required
                    className="w-full pl-11 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-600 dark:text-white font-medium transition-all"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* ID Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-rose-600" /> Official Verification ID
                </label>
                <div className="h-32 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden hover:border-rose-500 dark:hover:border-rose-500 transition-colors relative">
                  <ImageUpload
                    onUpload={(url) => setFormData({ ...formData, officialIdUrl: url })}
                    currentUrl={formData.officialIdUrl}
                  />
                  {!formData.officialIdUrl && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400 text-sm">
                      <span>Click to upload Aadhar/PAN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {loading ? "Submitting Request..." : "Submit Application"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already registered?{" "}
              <Link href="/login" className="text-rose-600 font-bold hover:underline">
                Login to Dashboard
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
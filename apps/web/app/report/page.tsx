"use client";

import React, { useState } from "react";
import { AlertTriangle, Send, Loader2 } from "lucide-react";

export default function ReportPage() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      alert("Report submitted successfully. We will contact you shortly.");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white py-16 px-6">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6 text-red-600">
          <div className="p-3 bg-red-50 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Report a Concern
          </h1>
        </div>

        <p className="text-gray-500 mb-8">
          We take safety and fraud seriously. Please describe your issue, and
          our Safety Team will review it immediately.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">
              What is this about?
            </label>
            <select className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-red-500/20">
              <option>Safety Issue (Urgent)</option>
              <option>Fraudulent Listing</option>
              <option>Rude Behavior / Harassment</option>
              <option>Payment Issue</option>
              <option>Bug / Technical Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Booking ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. #BK-12345"
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea
              rows={5}
              placeholder="Please provide as much detail as possible..."
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-red-500/20"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}

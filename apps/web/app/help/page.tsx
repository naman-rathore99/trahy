"use client";

import React from "react";
import {
  Search,
  HelpCircle,
  User,
  CreditCard,
  Calendar,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white pb-20">
      {/* HERO / SEARCH */}
      <section className="bg-indigo-600 dark:bg-indigo-900 py-20 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
          How can we help you?
        </h1>
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search for answers (e.g. 'refund status', 'partner login')..."
            className="w-full pl-12 pr-6 py-4 rounded-full shadow-xl text-gray-900 focus:ring-4 focus:ring-indigo-400 outline-none"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-6 -mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <HelpCard
            icon={Calendar}
            title="Bookings & Trips"
            desc="Managing reservations, changes, and check-ins."
          />
          <HelpCard
            icon={CreditCard}
            title="Payments & Refunds"
            desc="Understand pricing, fees, and refund timelines."
          />
          <HelpCard
            icon={User}
            title="Account & Profile"
            desc="Login issues, password reset, and settings."
          />
          <HelpCard
            icon={ShieldCheck}
            title="Safety & Trust"
            desc="Verified partners, SOS, and community guidelines."
          />
          <HelpCard
            icon={HelpCircle}
            title="For Partners"
            desc="Listing properties, 85/15 payouts, and dashboard help."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 py-20 max-w-3xl">
        <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <FaqItem
            q="How do I cancel my booking?"
            a="Go to 'My Trips', select the booking, and click 'Cancel'. Refunds are processed based on the policy chosen by the host."
          />
          <FaqItem
            q="When will I get my refund?"
            a="Refunds are initiated immediately but may take 5-7 business days to reflect in your bank account."
          />
          <FaqItem
            q="How does the Partner Payout work?"
            a="Shubhyatra takes a flat 15% platform fee. Partners keep 85% of every booking. Payouts are processed weekly."
          />
        </div>
      </section>
    </div>
  );
}

function HelpCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 cursor-pointer group">
      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: any) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
      <h4 className="font-bold text-lg mb-2">{q}</h4>
      <p className="text-gray-500 dark:text-gray-400">{a}</p>
    </div>
  );
}

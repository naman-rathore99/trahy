"use client";

import React from "react";
import { Shield, Lock, Phone, CheckCircle } from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-bold mb-4">
            <Shield size={14} /> Shubhyatra Safety Promise
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Your safety is our priority.
          </h1>
          <p className="text-xl text-gray-500">
            We work 24/7 to ensure every journey is secure, verified, and
            reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Section 1 */}
          <div className="space-y-6">
            <SafetyItem
              icon={CheckCircle}
              title="Verified Partners Only"
              desc="Every hotel and vehicle owner on Shubhyatra undergoes a strict KYC verification process before going live."
            />
            <SafetyItem
              icon={Lock}
              title="Secure Payments"
              desc="We use bank-grade encryption. Your money is held safely until your check-in is confirmed."
            />
            <SafetyItem
              icon={Phone}
              title="24/7 SOS Support"
              desc="Our emergency response team is just one tap away in the app for any urgent situations."
            />
          </div>

          {/* Section 2 (Visual/Card) */}
          <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold mb-4">Emergency Contacts</h3>
            <p className="text-gray-500 mb-6">
              Save these numbers for immediate assistance during your trip.
            </p>

            <div className="space-y-4">
              <ContactRow label="Police Control Room" number="100" />
              <ContactRow label="Ambulance" number="102" />
              <ContactRow label="Women Helpline" number="1091" />
              <ContactRow
                label="Shubhyatra Safety Team"
                number="+91-1800-SHUBH-SOS"
                highlight
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SafetyItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 shrink-0">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ContactRow({ label, number, highlight }: any) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-xl ${highlight ? "bg-red-50 dark:bg-red-900/20 text-red-700" : "bg-white dark:bg-gray-800"}`}
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold font-mono">{number}</span>
    </div>
  );
}

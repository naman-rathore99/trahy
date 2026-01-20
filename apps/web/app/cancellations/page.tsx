"use client";

import React from "react";
import { Clock, AlertCircle, Check } from "lucide-react";

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Cancellation Policies
        </h1>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          We believe in flexibility. Hosts can choose one of these three
          policies. Check your booking details to see which one applies to you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FLEXIBLE */}
          <PolicyCard
            title="Flexible"
            color="green"
            refund="Full refund 24 hours prior"
            desc="Cancel at least 24 hours before check-in for a full refund."
          />

          {/* MODERATE */}
          <PolicyCard
            title="Moderate"
            color="yellow"
            refund="Full refund 5 days prior"
            desc="Cancel 5 days before check-in for a full refund. 50% refund after that."
          />

          {/* STRICT */}
          <PolicyCard
            title="Strict"
            color="red"
            refund="No refund after 48h"
            desc="Full refund only if cancelled within 48 hours of booking. No refund afterwards."
          />
        </div>

        <div className="mt-16 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex gap-4 items-start">
            <AlertCircle className="text-blue-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2">
                How to Request a Cancellation
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-500">
                <li>
                  Go to your <strong>My Trips</strong> page.
                </li>
                <li>Select the active booking you wish to cancel.</li>
                <li>
                  Click <strong>Cancel Booking</strong> and state your reason.
                </li>
                <li>
                  The refund amount will be calculated automatically based on
                  the policy above.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ title, color, refund, desc }: any) {
  const colors: any = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      className={`p-6 rounded-2xl border-2 ${colors[color]} bg-white dark:bg-gray-800 dark:border-gray-700`}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="flex items-center gap-2 mb-4 font-bold text-sm">
        <Clock size={16} /> {refund}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

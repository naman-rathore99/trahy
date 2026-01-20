"use client";

import React from "react";
import {
  MapPin,
  Users,
  TrendingUp,
  ShieldCheck,
  Heart,
  Globe,
  ArrowRight,
  Building2,
  Car,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-rose-100 dark:selection:bg-rose-900">
      {/* 1. HERO SECTION */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50 via-white to-white dark:from-gray-900 dark:via-black dark:to-black -z-10"></div>

        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-sm font-bold mb-6 animate-in fade-in slide-in-from-bottom-4">
            <Globe size={14} /> Revolutionizing Travel
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-400 dark:to-white">
            We Are <span className="text-rose-600">Shubh yatra.</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
            More than just a booking platform. We are building a fair ecosystem
            where travelers get the best stays and rides, and partners keep what
            they truly earn.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/search"
              className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              Start Exploring <ArrowRight size={18} />
            </Link>
            <Link
              href="/join"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              Join as Partner
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE MISSION (Grid) */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Building2}
              title="Hotels & Stays"
              desc="From luxury suites to cozy homestays, we connect travelers with the best accommodations across the country."
              color="indigo"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Fair Partnership"
              desc="We believe in fairness. Our partners keep 80% of every booking, ensuring sustainable growth for their business."
              color="emerald"
            />
            <FeatureCard
              icon={Car}
              title="Seamless Mobility"
              desc="Not just stays. We integrate verified vehicle rentals to make sure your journey is smooth from start to finish."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* 3. OUR STORY / SPLIT LOGIC */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Content */}
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Why we built Trahy? <br />
                <span className="text-gray-400">To fix a broken system.</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Traditional platforms take massive commissions, leaving hotel
                owners and drivers with thin margins. We wanted to change that.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0 text-rose-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      The 85 / 15 Promise
                    </h3>
                    <p className="text-gray-500">
                      We take a flat 15% to run the platform. Partners take home
                      85%. No hidden fees, no surprises.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Community First</h3>
                    <p className="text-gray-500">
                      We verify every hotel and vehicle personally to ensure
                      safety for travelers and quality for partners.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual (Abstract Stats) */}
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-orange-500 rounded-3xl blur-3xl opacity-20 dark:opacity-40 -z-10"></div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 rounded-3xl shadow-2xl">
                <div className="grid grid-cols-2 gap-8 text-center">
                  <div>
                    <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                      1k+
                    </div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      Happy Travelers
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-extrabold text-rose-600 mb-2">
                      10+
                    </div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      Hotel Partners
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-extrabold text-blue-600 mb-2">
                      10 +
                    </div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      Vehicles
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-extrabold text-emerald-500 mb-2">
                      ₹2L
                    </div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      Revenue Generated
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TEAM / QUOTE */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <div className="mb-6 text-rose-500">
            <Heart size={40} className="mx-auto" fill="currentColor" />
          </div>
          <h3 className="text-3xl md:text-4xl font-serif italic leading-relaxed mb-8">
            "We aim to make travel seamless for the guest, and profitable for
            the host. When our partners grow, we grow."
          </h3>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden">
              {/* Placeholder for Founder Image */}
              <div className="w-full h-full flex items-center justify-center text-xl">
                👨‍💻
              </div>
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">Founder Name</div>
              <div className="text-gray-400 text-sm">CEO, Trahy</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-24 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to start your journey?
          </h2>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto">
            Whether you want to explore the world or build a business, Trahy is
            your platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/partner/signup"
              className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
            >
              Join as Partner
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20",
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors[color]} group-hover:scale-110 transition-transform`}
      >
        <Icon size={28} />
      </div>
      <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

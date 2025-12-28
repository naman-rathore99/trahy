"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { MapPinOff, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      {/* 1. Navbar allows them to navigate elsewhere easily */}
      <Navbar variant="default" />

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20">
        {/* 2. Visual Icon */}
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
          <MapPinOff size={48} strokeWidth={1.5} />
        </div>

        {/* 3. Text Message */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Lost in Mathura?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10 text-lg">
          We couldn't find the page you were looking for. It might have been
          moved or deleted.
        </p>

        {/* 4. Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold hover:opacity-80 transition-all"
          >
            <Home size={18} /> Go Home
          </Link>

          <Link
            href="/packages"
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 py-3.5 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <Search size={18} /> Browse Packages
          </Link>
        </div>
      </div>

      {/* 5. Footer Decoration (Optional) */}
      <div className="py-6 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} Shubh Yatra
      </div>
    </main>
  );
}

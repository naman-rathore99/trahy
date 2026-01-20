"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Don't render footer on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* TOP SECTION: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* 1. BRAND & DESCRIPTION */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              shubyatra.world
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover spiritual stays, curate your perfect pilgrimage, and
              travel with peace of mind. Your journey to Mathura & Vrindavan
              starts here.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* 2. COMPANY LINKS */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="/about"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors block w-fit"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/join"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors block w-fit"
                >
                  Become a Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. SUPPORT LINKS */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="/help"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors block w-fit"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors block w-fit"
                >
                  Safety Information
                </Link>
              </li>
              <li>
                <Link
                  href="/cancellations"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors block w-fit"
                >
                  Cancellation Options
                </Link>
              </li>
              <li>
                <Link
                  href="/report"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors block w-fit"
                >
                  Report a Concern
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. CONTACT INFO */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>Mathura, Uttar Pradesh, India - 281001</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0" />
                <a
                  href="mailto:support@shubyatra.world"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  support@shubyatra.world
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0" />
                <a
                  href="tel:+9870897086"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  +91 9870897086
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION: Copyright & Legal */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Shubyatra. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/privacy"
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/sitemap"
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Sitemap
              </Link>
              <button className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                <Globe size={16} />
                <span>English (IN)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

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

  // If URL starts with "/admin", don't render anything
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-gray-50 dark:bg-slate-950 pt-16 pb-8 border-t border-gray-200 dark:border-slate-800">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {/* TOP SECTION: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* 1. BRAND & DESCRIPTION */}
          <div className="space-y-6">
            <Link
              href="/"
              className="text-2xl font-bold tracking-wide uppercase text-gray-900 dark:text-white"
            >
              shubyatra
              <span className="text-indigo-500">.</span>
              world
            </Link>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
              Discover spiritual stays, curate your perfect pilgrimage, and
              travel with peace of mind. Your journey to Mathura & Vrindavan
              starts here.
            </p>
            <div className="flex items-center gap-4">
              <SocialIcon icon={<Facebook size={18} />} href="#" />
              <SocialIcon icon={<Instagram size={18} />} href="#" />
              <SocialIcon icon={<Twitter size={18} />} href="#" />
              <SocialIcon icon={<Linkedin size={18} />} href="#" />
            </div>
          </div>

          {/* 2. COMPANY LINKS */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6">
              Company
            </h3>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li>
                ``
                <FooterLink href="/about">About Us</FooterLink>
              </li>
              <li>
                <FooterLink href="/join">Become a Partner</FooterLink>
              </li>
              {/* <li><FooterLink href="/careers">Careers</FooterLink></li> */}
              <li>
                <FooterLink href="/blog">Travel Blog</FooterLink>
              </li>
            </ul>
          </div>

          {/* 3. SUPPORT LINKS */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6">
              Support
            </h3>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <FooterLink href="/help">Help Center</FooterLink>
              </li>
              <li>
                <FooterLink href="/safety">Safety Information</FooterLink>
              </li>
              <li>
                <FooterLink href="/cancellation">
                  Cancellation Options
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/report">Report a Concern</FooterLink>
              </li>
            </ul>
          </div>

          {/* 4. CONTACT INFO */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6">
              Contact
            </h3>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 text-rose-600" />
                <span>Mathura, Uttar Pradesh, India - 281001</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-rose-600" />
                <a
                  href="mailto:support@shubyatra.world"
                  className="hover:text-rose-600 transition-colors"
                >
                  support@shubyatra.world
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-rose-600" />
                <a
                  href="tel:+919876543210"
                  className="hover:text-rose-600 transition-colors"
                >
                  +91 98765 43210
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION: Copyright & Legal */}
        <div className="border-t border-gray-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} Shubyatra. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/privacy"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/sitemap"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sitemap
            </Link>
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span>English (IN)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
function SocialIcon({ icon, href }: { icon: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-500 hover:border-rose-200 transition-all duration-200"
    >
      {icon}
    </Link>
  );
}
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors block w-fit"
    >
      {children}
    </Link>
  );
}

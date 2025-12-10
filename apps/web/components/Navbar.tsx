"use client";

import React, { useState, useEffect } from "react";
import { Globe, Phone, Menu, X } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  variant?: "transparent" | "dark";
}

const Navbar = ({ variant = "transparent" }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDarkState = isScrolled || variant === "dark";

  const navBackground = isDarkState
    ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
    : "bg-transparent py-6";

  const textColor =
    isDarkState || isMobileMenuOpen ? "text-gray-900" : "text-white";
  const buttonBorder = isDarkState ? "border-gray-200" : "border-white/30";
  const buttonSolid = isDarkState
    ? "bg-black text-white"
    : "bg-white text-black";

  return (
    <>
      <nav
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${navBackground}`}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* LOGO */}
          <Link
            href="/"
            className={`text-2xl font-bold tracking-wide uppercase z-50 relative ${textColor}`}
          >
           Trav & Stay
          </Link>

          {/* DESKTOP MENU */}
          <ul
            className={`hidden md:flex items-center gap-8 text-sm font-medium ${textColor}`}
          >
            <li className="flex flex-col items-center gap-1 cursor-pointer group">
              <Link href="/">Home</Link>
              <span
                className={`w-1.5 h-1.5 rounded-full opacity-100 transition-opacity ${
                  isDarkState ? "bg-black" : "bg-white"
                }`}
              ></span>
            </li>
            <li className="opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
              Book now
            </li>
            <li className="opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
              Packages
            </li>
            <li className="opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
              Popular places
            </li>
          </ul>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center gap-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full hover:bg-opacity-10 transition-colors ${buttonBorder} ${textColor}`}
            >
              <Globe size={16} />
              <span>EN</span>
            </button>
            <button
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-colors hover:scale-105 active:scale-95 ${buttonSolid}`}
            >
              <Phone size={16} />
              <span>Contact</span>
            </button>
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            className={`md:hidden z-50 relative p-2 ${textColor}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE FULLSCREEN MENU OVERLAY */}
      <div
        className={`fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <ul className="flex flex-col items-center gap-8 text-xl font-bold text-gray-900">
          <li onClick={() => setIsMobileMenuOpen(false)}>
            <Link href="/">Home</Link>
          </li>
          <li onClick={() => setIsMobileMenuOpen(false)}>Book now</li>
          <li onClick={() => setIsMobileMenuOpen(false)}>Packages</li>
          <li onClick={() => setIsMobileMenuOpen(false)}>Popular places</li>
        </ul>

        <div className="flex flex-col gap-4 mt-8 w-64">
          <button className="flex items-center justify-center gap-2 px-6 py-4 text-base font-bold border border-gray-200 rounded-full w-full">
            <Globe size={20} /> EN
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-4 text-base font-bold bg-black text-white rounded-full w-full">
            <Phone size={20} /> Contact Us
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Globe,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Map,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface NavbarProps {
  variant?: "transparent" | "dark";
}

export default function Navbar({ variant = "transparent" }: NavbarProps) {
  // UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // 'admin' | 'user' | null
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const auth = getAuth(app);

  // 1. Detect Login & Fetch Role from Backend
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        try {
          // Fetch the role to decide what menu items to show
          const data = await apiRequest("/api/user/me", "GET");
          if (data?.user?.role) {
            setUserRole(data.user.role);
          }
        } catch (err) {
          console.error("Failed to fetch user role", err);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // 2. Handle Scroll Effect (Transparent to White)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Handle Click Outside (Close Dropdown)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 4. Logout Logic
  const handleLogout = async () => {
    await signOut(auth);
    setUserRole(null);
    router.push("/login");
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  // 5. Dynamic Styles
  const isDarkState = isScrolled || variant === "dark";
  const navBackground = isDarkState
    ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-4"
    : "bg-transparent py-6";
  const textColor =
    isDarkState || isMobileMenuOpen
      ? "text-gray-900 dark:text-white"
      : "text-white";
  const buttonBorder = isDarkState
    ? "border-gray-200 dark:border-slate-700"
    : "border-white/30";
  const buttonSolid = isDarkState
    ? "bg-black text-white"
    : "bg-white text-black";

  return (
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

        {/* --- DESKTOP MENU --- */}
        <ul
          className={`hidden md:flex items-center gap-8 text-sm font-medium ${textColor}`}
        >
          <li>
            <Link href="/" className="hover:opacity-70 transition-opacity">
              Home
            </Link>
          </li>
          <li className="hover:opacity-70 cursor-pointer">Packages</li>
          <li className="hover:opacity-70 cursor-pointer">Destinations</li>

          {/* Only show "Join" if NOT logged in */}
          {!firebaseUser && (
            <li>
              <Link
                href="/join"
                className="hover:opacity-70 transition-opacity"
              >
                Become a Partner
              </Link>
            </li>
          )}
        </ul>

        {/* --- DESKTOP ACTIONS --- */}
        <div className="hidden md:flex items-center gap-4">
          <button
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full hover:bg-black/5 transition-colors ${buttonBorder} ${textColor}`}
          >
            <Globe size={16} /> <span>EN</span>
          </button>

          {!loading && (
            <>
              {/* IF LOGGED OUT: Show Login Button */}
              {!firebaseUser ? (
                <Link
                  href="/login"
                  className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-full transition-transform hover:scale-105 active:scale-95 ${buttonSolid}`}
                >
                  <UserIcon size={18} />
                  <span>Login</span>
                </Link>
              ) : (
                /* IF LOGGED IN: Show User Dropdown */
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-full hover:bg-black/5 transition-colors ${buttonBorder} ${textColor}`}
                  >
                    {firebaseUser.photoURL ? (
                      <img
                        src={firebaseUser.photoURL}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <UserIcon size={14} />
                      </div>
                    )}
                    <span className="hidden lg:inline-block max-w-[100px] truncate">
                      {firebaseUser.displayName || "User"}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-xl shadow-xl bg-white ring-1 ring-black/5 py-2 z-50 overflow-hidden text-gray-900">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-bold truncate">
                          {firebaseUser.displayName || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {firebaseUser.email}
                        </p>
                        <span
                          className={`inline-block mt-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${userRole === "admin" ? "bg-black text-white" : "bg-blue-100 text-blue-700"}`}
                        >
                          {userRole === "admin"
                            ? "Partner Account"
                            : "Traveler"}
                        </span>
                      </div>

                      {/* Links */}
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <UserIcon size={16} className="text-gray-500" /> My
                          Profile
                        </Link>

                        {/* ADMIN / OWNER LINKS */}
                        {userRole === "admin" && (
                          <>
                            <Link
                              href="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            >
                              <LayoutDashboard
                                size={16}
                                className="text-gray-500"
                              />{" "}
                              Owner Dashboard
                            </Link>
                            <Link
                              href="/admin/requests"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            >
                              <ShieldCheck
                                size={16}
                                className="text-gray-500"
                              />{" "}
                              Join Requests
                            </Link>
                          </>
                        )}

                        {/* CUSTOMER LINKS */}
                        {userRole !== "admin" && (
                          <Link
                            href="/bookings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          >
                            <CreditCard size={16} className="text-gray-500" />{" "}
                            My Bookings
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} /> Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* --- MOBILE TOGGLE BUTTON --- */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className={`p-2 ${textColor}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* --- MOBILE MENU OVERLAY --- */}
      <div
        className={`fixed inset-0 bg-white z-40 flex flex-col pt-24 px-6 gap-6 transition-transform duration-300 md:hidden ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <ul className="flex flex-col gap-6 text-xl font-bold text-gray-900">
          <li onClick={() => setIsMobileMenuOpen(false)}>
            <Link href="/">Home</Link>
          </li>

          {/* Mobile Links based on Role */}
          {userRole === "admin" && (
            <li onClick={() => setIsMobileMenuOpen(false)}>
              <Link href="/admin" className="text-blue-600">
                Owner Dashboard
              </Link>
            </li>
          )}
          {userRole !== "admin" && (
            <li onClick={() => setIsMobileMenuOpen(false)}>
              <Link href="/packages">Packages</Link>
            </li>
          )}

          <li onClick={() => setIsMobileMenuOpen(false)}>
            <Link href="/join">Join as Partner</Link>
          </li>
        </ul>

        <div className="mt-auto mb-10 w-full flex flex-col gap-4">
          {!firebaseUser ? (
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-black text-white py-4 rounded-full font-bold text-center text-lg"
            >
              Login / Sign Up
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <UserIcon size={20} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 truncate">
                    {firebaseUser.displayName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {firebaseUser.email}
                  </p>
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full border border-gray-200 py-3 rounded-lg text-center font-semibold"
              >
                My Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-semibold"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

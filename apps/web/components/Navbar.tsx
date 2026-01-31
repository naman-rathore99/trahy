"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Globe,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Briefcase,
  Hotel,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  IdTokenResult,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface NavbarProps {
  variant?: "transparent" | "default";
}

export default function Navbar({ variant = "transparent" }: NavbarProps) {
  // UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const auth = getAuth(app);

  // 1. Detect Login & Fetch Role from Token directly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          const token: IdTokenResult = await currentUser.getIdTokenResult();
          const role = (token.claims.role as string) || "user";
          setUserRole(role);
        } catch (err) {
          console.error("Failed to fetch user role", err);
          setUserRole("user");
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // 2. Scroll Logic
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Click Outside Profile
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

  const handleLogout = async () => {
    await signOut(auth);
    setUserRole(null);
    router.push("/login");
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  // --- STYLE LOGIC ---
  const isSolidState = isScrolled || isMobileMenuOpen || variant === "default";
  const navBackground = isSolidState
    ? "bg-white dark:bg-slate-900 shadow-sm py-4"
    : "bg-transparent py-6";
  const textColor = isSolidState
    ? "text-gray-900 dark:text-white"
    : "text-white";
  const buttonBorder = isSolidState
    ? "border-gray-200 dark:border-slate-700"
    : "border-white/30";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${navBackground}`}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* LOGO */}
          <Link
            href="/"
            className={`text-2xl font-bold tracking-wide uppercase relative z-[60] ${textColor}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            shubyatra
            <span className="text-xl font-bold text-indigo-500">.</span>world
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
            <li>
              <Link
                href="/vehicles"
                className="hover:opacity-70 transition-opacity flex items-center gap-1"
              >
                Vehicles
              </Link>
            </li>

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
            {/* 🔴 TEMPORARY FIX BUTTON: Force Logout 🔴 */}
            <button
              onClick={() => {
                const auth = getAuth(app);
                signOut(auth).then(() => window.location.reload());
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg animate-pulse border-2 border-white"
            >
              FORCE LOGOUT
            </button>
            {/* --------------------------------------- */}

            <button
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full transition-colors ${textColor} ${buttonBorder} hover:bg-black/5 dark:hover:bg-white/10`}
            >
              <Globe size={16} /> <span>EN</span>
            </button>

            {!loading && (
              <>
                {!firebaseUser ? (
                  <Link
                    href="/login"
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-full transition-transform hover:scale-105 active:scale-95 ${
                      isSolidState
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    <UserIcon size={18} /> <span>Login</span>
                  </Link>
                ) : (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-full transition-colors ${textColor} ${buttonBorder} hover:bg-black/5 dark:hover:bg-white/10`}
                    >
                      {firebaseUser.photoURL ? (
                        <img
                          src={firebaseUser.photoURL}
                          alt="Avatar"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${isSolidState ? "bg-gray-200 text-gray-500" : "bg-white/20 text-white"}`}
                        >
                          <UserIcon size={14} />
                        </div>
                      )}
                      <span className="hidden lg:inline-block max-w-[100px] truncate">
                        {firebaseUser.displayName || "User"}
                      </span>
                    </button>

                    {/* DYNAMIC DROPDOWN */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-64 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 py-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-t-xl">
                          <p className="text-sm font-bold truncate text-gray-900 dark:text-white">
                            {firebaseUser.displayName || "My Account"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {firebaseUser.email}
                          </p>
                          <p className="text-[10px] uppercase font-bold text-rose-600 mt-1">
                            {userRole === "partner"
                              ? "Partner Account"
                              : userRole === "admin"
                                ? "Administrator"
                                : "Traveler"}
                          </p>
                        </div>

                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <UserIcon size={16} /> My Profile
                          </Link>

                          {userRole === "partner" && (
                            <Link
                              href="/partner/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Hotel size={16} className="text-rose-600" />{" "}
                              Partner Dashboard
                            </Link>
                          )}

                          {userRole === "admin" && (
                            <Link
                              href="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ShieldCheck
                                size={16}
                                className="text-blue-600"
                              />{" "}
                              Admin Panel
                            </Link>
                          )}

                          <Link
                            href="/trips"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Briefcase size={16} /> My Trips
                          </Link>

                          <Link
                            href="/transactions"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Receipt size={16} /> Transactions
                          </Link>
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-800 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-b-xl transition-colors"
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
          <div className="md:hidden flex items-center gap-2 relative z-[60]">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-full transition-all duration-200 shadow-sm ${
                isMobileMenuOpen
                  ? "bg-gray-100 text-black"
                  : isSolidState
                    ? "bg-transparent text-black dark:text-white"
                    : "bg-white text-black"
              }`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- MOBILE MENU OVERLAY --- */}
      <div
        className={`fixed inset-0 bg-white dark:bg-slate-950 z-[50] flex flex-col pt-28 px-6 gap-6 transition-transform duration-300 md:hidden ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <ul className="flex flex-col gap-6 text-xl font-bold text-gray-900 dark:text-white">
          <li onClick={() => setIsMobileMenuOpen(false)}>
            <Link href="/">Home</Link>
          </li>
          <li onClick={() => setIsMobileMenuOpen(false)}>
            <Link href="/vehicles">Vehicles</Link>
          </li>

          {userRole === "partner" && (
            <li onClick={() => setIsMobileMenuOpen(false)}>
              <Link
                href="/partner/dashboard"
                className="flex items-center gap-2 text-rose-600"
              >
                <Hotel size={20} /> Partner Dashboard
              </Link>
            </li>
          )}
          {userRole === "admin" && (
            <li onClick={() => setIsMobileMenuOpen(false)}>
              <Link
                href="/admin"
                className="flex items-center gap-2 text-blue-600"
              >
                <ShieldCheck size={20} /> Admin Panel
              </Link>
            </li>
          )}

          {firebaseUser && (
            <>
              <li onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/trips" className="flex items-center gap-2">
                  My Trips
                </Link>
              </li>
              <li onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/transactions" className="flex items-center gap-2">
                  Transactions
                </Link>
              </li>
            </>
          )}

          {!firebaseUser && (
            <li onClick={() => setIsMobileMenuOpen(false)}>
              <Link href="/join">Become a Partner</Link>
            </li>
          )}
        </ul>

        {/* Mobile Auth */}
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
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 py-3 rounded-lg font-semibold"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </>
  );
}

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

  // Detect login & role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        try {
          const token: IdTokenResult = await currentUser.getIdTokenResult();
          setUserRole((token.claims.role as string) || "user");
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

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside profile dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUserRole(null);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/login");
  };

  // Style logic
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
          {/* Logo */}
          <Link
            href="/"
            className={`text-2xl font-bold uppercase tracking-wide ${textColor}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            shubyatra<span className="text-indigo-500">.</span>world
          </Link>

          {/* Desktop Menu */}
          <ul
            className={`hidden md:flex items-center gap-8 text-sm font-medium ${textColor}`}
          >
            <li>
              <Link href="/" className="hover:opacity-70">
                Home
              </Link>
            </li>
            <li>
              <Link href="/vehicles" className="hover:opacity-70">
                Vehicles
              </Link>
            </li>
            {!firebaseUser && (
              <li>
                <Link href="/join" className="hover:opacity-70">
                  Become a Partner
                </Link>
              </li>
            )}
          </ul>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full transition-colors ${textColor} ${buttonBorder} hover:bg-black/5 dark:hover:bg-white/10`}
            >
              <Globe size={16} /> EN
            </button>

            {!loading && (
              <>
                {!firebaseUser ? (
                  <Link
                    href="/login"
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-full transition-transform hover:scale-105 ${
                      isSolidState
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    <UserIcon size={18} /> Login
                  </Link>
                ) : (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-full ${textColor} ${buttonBorder}`}
                    >
                      {firebaseUser.photoURL ? (
                        <img
                          src={firebaseUser.photoURL}
                          alt="Avatar"
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon size={14} />
                        </div>
                      )}
                      <span className="hidden lg:block max-w-[100px] truncate">
                        {firebaseUser.displayName || "User"}
                      </span>
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border">
                        <div className="px-4 py-3 border-b">
                          <p className="font-bold">
                            {firebaseUser.displayName || "My Account"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {firebaseUser.email}
                          </p>
                        </div>

                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            <UserIcon size={16} /> My Profile
                          </Link>

                          {userRole === "partner" && (
                            <Link
                              href="/partner/dashboard"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                              <Hotel size={16} /> Partner Dashboard
                            </Link>
                          )}

                          {userRole === "admin" && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                              <ShieldCheck size={16} /> Admin Panel
                            </Link>
                          )}

                          <Link
                            href="/trips"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            <Briefcase size={16} /> My Trips
                          </Link>

                          <Link
                            href="/transactions"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            <Receipt size={16} /> Transactions
                          </Link>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} /> Log Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-white dark:bg-slate-950 z-[50] pt-28 px-6 transition-transform md:hidden ${
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <ul className="flex flex-col gap-6 text-xl font-bold">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </Link>
          <Link href="/vehicles" onClick={() => setIsMobileMenuOpen(false)}>
            Vehicles
          </Link>
          {!firebaseUser && (
            <Link href="/join" onClick={() => setIsMobileMenuOpen(false)}>
              Become a Partner
            </Link>
          )}
        </ul>

        <div className="mt-auto mb-10">
          {!firebaseUser ? (
            <Link
              href="/login"
              className="block w-full bg-black text-white py-4 rounded-full text-center font-bold"
            >
              Login / Sign Up
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full text-red-600 py-3 font-semibold"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </>
  );
}

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
import Image from "next/image";

interface NavbarProps {
  variant?: "transparent" | "default";
}

export default function Navbar({ variant = "transparent" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          const token: IdTokenResult = await currentUser.getIdTokenResult();
          setUserRole((token.claims.role as string) || "user");
        } catch {
          setUserRole("user");
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            {/* shubyatra<span className="text-indigo-500">.</span>world */}
            <div className="relative w-[180px] h-[40px]">
              {/* Light mode logo */}
              <Image
                src="/unnamed-removebg-preview.png"
                alt="Logo"
                fill
                className="object-contain dark:hidden"
                priority
              />

              {/* Dark mode logo */}
              <Image
                src="/main-dark.png"
                alt="Logo"
                fill
                className="object-contain hidden dark:block"
                priority
              />
            </div>
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
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-full transition-transform hover:scale-105 ${isSolidState ? "bg-black text-white" : "bg-white text-black"}`}
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
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                          <UserIcon
                            size={14}
                            className="text-gray-600 dark:text-gray-300"
                          />
                        </div>
                      )}
                      <span className="hidden lg:block max-w-[100px] truncate">
                        {firebaseUser.displayName || "User"}
                      </span>
                    </button>

                    {isProfileOpen && (
                      // ✅ Always white in light, always slate-900 in dark — never transparent
                      <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {firebaseUser.displayName || "My Account"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {firebaseUser.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <UserIcon
                              size={16}
                              className="text-gray-500 dark:text-gray-400"
                            />{" "}
                            My Profile
                          </Link>

                          {userRole === "partner" && (
                            <Link
                              href="/partner/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Hotel
                                size={16}
                                className="text-gray-500 dark:text-gray-400"
                              />{" "}
                              Partner Dashboard
                            </Link>
                          )}

                          {userRole === "admin" && (
                            <Link
                              href="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ShieldCheck
                                size={16}
                                className="text-gray-500 dark:text-gray-400"
                              />{" "}
                              Admin Panel
                            </Link>
                          )}

                          <Link
                            href="/trips"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Briefcase
                              size={16}
                              className="text-gray-500 dark:text-gray-400"
                            />{" "}
                            My Trips
                          </Link>

                          <Link
                            href="/transactions"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Receipt
                              size={16}
                              className="text-gray-500 dark:text-gray-400"
                            />{" "}
                            Transactions
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 dark:border-slate-700">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-full ${textColor}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ✅ Mobile Menu — always solid background, always readable */}
      <div
        className={`fixed inset-0 bg-white dark:bg-slate-950 z-[50] pt-28 px-6 flex flex-col transition-transform duration-300 md:hidden ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <ul className="flex flex-col gap-6 text-xl font-bold text-gray-900 dark:text-white">
          <li>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-indigo-500 transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/vehicles"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-indigo-500 transition-colors"
            >
              Vehicles
            </Link>
          </li>
          {!firebaseUser && (
            <li>
              <Link
                href="/join"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-indigo-500 transition-colors"
              >
                Become a Partner
              </Link>
            </li>
          )}
          {firebaseUser && (
            <>
              <li>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
                >
                  <UserIcon size={20} /> My Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/trips"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
                >
                  <Briefcase size={20} /> My Trips
                </Link>
              </li>
              <li>
                <Link
                  href="/transactions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
                >
                  <Receipt size={20} /> Transactions
                </Link>
              </li>
              {userRole === "partner" && (
                <li>
                  <Link
                    href="/partner/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
                  >
                    <Hotel size={20} /> Partner Dashboard
                  </Link>
                </li>
              )}
              {userRole === "admin" && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
                  >
                    <ShieldCheck size={20} /> Admin Panel
                  </Link>
                </li>
              )}
            </>
          )}
        </ul>

        <div className="mt-auto mb-10 pt-8 border-t border-gray-100 dark:border-slate-800">
          {!firebaseUser ? (
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-full text-center font-bold"
            >
              Login / Sign Up
            </Link>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {firebaseUser.email}
              </p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 py-3 font-semibold border border-red-200 dark:border-red-900 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={18} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

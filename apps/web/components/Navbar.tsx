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
        {/* Logo */}
        <Link
          href="/"
          className={`text-2xl font-bold uppercase tracking-wide`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="relative w-[180px] h-[40px]">
            {/* THEME + VARIANT LOGIC:
                - If transparent: Show White Logo ONLY.
                - If solid: Show Black Logo in Light Mode, White Logo in Dark Mode.
              */}
            {!isSolidState ? (
              /* Transparent State: ALWAYS show White Logo */
              <Image
                src="/main-dark.png" // The white text logo
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            ) : (
              /* Solid State: Use Tailwind's dark: classes to toggle */
              <>
                <Image
                  src="/main-white.png" // The dark text logo
                  alt="Logo"
                  fill
                  className="object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/main-dark.png" // The white text logo
                  alt="Logo"
                  fill
                  className="object-contain hidden dark:block"
                  priority
                />
              </>
            )}
          </div>
        </Link>
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

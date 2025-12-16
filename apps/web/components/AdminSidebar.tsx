"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import { apiRequest } from "@/lib/api";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Car,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Users,
  Briefcase,
  CalendarCheck,
  FileBadge,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  Lock, // Used for disabled items
} from "lucide-react";

// --- MENU STRUCTURE ---
const menuGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Join Requests", href: "/admin/requests", icon: FileText },
    ],
  },
  {
    label: "Supply (Partners)",
    items: [
      { name: "All Partners", href: "/admin/partners", icon: Briefcase },
      { name: "Properties", href: "/admin/properties", icon: Building2 },
      { name: "Vehicles", href: "/admin/vehicles", icon: Car },
    ],
  },
  {
    label: "Demand (Customers)",
    items: [
      { name: "Travelers", href: "/admin/travelers", icon: Users },
      { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
      { name: "Invoices", href: "/admin/invoices", icon: FileBadge },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- PERMISSIONS STATE ---
  const [permissions, setPermissions] = useState({
    role: "admin",
    hasProperty: false,
    hasVehicle: false,
    loading: true, // Starts true to prevent flashing locks
  });

  // --- SHADCN THEME LOGIC ---
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 1. AUTH & PERMISSIONS LOGIC
  useEffect(() => {
    setMounted(true);
    const auth = getAuth(app);

    // FIX: Listen for Auth State Change instead of running once
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // fetch permissions from backend
          const data = await apiRequest("/api/user/me", "GET");

          setPermissions({
            role: data.user?.role || "user",
            hasProperty: data.user?.hasProperty || false,
            hasVehicle: data.user?.hasVehicle || false,
            loading: false,
          });
        } catch (error) {
          console.error("Permissions Error:", error);
          setPermissions((prev) => ({ ...prev, loading: false }));
        }
      } else {
        // User logged out
        setPermissions({
          role: "user",
          hasProperty: false,
          hasVehicle: false,
          loading: false,
        });
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleLogout = async () => {
    await signOut(getAuth(app));
    router.push("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      {/* MOBILE TRIGGER */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-gray-900 text-white dark:bg-white dark:text-black rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen transition-transform duration-300
          w-72 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800
          text-gray-900 dark:text-white
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        <div className="h-full flex flex-col py-6 px-4 overflow-y-auto custom-scrollbar">
          {/* BRAND */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-black text-white dark:bg-white dark:text-black p-2 rounded-xl">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide leading-none">
                ADMIN
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                Trav & Stay OS
              </p>
            </div>
          </div>

          {/* MENU LINKS */}
          <div className="flex-1 space-y-8">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;

                    // --- 2. DISABLE LOGIC START ---
                    let isDisabled = false;

                    // Only check logic if we are done loading
                    if (!permissions.loading) {
                      const { role, hasProperty, hasVehicle } = permissions;
                      const isAdmin = role === "admin";

                      // A. ADMIN ONLY PAGES
                      if (
                        [
                          "Join Requests",
                          "All Partners",
                          "Settings",
                          "Invoices",
                        ].includes(item.name)
                      ) {
                        if (!isAdmin) isDisabled = true;
                      }

                      // B. PROPERTY SPECIFIC
                      if (item.name === "Properties") {
                        if (!isAdmin && !hasProperty) isDisabled = true;
                      }

                      // C. VEHICLE SPECIFIC
                      if (item.name === "Vehicles") {
                        if (!isAdmin && !hasVehicle) isDisabled = true;
                      }

                      // D. SHARED BUSINESS OPERATIONS
                      if (
                        ["Bookings", "Reviews", "Travelers"].includes(item.name)
                      ) {
                        if (!isAdmin && !hasProperty && !hasVehicle)
                          isDisabled = true;
                      }
                    }
                    // --- DISABLE LOGIC END ---

                    return (
                      <li key={item.href}>
                        {isDisabled ? (
                          // --- DISABLED STATE (Locked) ---
                          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg text-gray-300 dark:text-gray-700 cursor-not-allowed select-none group relative">
                            <div className="flex items-center gap-3">
                              <item.icon size={18} />
                              <span>{item.name}</span>
                            </div>
                            <Lock size={14} />
                          </div>
                        ) : (
                          // --- ENABLED STATE (Active Link) ---
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm
                              ${
                                isActive
                                  ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
                                  : "text-gray-500 hover:text-black hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-900"
                              }
                            `}
                          >
                            <item.icon size={18} />
                            <span>{item.name}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-lg transition-colors
                           text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-lg transition-colors
                         text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </>
  );
}

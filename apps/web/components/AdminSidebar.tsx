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
  Lock,
  IndianRupee,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// --- MENU STRUCTURE ---
const menuGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Join Requests", href: "/admin/requests", icon: FileText },
      { name: "Pricing", href: "/admin/pricing", icon: IndianRupee },
    ],
  },
  {
    label: "Supply (Partners)",
    items: [
      { name: "All Partners", href: "/admin/partners", icon: Briefcase },
      { name: "Hotels", href: "/admin/hotels", icon: Building2 },
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

// 🚨 NEW: Accept props from the layout
export default function AdminSidebar({
  isCollapsed,
  toggleSidebar,
}: {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- PERMISSIONS STATE ---
  const [permissions, setPermissions] = useState({
    role: "admin",
    hasProperty: false,
    hasVehicle: false,
    loading: true,
  });

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const data = await apiRequest("/api/user/me", "GET");
          setPermissions({
            role: data.user?.role || "user",
            hasProperty: data.user?.hasProperty || false,
            hasVehicle: data.user?.hasVehicle || false,
            loading: false,
          });
        } catch (error) {
          setPermissions((prev) => ({ ...prev, loading: false }));
        }
      } else {
        setPermissions({
          role: "user",
          hasProperty: false,
          hasVehicle: false,
          loading: false,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(getAuth(app));
    router.push("/login");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-[#111827] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-[#111827] border-r border-gray-100 dark:border-gray-800 flex flex-col ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${isCollapsed ? "w-[80px]" : "w-[280px]"}`}
      >
        <div
          className={`h-20 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0 transition-all ${isCollapsed ? "px-0 justify-center" : "px-5"}`}
        >
          {isCollapsed ? (
            <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 text-white p-2 rounded-xl shadow-sm shadow-orange-500/20 hidden md:flex items-center justify-center">
              <span className="font-black text-lg leading-none">A</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 text-white p-2.5 rounded-xl shadow-sm shadow-orange-500/20 shrink-0">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white leading-none">
                  Shubh Yatra
                </h1>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Admin OS
                </p>
              </div>
            </div>
          )}

          {/* 🚨 Uses the prop toggle function here */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 whitespace-nowrap">
                  {group.label}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  let isDisabled = false;

                  if (!permissions.loading) {
                    const { role, hasProperty, hasVehicle } = permissions;
                    const isAdmin = role === "admin";
                    if (
                      [
                        "Join Requests",
                        "All Partners",
                        "Settings",
                        "Invoices",
                        "Pricing",
                      ].includes(item.name) &&
                      !isAdmin
                    )
                      isDisabled = true;
                    if (item.name === "Hotels" && !isAdmin && !hasProperty)
                      isDisabled = true;
                    if (item.name === "Vehicles" && !isAdmin && !hasVehicle)
                      isDisabled = true;
                    if (
                      ["Bookings", "Reviews", "Travelers"].includes(
                        item.name,
                      ) &&
                      !isAdmin &&
                      !hasProperty &&
                      !hasVehicle
                    )
                      isDisabled = true;
                  }

                  return (
                    <li key={item.href}>
                      {isDisabled ? (
                        <div
                          title={isCollapsed ? `${item.name} (Locked)` : ""}
                          className={`flex items-center px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-600 cursor-not-allowed select-none transition-all ${isCollapsed ? "justify-center" : "justify-between"}`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon
                              size={18}
                              strokeWidth={2}
                              className="shrink-0"
                            />
                            {!isCollapsed && (
                              <span className="text-sm font-semibold whitespace-nowrap">
                                {item.name}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && (
                            <Lock size={14} className="shrink-0" />
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          title={isCollapsed ? item.name : ""}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm ${isActive ? "bg-orange-50 text-[#FF5A1F] dark:bg-[#FF5A1F]/10 dark:text-[#FF5A1F]" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50"} ${isCollapsed ? "justify-center" : ""}`}
                        >
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`shrink-0 ${isActive ? "text-[#FF5A1F]" : ""}`}
                          />
                          {!isCollapsed && (
                            <span className="whitespace-nowrap flex-1 overflow-hidden">
                              {item.name}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4 shrink-0">
          <div
            className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : "px-1"}`}
          >
            {mounted && (
              <button
                onClick={toggleTheme}
                title={isCollapsed ? "Toggle Theme" : ""}
                className={`flex items-center justify-center py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 transition-colors ${isCollapsed ? "w-full" : "flex-1"}`}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : ""}
              className={`flex items-center justify-center py-2.5 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors ${isCollapsed ? "w-full" : "flex-1"}`}
            >
              <LogOut size={16} />
            </button>
          </div>
          <div
            title={isCollapsed ? `${permissions.role} User` : ""}
            className={`flex items-center rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isCollapsed ? "justify-center p-2" : "justify-between p-3"}`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 flex items-center justify-center text-white dark:text-black font-black text-sm shadow-sm shrink-0">
                {permissions.role === "admin" ? "A" : "P"}
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap overflow-hidden">
                  <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight capitalize truncate">
                    {permissions.role} User
                  </div>
                  <div className="text-[10px] font-medium text-gray-500 truncate">
                    Manage account
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <MoreVertical size={16} className="text-gray-400 shrink-0" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

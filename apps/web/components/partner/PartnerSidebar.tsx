"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  LayoutDashboard,
  BedDouble,
  Car,
  CalendarCheck,
  Settings,
  LogOut,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Menu,
  IndianRupee,
  Bell,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  unreadCount?: number;
}

const MENU_ITEMS = [
  { label: "Overview", href: "/partner/dashboard", icon: LayoutDashboard },
  { label: "Notifications", href: "/partner/notifications", icon: Bell },
  { label: "Room Manager", href: "/partner/rooms", icon: BedDouble },
  { label: "My Vehicles", href: "/partner/vehicles", icon: Car },
  { label: "Bookings", href: "/partner/bookings", icon: CalendarCheck },
  { label: "Reports", href: "/partner/reports", icon: PieChart },
  { label: "Settings", href: "/partner/settings", icon: Settings },
  { label: "Earnings", href: "/partner/earnings", icon: IndianRupee },
];

export default function PartnerSidebar({
  isCollapsed,
  toggleSidebar,
  unreadCount = 0,
}: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* 🚨 NEW: MOBILE OVERLAY (Dark background when menu is open) */}
      {!isCollapsed && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 🚨 FIXED: RESPONSIVE SIDEBAR */}
      {/* It now uses 'translate-x' to slide in/out on mobile, and 'w-20/w-64' for desktop collapsing */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 ${
          isCollapsed
            ? "-translate-x-full w-64 md:w-20" // Hidden on mobile, shrunk on desktop
            : "translate-x-0 w-64"              // Visible on mobile, expanded on desktop
        }`}
      >
        {/* Header / Brand */}
        <div
          className={`h-16 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 ${isCollapsed ? "justify-center" : "px-6"}`}
        >
          {isCollapsed ? (
            <span className="text-xl font-extrabold text-rose-600 hidden md:block">P.</span>
          ) : (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                PARTNER<span className="text-rose-600">.</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                Manager Console
              </p>
            </div>
          )}
          
          <button
            onClick={toggleSidebar}
            className="w-auto flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="hidden md:block" />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const isNotif = item.label === "Notifications";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Auto-close sidebar on mobile when a link is clicked!
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all group ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg"
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white"
                } ${isCollapsed ? "md:justify-center" : ""}`}
              >
                {/* Icon Container */}
                <div className="relative flex items-center justify-center">
                  <item.icon
                    size={20}
                    className={`shrink-0 ${isActive ? "" : "group-hover:text-rose-600 transition-colors"}`}
                  />

                  {/* PULSING DOT */}
                  {isNotif && unreadCount > 0 && isCollapsed && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 hidden md:flex">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )}
                </div>

                {/* Text Label & Number Badge */}
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 flex-1 flex items-center justify-between ${
                    isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  {item.label}

                  {/* NUMBER BADGE */}
                  {isNotif && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Toggle & Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors ${isCollapsed ? "md:justify-center" : ""}`}
          >
            <LogOut size={20} />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"}`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 flex items-center justify-between px-4">
        <span className="font-bold text-lg text-gray-900 dark:text-white">
          Partner Panel
        </span>

        <div className="flex items-center gap-2">
          {/* MOBILE BELL ICON */}
          <Link
            href="/partner/notifications"
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-rose-600 transition-colors"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </Link>

          {/* 🚨 FIXED: ADDED onClick TO HAMBURGER MENU */}
          <button 
            onClick={toggleSidebar} 
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-rose-600 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </>
  );
}
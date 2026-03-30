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
  ShieldCheck,
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
      {/* 🚨 MOBILE OVERLAY */}
      {!isCollapsed && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 🚨 RESPONSIVE SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen bg-white dark:bg-[#111827] border-r border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 ${
          isCollapsed ? "-translate-x-full w-64 md:w-20" : "translate-x-0 w-64"
        }`}
      >
        {/* Header / Brand */}
        <div
          className={`h-20 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 ${isCollapsed ? "justify-center" : "px-5"}`}
        >
          {isCollapsed ? (
            <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 text-white p-2 rounded-xl shadow-sm shadow-orange-500/20 hidden md:flex items-center justify-center">
              <span className="font-black text-lg leading-none">P</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 text-white p-2.5 rounded-xl shadow-sm shadow-orange-500/20 shrink-0">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white leading-none">
                  Partner OS
                </h1>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Shubh Yatra
                </p>
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="w-auto flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={18} className="hidden md:block" />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <h3 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Management
            </h3>
          )}

          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const isNotif = item.label === "Notifications";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? "bg-orange-50 text-[#FF5A1F] dark:bg-[#FF5A1F]/10 dark:text-[#FF5A1F]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50"
                } ${isCollapsed ? "md:justify-center" : ""}`}
              >
                {/* Icon Container */}
                <div className="relative flex items-center justify-center">
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`shrink-0 ${isActive ? "text-[#FF5A1F]" : "group-hover:text-[#FF5A1F] transition-colors"}`}
                  />

                  {/* PULSING DOT (Collapsed View) */}
                  {isNotif && unreadCount > 0 && isCollapsed && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 hidden md:flex">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF5A1F]"></span>
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

                  {/* NUMBER BADGE (Expanded View) */}
                  {isNotif && unreadCount > 0 && (
                    <span className="bg-[#FF5A1F] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Toggle & Logout */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors ${isCollapsed ? "md:justify-center" : ""}`}
          >
            <LogOut size={20} strokeWidth={2.5} />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"}`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-gray-800 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-[#FF5A1F] to-orange-400 text-white p-1.5 rounded-lg shadow-sm">
            <ShieldCheck size={16} strokeWidth={2.5} />
          </div>
          <span className="font-black text-lg text-gray-900 dark:text-white tracking-tight">
            Partner<span className="text-[#FF5A1F]">.</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* MOBILE BELL ICON */}
          <Link
            href="/partner/notifications"
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-[#FF5A1F] dark:hover:text-[#FF5A1F] transition-colors"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF5A1F]"></span>
              </span>
            )}
          </Link>

          {/* HAMBURGER MENU */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#FF5A1F] dark:hover:text-[#FF5A1F] transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </>
  );
}

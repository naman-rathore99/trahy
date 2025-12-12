"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  LayoutDashboard,
  FileText,
  Home,
  PlusSquare,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(getAuth(app));
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Join Requests", href: "/admin/requests", icon: FileText },
    { name: "Properties", href: "/admin/properties", icon: Home },
    { name: "Add Property", href: "/admin/add-hotel", icon: PlusSquare },
  ];

  return (
    <>
      {/* MOBILE TRIGGER */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-black text-white rounded-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`
        fixed top-0 left-0 z-40 h-screen transition-transform bg-black text-white w-64
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        <div className="h-full flex flex-col py-6 px-4">
          {/* BRAND */}
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="bg-white text-black p-1.5 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">ADMIN</h1>
              <p className="text-xs text-gray-400">Trav & Stay</p>
            </div>
          </div>

          {/* NAVIGATION */}
          <ul className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                      ${
                        isActive
                          ? "bg-white text-black shadow-lg translate-x-1"
                          : "text-gray-400 hover:text-white hover:bg-gray-900"
                      }
                    `}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* USER / LOGOUT */}
          <div className="mt-auto pt-6 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center cursor-pointer gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}
    </>
  );
}

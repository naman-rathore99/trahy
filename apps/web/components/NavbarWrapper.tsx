"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const isDashboard =
    pathname.startsWith("/admin") || pathname.startsWith("/login");

  if (isDashboard) return null;

  return <Navbar />;
}

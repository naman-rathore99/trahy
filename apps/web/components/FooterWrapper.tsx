"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer"; // Import your existing Footer

export default function FooterWrapper() {
    const pathname = usePathname();

    // Define paths where the Footer should NOT appear
    const isDashboard =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/partner") ||
        pathname.startsWith("/login"); // Optional: Hide on login too

    // If we are on a dashboard, return null (render nothing)
    if (isDashboard) return null;

    // Otherwise, render the Footer
    return <Footer />;
}
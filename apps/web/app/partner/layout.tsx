"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import NotificationListener from "@/components/partner/NotificationListener";
import { Toaster } from "react-hot-toast";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🚨 Add state for the unread count
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdTokenResult();
        const role = token.claims.role;
        if (role === "partner" || role === "admin") {
          setAuthorized(true);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex transition-colors duration-300">
      {/* Inject the Popup Container */}
      <Toaster />

      {/* Inject the background listener */}
      <NotificationListener setUnreadCount={setUnreadCount} />

      {/* SIDEBAR */}
      <PartnerSidebar
        isCollapsed={isCollapsed}
        toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        unreadCount={unreadCount} // 🚨 Pass the count to your Sidebar!
      />

      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}
      >
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}

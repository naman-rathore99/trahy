"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Bell, CheckCircle2, Clock, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState<string | null>(null);

  // 1. Get current user safely
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserUid(user.uid);
    });
    return () => unsub();
  }, []);

  // 2. Listen for Real-Time Notifications
  useEffect(() => {
    if (!userUid) return;

    const q = query(
      collection(db, "notifications"),
      where("partnerId", "==", userUid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        // Catch the annoying Firebase Index error
        if (error.message.includes("index")) {
          toast.error("Firestore Index missing. Check console for the link!", {
            duration: 6000,
          });
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userUid]);

  // 3. Mark as Read Function
  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return; // Do nothing if already read

    try {
      await updateDoc(doc(db, "notifications", id), {
        isRead: true,
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to update notification.");
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-600" size={40} />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Bell className="text-rose-600" size={32} />
          Notifications
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Stay updated with your latest bookings and alerts.
        </p>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
            <Bell size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-lg text-gray-500 dark:text-gray-400">
              All caught up!
            </p>
            <p className="text-sm mt-1">You have no new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                className={`p-6 transition-colors cursor-pointer flex gap-4 items-start ${
                  notif.isRead
                    ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    : "bg-rose-50/50 dark:bg-rose-900/10 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                }`}
              >
                {/* Icon */}
                <div
                  className={`mt-1 p-2 rounded-full shrink-0 ${
                    notif.isRead
                      ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                      : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  }`}
                >
                  {notif.type === "new_booking" ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Info size={24} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3
                    className={`text-base ${notif.isRead ? "font-semibold text-gray-700 dark:text-gray-300" : "font-bold text-gray-900 dark:text-white"}`}
                  >
                    {notif.title}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${notif.isRead ? "text-gray-500" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 font-medium">
                    <Clock size={12} />
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Unread Indicator Dot */}
                {!notif.isRead && (
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full mt-2 shrink-0 shadow-sm shadow-rose-500/50" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

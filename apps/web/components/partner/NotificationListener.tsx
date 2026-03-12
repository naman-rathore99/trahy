"use client";

import { useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit, // ✅ Added limit
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { BellRing } from "lucide-react";

export default function NotificationListener({
  setUnreadCount,
}: {
  setUnreadCount: (count: number) => void;
}) {
  // ✅ Create a ref to track the first time the component loads
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationSound = new Audio("/ping.mp3");

    // ✅ Added a limit(20) to save Firebase reads.
    // If they have more than 20, your UI can just show "20+"
    const q = query(
      collection(db, "notifications"),
      where("partnerId", "==", user.uid),
      where("isRead", "==", false),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 1. Always update the Bell Icon count
      setUnreadCount(snapshot.docs.length);

      // 2. If this is the very first data pull on page load,
      // skip the toasts and sounds so we don't spam the user.
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      // 3. For any subsequent updates (Live incoming notifications)
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notif = change.doc.data();

          // Play Sound
          try {
            notificationSound
              .play()
              .catch((e) => console.log("Audio play blocked by browser:", e));
          } catch (e) {}

          // Show Side Toast ONLY for this new live notification
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-rose-100 dark:border-rose-900/30 overflow-hidden`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                        <BellRing size={20} />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {notif.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 focus:outline-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            ),
            { duration: 5000, position: "top-right" },
          );
        }
      });
    });

    return () => unsubscribe();
  }, [setUnreadCount]);

  return null;
}

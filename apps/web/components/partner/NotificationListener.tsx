"use client";

import { useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; // adjust path to your client firebase config
import toast from "react-hot-toast";
import { BellRing } from "lucide-react";

export default function NotificationListener({
  setUnreadCount,
}: {
  setUnreadCount: (count: number) => void;
}) {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Create an audio object (Put a 'ping.mp3' file in your Next.js /public folder!)
    const notificationSound = new Audio("/ping.mp3");

    const q = query(
      collection(db, "notifications"),
      where("partnerId", "==", user.uid),
      where("isRead", "==", false),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 1. Update the Bell Icon count
      setUnreadCount(snapshot.docs.length);

      // 2. Loop through the changes to see if a brand NEW notification arrived
      snapshot.docChanges().forEach((change) => {
        // 'added' means a new document was created (not just modified/read)
        if (change.type === "added") {
          const notif = change.doc.data();

          // Play Sound (Browsers require user interaction first, so wrap in try/catch)
          try {
            notificationSound
              .play()
              .catch((e) => console.log("Audio play blocked by browser:", e));
          } catch (e) {}

          // Show Side Toast
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
  }, []);

  return null; // This is a hidden logical component
}

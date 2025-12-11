"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import auth listener
import { app } from "@/lib/firebase";
import { apiRequest } from "@/lib/api";
import { CheckCircle, Shield, User, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Data loading
  const [authChecking, setAuthChecking] = useState(true); // Auth loading
  const router = useRouter();

  // 1. FIRST: Wait for Auth to be ready
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If really not logged in, kick them out
        router.push("/login");
      } else {
        // User confirmed! Now we can stop checking and let the fetch run
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. SECOND: Fetch Data (Only runs after Auth is confirmed)
  useEffect(() => {
    // If we are still checking auth, DO NOT fetch yet
    if (authChecking) return;

    const fetchUsers = async () => {
      try {
        const data = await apiRequest("/api/admin/users", "GET");
        setUsers(data.users || []);
      } catch (err) {
        console.error("Fetch error:", err);
        // If the API says "Access Denied", then kick them out
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authChecking, router]); // Dependency on authChecking ensures this waits

  // 3. Loading Screen
  if (authChecking || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">
            {authChecking
              ? "Verifying Admin Access..."
              : "Loading Dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">Manage users and verifications</p>
          </div>

          <Link
            href="/admin/add-hotel"
            className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Plus size={20} />
            <span>Add Property</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-gray-500 text-sm font-bold uppercase">
              Total Users
            </div>
            <div className="text-3xl font-bold mt-2">{users.length}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-gray-500 text-sm font-bold uppercase">
              Pending Verification
            </div>
            <div className="text-3xl font-bold text-orange-500 mt-2">
              {users.filter((u) => u.aadharUrl && !u.isLicenseVerified).length}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-700">Recent Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Identity Docs</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {user.name ? user.name[0] : <User size={18} />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {user.name || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {user.id.slice(0, 6)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.phone || "No phone"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.aadharUrl ? (
                          <a
                            href={user.aadharUrl}
                            target="_blank"
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            View Aadhar
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Missing</span>
                        )}

                        {user.licenseUrl && (
                          <a
                            href={user.licenseUrl}
                            target="_blank"
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                          >
                            View DL
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black text-white text-xs font-bold">
                          <Shield size={10} /> Admin
                        </span>
                      ) : user.isLicenseVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          <CheckCircle size={10} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

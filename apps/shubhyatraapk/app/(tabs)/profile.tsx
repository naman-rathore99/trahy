import { app, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const auth = getAuth(app);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const isPartner =
    userData?.role === "partner" || userData?.isPartner === true;

  const menuItems = [
    { icon: "person-outline", label: "Edit Profile", route: "/profile/edit" },
    { icon: "briefcase-outline", label: "My Trips", route: "/(tabs)/bookings" },
    { icon: "heart-outline", label: "Favorites", route: "/(tabs)/saved" },
    {
      icon: "settings-outline",
      label: "Settings",
      route: "/profile/edit",
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      route: "/(tabs)/support",
    },
  ];

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-black">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center px-6">
        <Ionicons
          name="person-circle-outline"
          size={100}
          color={isDark ? "#4B5563" : "#D1D5DB"}
        />
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4 text-center">
          Discover Mathura
        </Text>
        <Text className="text-gray-500 text-center mt-2 mb-8">
          Log in to book hotels, rent vehicles, and manage your trips
          seamlessly.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="w-full bg-[#FF5A1F] h-14 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30"
        >
          <Text className="text-white font-bold text-lg">Log In / Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        <View className="px-6 py-2">
          <Text className="text-2xl font-black text-gray-900 dark:text-white">
            Profile
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex-row items-center mb-8">
            <View className="w-16 h-16 bg-[#FF5A1F]/10 rounded-full items-center justify-center border border-[#FF5A1F]/20 mr-4">
              <Text className="text-[#FF5A1F] font-black text-2xl">
                {user.displayName
                  ? user.displayName.charAt(0).toUpperCase()
                  : "U"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {user.displayName || "Traveler"}
              </Text>
              <Text className="text-sm text-gray-500">{user.email}</Text>
              {isPartner && (
                <View className="bg-green-100 dark:bg-green-900/30 self-start px-2 py-1 rounded mt-2">
                  <Text className="text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                    Verified Partner
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              Partner Hub
            </Text>
            {isPartner ? (
              <TouchableOpacity
                onPress={() => router.replace("/partner/dashboard")} // 🚨 MUST BE REPLACE to swap layouts
                className="bg-gray-900 dark:bg-white p-5 rounded-2xl flex-row items-center justify-between shadow-lg"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-white/20 dark:bg-black/10 p-2 rounded-xl">
                    <Ionicons
                      name="business"
                      size={24}
                      color={isDark ? "black" : "white"}
                    />
                  </View>
                  <View>
                    <Text className="text-white dark:text-gray-900 font-bold text-lg">
                      Business Dashboard
                    </Text>
                    <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Manage your properties
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "black" : "white"}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/partner/join")}
                className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl flex-row items-center justify-between border border-rose-200 dark:border-rose-900/30"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-xl">
                    <Ionicons name="home" size={24} color="#e11d48" />
                  </View>
                  <View>
                    <Text className="text-rose-700 dark:text-rose-400 font-bold text-lg">
                      Become a Partner
                    </Text>
                    <Text className="text-rose-600/70 dark:text-rose-400/70 text-xs mt-1">
                      List your hotel or vehicle
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#e11d48" />
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-8">
            <Text className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              Account
            </Text>
            <View className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  className={`flex-row items-center justify-between p-4 ${index !== menuItems.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={isDark ? "#D1D5DB" : "#4B5563"}
                      />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-medium text-base">
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isDark ? "#4B5563" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 py-4 rounded-2xl border border-red-100 dark:border-red-900/20 mb-12"
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text className="text-red-600 font-bold text-base">Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

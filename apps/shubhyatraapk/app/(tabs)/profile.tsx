import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { app, db } from "../../config/firebase";

// ==========================================
// 1. REUSABLE UI COMPONENTS
// ==========================================

interface SectionHeaderProps {
  title: string;
  colorClass?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  colorClass = "text-gray-400",
}) => (
  <Text
    className={`text-xs font-bold uppercase tracking-wider mb-2 mt-6 ml-2 ${colorClass}`}
  >
    {title}
  </Text>
);

interface SettingRowProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  rightElement?: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  isDestructive = false,
  rightElement,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress && !rightElement}
    className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800"
  >
    <View className="flex-row items-center flex-1 pr-4">
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
          isDestructive
            ? "bg-red-50 dark:bg-red-900/20"
            : "bg-gray-50 dark:bg-gray-800"
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isDestructive ? "#EF4444" : "#9CA3AF"}
        />
      </View>
      <View>
        <Text
          className={`font-bold text-base ${
            isDestructive ? "text-red-500" : "text-gray-900 dark:text-white"
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
        )}
      </View>
    </View>

    {rightElement ? (
      rightElement
    ) : (
      <Ionicons name="chevron-forward" size={20} color="gray" />
    )}
  </TouchableOpacity>
);

// 🚨 NEW: Smart Role-Based Card
interface RoleCardProps {
  role: string;
  isDark: boolean;
}

const RoleBasedCard: React.FC<RoleCardProps> = ({ role, isDark }) => {
  const router = useRouter();

  // 1. ADMIN VIEW
  if (role === "admin") {
    return (
      <TouchableOpacity
        onPress={() => router.push("/admin/dashboard")}
        className="bg-indigo-600 dark:bg-indigo-500 p-5 rounded-3xl flex-row items-center justify-between shadow-lg mb-2"
      >
        <View className="flex-row items-center gap-3">
          <View className="bg-white/20 p-2 rounded-xl">
            <Ionicons name="shield-checkmark" size={24} color="white" />
          </View>
          <View>
            <Text className="text-white font-bold text-lg">Admin Console</Text>
            <Text className="text-indigo-100 text-xs mt-1">
              Manage platform & approvals
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </TouchableOpacity>
    );
  }

  // 2. PARTNER VIEW
  if (role === "partner") {
    return (
      <TouchableOpacity
        onPress={() => router.push("/partner/dashboard")}
        className="bg-gray-900 dark:bg-white p-5 rounded-3xl flex-row items-center justify-between shadow-lg mb-2"
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
    );
  }

  // 3. NORMAL USER VIEW (Allow them to apply)
  return (
    <TouchableOpacity
      onPress={() => router.push("/partner/join")}
      className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-3xl flex-row items-center justify-between border border-rose-200 dark:border-rose-900/30 mb-2"
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
  );
};

// ==========================================
// 2. MAIN SCREEN COMPONENT
// ==========================================

export default function ProfileScreen() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const auth = getAuth(app);

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);

  // --- DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) setUserData(userDoc.data());
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

  useFocusEffect(
    useCallback(() => {
      const fetchLatestData = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.reload();
          setUser({ ...auth.currentUser });
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              setUserData(userDoc.data());
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      };

      if (!loading) {
        fetchLatestData();
      }
    }, [loading]),
  );

  // 🚨 NEW: Calculate the EXACT role of the logged-in user
  const effectiveRole =
    userData?.role === "admin"
      ? "admin"
      : userData?.role === "partner" || userData?.isPartner === true
        ? "partner"
        : "user";

  // --- HANDLERS ---
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("Account deleted");
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#09090B]">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-[#09090B] justify-center items-center px-6">
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
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        <View className="px-6 py-2">
          <Text className="text-2xl font-black text-gray-900 dark:text-white">
            Profile
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {/* USER INFO CARD */}
          <View className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex-row items-center mb-6">
            <View className="w-16 h-16 bg-[#FF5A1F]/10 rounded-full items-center justify-center border border-[#FF5A1F]/20 mr-4 overflow-hidden">
              {user.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-[#FF5A1F] font-black text-2xl">
                  {user.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {user.displayName || "Traveler"}
              </Text>
              <Text className="text-sm text-gray-500">{user.email}</Text>

              {/* Dynamic Status Pill */}
              {effectiveRole === "admin" && (
                <View className="bg-indigo-100 dark:bg-indigo-900/30 self-start px-2 py-1 rounded mt-2">
                  <Text className="text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    Platform Admin
                  </Text>
                </View>
              )}
              {effectiveRole === "partner" && (
                <View className="bg-green-100 dark:bg-green-900/30 self-start px-2 py-1 rounded mt-2">
                  <Text className="text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                    Verified Partner
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* DYNAMIC HUB SECTION */}
          <SectionHeader
            title={effectiveRole === "admin" ? "Admin Hub" : "Partner Hub"}
          />
          <RoleBasedCard role={effectiveRole} isDark={isDark} />

          {/* ACCOUNT & ACTIVITY */}
          <SectionHeader title="Account & Activity" />
          <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-gray-100 dark:border-gray-800">
            <SettingRow
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your name and photo"
              onPress={() => router.push("/profile/edit" as any)}
            />
            <SettingRow
              icon="briefcase-outline"
              title="My Trips"
              subtitle="View upcoming and past bookings"
              onPress={() => router.push("/(tabs)/bookings" as any)}
            />
            <SettingRow
              icon="heart-outline"
              title="Favorites"
              subtitle="Your saved stays and rides"
              onPress={() => router.push("../saved" as any)}
            />
            <SettingRow
              icon="card-outline"
              title="Payment Methods"
              subtitle="Manage your saved cards"
              onPress={() => console.log("Payments")}
            />
          </View>

          {/* APP PREFERENCES */}
          <SectionHeader title="App Preferences" />
          <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-gray-100 dark:border-gray-800">
            <SettingRow
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={toggleColorScheme}
                  trackColor={{ false: "#E5E7EB", true: "#FF5A1F" }}
                  thumbColor={"#ffffff"}
                />
              }
            />
            <SettingRow
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Get updates on your bookings"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#E5E7EB", true: "#FF5A1F" }}
                  thumbColor={"#ffffff"}
                />
              }
            />
          </View>

          {/* SUPPORT & LEGAL */}
          <SectionHeader title="Support & Legal" />
          <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-gray-100 dark:border-gray-800">
            <SettingRow
              icon="help-buoy-outline"
              title="Help Center"
              onPress={() => router.push("/(tabs)/support" as any)}
            />
            <SettingRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => console.log("Privacy")}
            />
            <SettingRow
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => console.log("Terms")}
            />
          </View>

          {/* DANGER ZONE */}
          <SectionHeader title="Danger Zone" colorClass="text-red-400" />
          <View className="bg-white dark:bg-[#111827] rounded-3xl px-4 border border-red-100 dark:border-red-900/30 mb-8">
            <SettingRow
              icon="log-out-outline"
              title="Log Out"
              isDestructive={true}
              onPress={handleLogout}
              rightElement={<View />}
            />
            <SettingRow
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently remove your data"
              isDestructive={true}
              onPress={handleDeleteAccount}
              rightElement={<View />}
            />
          </View>

          <Text className="text-center text-gray-400 text-xs mb-10">
            Shubh Yatra v1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

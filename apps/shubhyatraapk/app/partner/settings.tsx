import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext"; // ✅ Real User Data

export default function PartnerSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false); // Just visual state for now

  // Handle Logout
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive", 
        onPress: async () => {
            await signOut(auth);
            router.replace("/auth/login");
        }
      }
    ]);
  };

  const MENU_ITEMS = [
    { icon: "wallet-outline", label: "Bank & Payouts", desc: "Manage your bank account", route: "/partner/wallet" },
    { icon: "business-outline", label: "Business Profile", desc: "Hotel/Fleet details", route: "/partner/profile" },
    { icon: "notifications-outline", label: "Notification Settings", desc: "Trips & Check-ins", route: "/partner/notifications" },
    { icon: "shield-checkmark-outline", label: "Documents", desc: "KYC & Licenses", route: "/partner/documents" },
    { icon: "headset-outline", label: "Partner Support", desc: "Get help 24/7", route: "/partner/support" },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700"
          >
            <Ionicons name="arrow-back" size={24} color="gray" />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-xl font-bold">Partner Settings</Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          
          {/* Profile Card */}
          <View className="flex-row items-center bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 mb-8 shadow-sm">
            <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm">
                {user?.photoURL ? (
                    <Image source={{ uri: user.photoURL }} className="w-full h-full rounded-full" />
                ) : (
                    <Text className="text-[#FF5A1F] text-2xl font-bold">
                        {user?.displayName?.charAt(0).toUpperCase() || "P"}
                    </Text>
                )}
            </View>
            <View className="ml-4 flex-1">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                    {user?.displayName || "Partner"}
                </Text>
                <Text className="text-gray-500 text-xs mb-2">{user?.email}</Text>
                <View className="flex-row">
                    <View className="bg-green-100 dark:bg-green-500/20 px-2 py-1 rounded-md flex-row items-center gap-1">
                        <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                        <Text className="text-green-700 dark:text-green-500 text-[10px] font-bold uppercase">Verified Partner</Text>
                    </View>
                </View>
            </View>
          </View>

          {/* Settings Group */}
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4 ml-2">General</Text>
          <View className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm mb-6">
             {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity 
                    key={index}
                    onPress={() => item.route ? router.push(item.route as any) : Alert.alert("Coming Soon")}
                    className={`flex-row items-center p-5 ${index !== MENU_ITEMS.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
                >
                    <View className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center">
                        <Ionicons name={item.icon as any} size={20} color="#4B5563" />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-sm">{item.label}</Text>
                        <Text className="text-gray-500 text-xs mt-0.5">{item.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
             ))}
          </View>

          {/* Switch to Traveler Mode */}
          <TouchableOpacity 
            onPress={() => router.push("/(tabs)")}
            className="bg-gray-900 dark:bg-gray-800 p-4 rounded-2xl flex-row items-center justify-between border border-gray-800 mb-4"
          >
             <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-gray-800 dark:bg-gray-700 rounded-full items-center justify-center">
                    <Ionicons name="airplane" size={20} color="#FF5A1F" />
                </View>
                <View>
                    <Text className="text-white font-bold">Switch to Traveler Mode</Text>
                    <Text className="text-gray-400 text-xs">Book trips for yourself</Text>
                </View>
             </View>
             <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 py-4 rounded-2xl flex-row justify-center items-center mb-10"
          >
             <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
             <Text className="text-red-500 font-bold">Log Out</Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-400 text-xs mb-8">Partner App v1.0.2</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
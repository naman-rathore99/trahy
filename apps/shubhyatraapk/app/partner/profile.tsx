import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth"; // 🚨 NEW: Imported for the logout button
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

export default function PartnerProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // 1. Fetch Partner Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBusinessName(data.businessName || "My Business");
          setOwnerName(user.displayName || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Save Changes
  const handleSave = async () => {
    if (!businessName || !phone) {
      Alert.alert("Error", "Business Name and Phone are required.");
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          businessName,
          phone,
          address,
          updatedAt: new Date().toISOString(),
        });
        Alert.alert("Success", "Business profile updated!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not save changes.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/auth/login" as any); // Adjust this route to your actual login page
          } catch (error) {
            console.error("Logout Error:", error);
          }
        },
      },
    ]);
  };

  if (isFetching) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#09090B]">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          {/* Removed the back button since this is a bottom tab! */}
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Business Hub
          </Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full items-center justify-center mb-3 relative border-4 border-white dark:border-gray-800 shadow-sm">
              <Ionicons name="business" size={40} color="#FF5A1F" />
              <TouchableOpacity className="absolute bottom-0 right-0 bg-[#FF5A1F] p-2 rounded-full border-2 border-white dark:border-gray-800">
                <Ionicons name="camera" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {businessName || "Your Business"}
            </Text>
            <Text className="text-gray-500 text-xs mt-1 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full overflow-hidden">
              Verified Partner ✓
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-5 gap-4">
            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Business Name
              </Text>
              <TextInput
                className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Royal Heritage Hotel"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Owner Name
              </Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-medium"
                value={ownerName}
                editable={false}
              />
            </View>

            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Contact Phone
              </Text>
              <TextInput
                className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Full Address
              </Text>
              <TextInput
                className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium h-24"
                value={address}
                onChangeText={setAddress}
                multiline
                textAlignVertical="top"
                placeholder="Enter business address..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className="mt-6 bg-[#FF5A1F] h-14 rounded-xl items-center justify-center shadow-sm"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* 🚨 NEW: MENU SECTION FOR HIDDEN FILES */}
          <View className="mt-10 mb-6 border-t border-gray-200 dark:border-gray-800 pt-8">
            <Text className="text-gray-900 dark:text-white text-lg font-black mb-4">
              Manage Business
            </Text>

            <View className="gap-3">
              {[
                {
                  label: "Manage Rooms",
                  icon: "bed-outline",
                  route: "/partner/rooms",
                },
                {
                  label: "Manage Fleet (Vehicles)",
                  icon: "car-outline",
                  route: "/partner/fleet",
                },
                {
                  label: "Verification Documents",
                  icon: "document-text-outline",
                  route: "/partner/documents",
                },
                {
                  label: "App Settings",
                  icon: "settings-outline",
                  route: "/partner/settings",
                },
                {
                  label: "Help & Support",
                  icon: "help-buoy-outline",
                  route: "/partner/support",
                },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(item.route as any)}
                  className="flex-row items-center justify-between bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color="#FF5A1F"
                      />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold">
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-2 mb-12 flex-row items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-500 font-bold text-base">Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

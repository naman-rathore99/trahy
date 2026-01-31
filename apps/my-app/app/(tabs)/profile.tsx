import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const MENU_ITEMS = [
  { icon: "person-outline", label: "Edit Profile" },
  { icon: "notifications-outline", label: "Notifications", badge: 2 },
  { icon: "card-outline", label: "Payment Methods" },
  { icon: "shield-checkmark-outline", label: "Security & Privacy" },
  { icon: "help-circle-outline", label: "Help Center" },
  { icon: "log-out-outline", label: "Logout", color: "#EF4444" },
];

export default function ProfileScreen() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="pb-24">
        {/* --- Header Section --- */}
        <View className="items-center mt-6 mb-8">
          <View className="relative">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
              }}
              className="w-28 h-28 rounded-full border-4 border-gray-100"
            />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-[#FF5A1F] p-2 rounded-full border-2 border-white">
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mt-4">
            David Rodriques
          </Text>
          <Text className="text-gray-500 text-sm">david.rod@gmail.com</Text>
        </View>

        {/* --- Stats Section --- */}
        <View className="flex-row justify-between px-10 mb-8">
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">45</Text>
            <Text className="text-gray-400 text-xs uppercase tracking-wider mt-1">
              Trips
            </Text>
          </View>
          <View className="w-[1px] h-10 bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">12</Text>
            <Text className="text-gray-400 text-xs uppercase tracking-wider mt-1">
              Bucket List
            </Text>
          </View>
          <View className="w-[1px] h-10 bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">4.8</Text>
            <Text className="text-gray-400 text-xs uppercase tracking-wider mt-1">
              Reviews
            </Text>
          </View>
        </View>

        {/* --- Menu List --- */}
        <View className="px-6">
          <Text className="text-gray-900 font-bold text-lg mb-4">Settings</Text>

          {/* Dark Mode Toggle (Special Case) */}
          <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl mb-4 border border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-100">
                <Ionicons name="moon-outline" size={20} color="black" />
              </View>
              <Text className="text-gray-700 font-medium ml-4">Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: "#E5E7EB", true: "#FF5A1F" }}
            />
          </View>

          {/* Regular Menu Items */}
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl mb-3 border border-gray-100 active:scale-[0.98]"
            >
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center border border-gray-100 ${item.color ? "bg-red-50 border-red-100" : "bg-white"}`}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.color || "black"}
                  />
                </View>
                <Text
                  className={`font-medium ml-4 ${item.color ? "text-red-500" : "text-gray-700"}`}
                >
                  {item.label}
                </Text>
              </View>

              {item.badge ? (
                <View className="bg-[#FF5A1F] w-6 h-6 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {item.badge}
                  </Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Spacer for Bottom Tab Bar */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}

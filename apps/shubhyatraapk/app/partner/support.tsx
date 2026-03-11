import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Alert,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnerSupport() {
  const router = useRouter();

  // 📞 Phone Call Handler
  const handleCall = () => {
    Linking.openURL("tel:+919876543210").catch(() => 
      Alert.alert("Error", "Unable to open dialer")
    );
  };

  // 📧 Email Handler
  const handleEmail = () => {
    Linking.openURL("mailto:support@partnerapp.com").catch(() => 
      Alert.alert("Error", "Unable to open email app")
    );
  };

  // 💬 Chat Handler (Placeholder)
  const handleChat = () => {
    Alert.alert("Live Chat", "Connecting you to an agent...");
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        {/* --- Header --- */}
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
            <TouchableOpacity 
                onPress={() => router.back()} 
                className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700"
            >
                <Ionicons name="arrow-back" size={24} color="gray" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">Partner Support</Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            
            {/* Hero Text */}
            <View className="mb-8">
                <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">How can we help?</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-base leading-6">
                    Our dedicated support team is available 24/7 to assist you with bookings, payouts, and account issues.
                </Text>
            </View>

            {/* Action Grid */}
            <View className="flex-row gap-4 mb-10">
                {/* Call */}
                <TouchableOpacity 
                    onPress={handleCall}
                    className="flex-1 bg-white dark:bg-[#1F2937] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 items-center shadow-sm"
                >
                    <View className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center mb-3">
                        <Ionicons name="call" size={26} color="#10B981" />
                    </View>
                    <Text className="font-bold text-gray-900 dark:text-white text-base">Call Us</Text>
                    <Text className="text-gray-400 text-xs mt-1">24/7 Priority</Text>
                </TouchableOpacity>

                {/* Chat */}
                <TouchableOpacity 
                    onPress={handleChat}
                    className="flex-1 bg-white dark:bg-[#1F2937] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 items-center shadow-sm"
                >
                    <View className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-3">
                        <Ionicons name="chatbubbles" size={26} color="#3B82F6" />
                    </View>
                    <Text className="font-bold text-gray-900 dark:text-white text-base">Live Chat</Text>
                    <Text className="text-gray-400 text-xs mt-1">Wait time: 2m</Text>
                </TouchableOpacity>

                 {/* Email */}
                 <TouchableOpacity 
                    onPress={handleEmail}
                    className="flex-1 bg-white dark:bg-[#1F2937] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 items-center shadow-sm"
                >
                    <View className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-full items-center justify-center mb-3">
                        <Ionicons name="mail" size={26} color="#8B5CF6" />
                    </View>
                    <Text className="font-bold text-gray-900 dark:text-white text-base">Email</Text>
                    <Text className="text-gray-400 text-xs mt-1">Response: 4h</Text>
                </TouchableOpacity>
            </View>

            {/* FAQ Section */}
            <Text className="font-bold text-gray-900 dark:text-white text-lg mb-4 ml-1">Frequently Asked Questions</Text>
            
            <View className="bg-white dark:bg-[#1F2937] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm mb-10">
                {[
                    "How do I change my bank details?", 
                    "Why is my payout pending?", 
                    "How to add a new vehicle/room?", 
                    "Understanding service fees",
                    "How to cancel a booking?"
                ].map((faq, i, arr) => (
                    <TouchableOpacity 
                        key={i} 
                        className={`p-5 flex-row justify-between items-center ${i !== arr.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
                    >
                        <Text className="text-gray-600 dark:text-gray-300 font-medium text-sm flex-1 mr-4">{faq}</Text>
                        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                ))}
            </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, ImageBackground, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKGROUND_IMG = require("../assets/images/home-main.jpg");

export default function ReturningUserSplash() {
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch user data in the background while this screen is shown
    const prepareDashboard = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1800)); // Show for 1.8s

        router.replace("/(tabs)");
      } catch (error) {
        console.error("Dashboard Preparation Failed:", error);
        // Fallback or retry logic here
      }
    };

    prepareDashboard();
  }, []);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" translucent />
      <ImageBackground
        source={{ uri: BACKGROUND_IMG }}
        className="flex-1"
        resizeMode="cover"
      >
        {/* Deep brand purple and dark gradient overlay */}
        <View className="flex-1 bg-black/50 backdrop-blur-xl justify-center items-center px-6">
          <View className="flex-1 justify-center items-center">
            {/* Peacock Symbol (cohesive with swiper design) */}
            <View className="h-28 w-28 rounded-full bg-[#5f259f]/20 items-center justify-center border border-[#a78bfa]/10 mb-8 shadow-2xl">
              <Text className="text-white text-5xl">🦚</Text>
            </View>

            <Text className="text-white text-3xl font-extrabold uppercase leading-[1.1] mb-2 tracking-[0.1em]">
              Namaste
            </Text>
            <Text className="text-white font-medium text-sm tracking-widest uppercase mb-16 px-6 text-center">
              Preparing your Next Adventure...
            </Text>

            <View className="flex-row items-center gap-3 bg-[#5f259f]/80 px-4 py-2 rounded-full">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white/80 text-xs font-medium uppercase tracking-[0.2em]">
                Seamless Login
              </Text>
            </View>
          </View>

          <SafeAreaView className="pb-6">
            <Text className="text-white/40 text-[10px] text-center font-medium tracking-widest uppercase">
              © Shubhyatra 2026
            </Text>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

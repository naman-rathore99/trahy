import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Get screen dimensions
const { width, height } = Dimensions.get("screen");

const SLIDES = [
  {
    id: "1",
    title: "Unlock\nYour Next\nAdventure",
    subtitle: "Explore the Unseen",
    image: "https://images.unsplash.com/photo-1523978591478-c753949ff840?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Find Peace\nIn Sacred\nPlaces",
    subtitle: "Spiritual Journeys",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1776&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Luxury Stays\nAt Best\nPrices",
    subtitle: "Comfort & Style",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1974&auto=format&fit=crop",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handlePressBtn = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      // ✅ Go to Login Page
      router.replace("/auth/login");
    }
  };

  const openWebsite = () => {
    Linking.openURL("https://www.shubhyatra.world");
  };

  const renderItem = ({ item }: { item: (typeof SLIDES)[0] }) => (
    <View style={{ width, height }} className="flex-1">
      <ImageBackground
        source={{ uri: item.image }}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 bg-black/30 justify-center items-center px-6">
          <Text className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase mb-4 text-center">
            {item.subtitle}
          </Text>
          <Text className="text-white text-5xl font-extrabold text-center uppercase leading-[1.1] shadow-lg">
            {item.title}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" translucent />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        scrollEventThrottle={16}
        className="flex-1"
      />

      {/* Overlays (Buttons & Dots) */}
      <View className="absolute inset-0 justify-between" pointerEvents="box-none">
        <SafeAreaView className="flex-1 justify-between py-6 px-6" pointerEvents="box-none">
          
          {/* Top Bar */}
          <View className="flex-row justify-between items-start">
            <TouchableOpacity
              onPress={openWebsite}
              className="bg-white/30 backdrop-blur-lg px-4 py-2 rounded-xl flex-row items-center border border-white/20"
            >
              <Feather name="globe" size={14} color="white" />
              <Text className="text-white font-bold text-xs ml-2 uppercase tracking-wider">Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("/auth/login")}
              className="bg-black/30 backdrop-blur-lg px-4 py-2 rounded-xl flex-row items-center border border-white/10"
            >
              <Text className="text-white/80 font-bold text-xs uppercase tracking-wider">Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Bar */}
          <View className="w-full pb-4">
            <TouchableOpacity
              onPress={handlePressBtn}
              className="bg-[#E8F0F2] py-5 rounded-full flex-row justify-center items-center shadow-xl mb-8"
            >
              <Text className="text-gray-900 font-bold text-sm tracking-widest uppercase mr-3">
                {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
              </Text>
              <Feather name="arrow-right" size={20} color="#111827" />
            </TouchableOpacity>

            {/* Pagination Dots */}
            <View className="flex-row justify-center gap-3 mb-2">
              {SLIDES.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentIndex === index ? "w-8 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </View>

            <Text className="text-white/40 text-[10px] text-center font-medium tracking-widest uppercase mt-4">
              © Shubhyatra 2026
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
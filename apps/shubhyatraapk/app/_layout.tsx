import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAdminGroup = segments[0] === "admin";
    const inPartnerGroup = segments[0] === "partner";
    const inWelcome = (segments as string[]).length === 0;

    // ✅ /partner/join is public — anyone can register as a partner
    const isPartnerJoin = inPartnerGroup && segments[1] === "join";

    if (!user) {
      // 🛑 Not logged in — block protected routes, but allow partner/join
      if (inTabsGroup || inAdminGroup || (inPartnerGroup && !isPartnerJoin)) {
        router.replace("/auth/login");
      }
    } else {
      // ✅ Logged in — skip welcome/auth screens
      if (inAuthGroup || inWelcome) {
        router.replace("/(tabs)");
      }
    }
  }, [user, isLoading, segments, isReady]);

  if (isLoading || !isReady) {
    return (
      <View className="flex-1 justify-center items-center bg-[#FF5A1F]">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="partner" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

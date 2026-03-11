import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";

export default function AuthLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? "#09090B" : "#FFFFFF" },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="forgot-password" />
      {/* <Stack.Screen name="join"/> */}
    </Stack>
  );
}
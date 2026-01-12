import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

const MainLayout = () => {
    const { userToken, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Wait for mounting and auth loading to finish
        if (isLoading || !isMounted) return;

        const inAuthGroup = segments[0] === "(auth)";

        // Redirect Logic
        if (!userToken && !inAuthGroup) {
            router.replace("/login");
        }
        else if (userToken && inAuthGroup) {
            router.replace("/(tabs)/home");
        }
    }, [userToken, isLoading, segments, isMounted]);

    // ✅ FIX: Don't unmount the Stack while loading.
    // Instead, just render the Stack always.
    // If we are loading, we can show a spinner ON TOP, or just rely on the splash screen.
    // But returning <View> here destroys the navigation history.

    return (
        <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="hotel-details"
                    options={{
                        presentation: 'card',
                        headerShown: false,
                        animation: 'slide_from_right'
                    }}
                />
            </Stack>

            {/* Overlay Loading Spinner if needed, but keep Stack mounted underneath */}
            {isLoading && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', zIndex: 999
                }}>
                    <ActivityIndicator size="large" color="#E11D48" />
                </View>
            )}
        </View>
    );
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
}
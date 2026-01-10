import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

// Separate component to handle redirection logic
const MainLayout = () => {
    const { userToken, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)"; // e.g., Login/Signup screens

        // Logic: If no user and not in auth group -> Go to Login
        if (!userToken && !inAuthGroup) {
            router.replace("/login");
        }
        // Logic: If user exists and in auth group -> Go to Home
        else if (userToken && inAuthGroup) {
            router.replace("/(tabs)/home");
        }
    }, [userToken, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#E11D48" />
            </View>
        );
    }

    return <Slot />;
};

// Wrap everything in AuthProvider
export default function RootLayout() {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
}
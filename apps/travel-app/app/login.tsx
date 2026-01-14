import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router'; // ✅ 1. Import Router
import { setAuthToken } from '../src/services/api';

export default function LoginScreen() {
    const router = useRouter(); // ✅ 2. Initialize Router
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {

            router.replace('/(tabs)/home');

        } catch (error) {
            Alert.alert('Login Failed', 'Something went wrong');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white justify-center px-6">
            <StatusBar barStyle="dark-content" />

            {/* Logo or Header */}
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
                <Text className="text-gray-500 mt-2">Sign in to continue your journey</Text>
            </View>

            {/* Inputs */}
            <View className="space-y-4">
                <TextInput
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            {/* Login Button */}
            <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="w-full bg-rose-600 p-4 rounded-xl mt-8 items-center justify-center shadow-lg shadow-rose-200"
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">Sign In</Text>
                )}
            </TouchableOpacity>

            {/* Link to Signup (Optional) */}
            <View className="flex-row justify-center mt-6">
                <Text className="text-gray-500">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                    <Text className="text-rose-600 font-bold">Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
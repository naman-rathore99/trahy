import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { signInWithGoogle } from '../services/googleAuth'; // ✅ Import Helper

export default function LoginScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        const user = await signInWithGoogle(); // Call Helper
        setLoading(false);

        if (user) {
            // ✅ Login Successful -> Go Home
            navigation.replace('Home');
        }
    };

    const handleStandardLogin = () => {
        // Your existing email/pass logic
        navigation.replace('Home');
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 justify-center px-6">

                {/* Branding */}
                <View className="items-center mb-10">
                    <Text className="text-orange-500 text-xs font-bold tracking-[6px] uppercase mb-2">Welcome Back</Text>
                    <Text className="text-white text-5xl font-bold tracking-tighter">
                        Shubh<Text className="text-blue-500">yatra</Text>
                    </Text>
                </View>

                {/* Inputs */}
                <View className="space-y-4 mb-6">
                    <View className="bg-gray-900 border border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                        <Mail color="#9CA3AF" size={20} />
                        <TextInput
                            placeholder="Email Address"
                            placeholderTextColor="#6B7280"
                            className="flex-1 text-white ml-3"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View className="bg-gray-900 border border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                        <Lock color="#9CA3AF" size={20} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                            className="flex-1 text-white ml-3"
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity onPress={handleStandardLogin} className="bg-orange-600 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-orange-900/40">
                    <Text className="text-white font-bold text-lg mr-2">Login</Text>
                    <ArrowRight color="white" size={20} />
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-8">
                    <View className="flex-1 h-[1px] bg-gray-800" />
                    <Text className="text-gray-500 mx-4 text-xs font-bold">OR CONTINUE WITH</Text>
                    <View className="flex-1 h-[1px] bg-gray-800" />
                </View>

                {/* 🔵 Google Button */}
                <TouchableOpacity
                    onPress={handleGoogleLogin}
                    disabled={loading}
                    className="bg-white py-3.5 rounded-2xl flex-row justify-center items-center mb-6"
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <>
                            {/* Google 'G' Icon built with Views */}
                            <View className="w-5 h-5 rounded-full border border-gray-300 items-center justify-center mr-3">
                                <Text className="text-black font-bold text-xs">G</Text>
                            </View>
                            <Text className="text-black font-bold text-base">Sign in with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignupUser')}>
                        <Text className="text-orange-500 font-bold">Sign Up</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
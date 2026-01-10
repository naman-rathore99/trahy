import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { signInWithGoogle } from '../services/googleAuth'; // ✅ Reusing Logic

export default function SignupScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);

    // Same logic as Login, because Google handles "Creation" automatically
    const handleGoogleSignup = async () => {
        setLoading(true);
        const user = await signInWithGoogle();
        setLoading(false);
        if (user) navigation.replace('Home');
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1 justify-center px-6">

                <View className="items-center mb-8">
                    <Text className="text-gray-400 text-xs font-bold tracking-[4px] uppercase mb-2">Join Us</Text>
                    <Text className="text-white text-4xl font-bold">Create Account</Text>
                </View>

                {/* Inputs */}
                <View className="space-y-4 mb-6">
                    <View className="bg-gray-900 border border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                        <User color="#9CA3AF" size={20} />
                        <TextInput
                            placeholder="Full Name"
                            placeholderTextColor="#6B7280"
                            className="flex-1 text-white ml-3"
                        />
                    </View>
                    <View className="bg-gray-900 border border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                        <Mail color="#9CA3AF" size={20} />
                        <TextInput
                            placeholder="Email Address"
                            placeholderTextColor="#6B7280"
                            className="flex-1 text-white ml-3"
                        />
                    </View>
                    <View className="bg-gray-900 border border-gray-800 rounded-2xl flex-row items-center px-4 py-4">
                        <Lock color="#9CA3AF" size={20} />
                        <TextInput
                            placeholder="Create Password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                            className="flex-1 text-white ml-3"
                        />
                    </View>
                </View>

                {/* Create Button */}
                <TouchableOpacity className="bg-blue-600 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-900/40">
                    <Text className="text-white font-bold text-lg mr-2">Create Account</Text>
                    <ArrowRight color="white" size={20} />
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-8">
                    <View className="flex-1 h-[1px] bg-gray-800" />
                    <Text className="text-gray-500 mx-4 text-xs font-bold">OR SIGN UP WITH</Text>
                    <View className="flex-1 h-[1px] bg-gray-800" />
                </View>

                {/* 🔵 Google Button (Reuse) */}
                <TouchableOpacity
                    onPress={handleGoogleSignup}
                    disabled={loading}
                    className="bg-white py-3.5 rounded-2xl flex-row justify-center items-center mb-6"
                >
                    {loading ? <ActivityIndicator color="black" /> : (
                        <>
                            <View className="w-5 h-5 rounded-full border border-gray-300 items-center justify-center mr-3">
                                <Text className="text-black font-bold text-xs">G</Text>
                            </View>
                            <Text className="text-black font-bold text-base">Sign up with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500">Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text className="text-blue-500 font-bold">Login</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
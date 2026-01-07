import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import api, { setAuthToken } from '../services/api';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert("Missing Fields", "Please enter email and password.");
        setLoading(true);

        try {
            // ✅ REAL API CALL
            // Make sure your Backend has this route: POST /api/auth/login
            const response = await api.post('/auth/login', { email, password });

            const { token, user } = response.data;

            // Save Token logic (defined in api.ts)
            await setAuthToken(token);

            Alert.alert("Success", `Welcome back, ${user.name || 'User'}!`);
            navigation.replace('Home'); // Go to Dashboard

        } catch (error: any) {
            console.log(error);
            const msg = error.response?.data?.error || "Login Failed. Check your connection.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <StatusBar style="light" />
            <LinearGradient colors={['#0F172A', '#000000']} className="flex-1 justify-center px-6">

                <View className="items-center mb-10">
                    <Text className="text-white text-4xl font-bold tracking-wider">Trav&Stay</Text>
                    <Text className="text-gray-400 text-sm mt-2">Welcome Back</Text>
                </View>

                <View className="bg-gray-900/80 border border-gray-800 p-6 rounded-3xl shadow-2xl">
                    <View className="mb-4">
                        <Text className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase">Email</Text>
                        <View className="bg-black/50 border border-gray-800 rounded-xl flex-row items-center px-4 py-3">
                            <Mail color="#64748B" size={20} />
                            <TextInput
                                placeholder="email@example.com"
                                placeholderTextColor="#475569"
                                className="flex-1 text-white ml-3 font-medium text-base"
                                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase">Password</Text>
                        <View className="bg-black/50 border border-gray-800 rounded-xl flex-row items-center px-4 py-3">
                            <Lock color="#64748B" size={20} />
                            <TextInput
                                placeholder="••••••••"
                                placeholderTextColor="#475569"
                                className="flex-1 text-white ml-3 font-medium text-base"
                                value={password} onChangeText={setPassword} secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleLogin} disabled={loading} className="bg-blue-600 rounded-xl py-4 flex-row justify-center items-center">
                        {loading ? <ActivityIndicator color="white" /> : (
                            <>
                                <Text className="text-white font-bold text-lg mr-2">Sign In</Text>
                                <ArrowRight color="white" size={20} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ✅ DUAL SIGNUP OPTIONS */}
                <View className="mt-8 items-center">
                    <Text className="text-gray-500 mb-2">Don't have an account?</Text>
                    <View className="flex-row gap-6">
                        <TouchableOpacity onPress={() => navigation.navigate('SignupUser')}>
                            <Text className="text-blue-400 font-bold border-b border-blue-400">Join as User</Text>
                        </TouchableOpacity>

                        <View className="w-[1px] h-5 bg-gray-700"></View>

                        <TouchableOpacity onPress={() => navigation.navigate('SignupPartner')}>
                            <Text className="text-purple-400 font-bold border-b border-purple-400">Join as Partner</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </LinearGradient>
        </KeyboardAvoidingView>
    );
}
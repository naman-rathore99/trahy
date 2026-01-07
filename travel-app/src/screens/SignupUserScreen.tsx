import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react-native';
import api from '../services/api';

export default function SignupUserScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password) return Alert.alert("Error", "Please fill all fields");
        setLoading(true);

        try {
            // ✅ REAL API CALL
            const response = await api.post('/auth/register', {
                name,
                email,
                phone,
                password,
                role: 'user' // 👈 IMPORTANT: Yeh User banayega
            });

            if (response.data.success) {
                Alert.alert("Success", "Account created! Please login.");
                navigation.navigate('Login');
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || "Signup Failed";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <LinearGradient colors={['#0F172A', '#000000']} className="flex-1">
                <SafeAreaView className="flex-1 px-6">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 mb-6">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="text-white text-3xl font-bold">Create User Account</Text>
                        <Text className="text-gray-400 text-sm mt-1 mb-8">Sign up to book hotels and rides</Text>

                        <View className="space-y-4 gap-4">
                            {/* Name */}
                            <View className="bg-gray-900/80 border border-gray-800 rounded-xl flex-row items-center p-4">
                                <User color="#9CA3AF" size={20} />
                                <TextInput placeholder="Full Name" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={name} onChangeText={setName} />
                            </View>

                            {/* Email */}
                            <View className="bg-gray-900/80 border border-gray-800 rounded-xl flex-row items-center p-4">
                                <Mail color="#9CA3AF" size={20} />
                                <TextInput placeholder="Email Address" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                            </View>

                            {/* Phone */}
                            <View className="bg-gray-900/80 border border-gray-800 rounded-xl flex-row items-center p-4">
                                <Phone color="#9CA3AF" size={20} />
                                <TextInput placeholder="Phone Number" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                            </View>

                            {/* Password */}
                            <View className="bg-gray-900/80 border border-gray-800 rounded-xl flex-row items-center p-4">
                                <Lock color="#9CA3AF" size={20} />
                                <TextInput placeholder="Password" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={password} onChangeText={setPassword} secureTextEntry />
                            </View>

                            <TouchableOpacity onPress={handleSignup} disabled={loading} className="bg-blue-600 p-4 rounded-xl items-center mt-4">
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Sign Up as User</Text>}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}
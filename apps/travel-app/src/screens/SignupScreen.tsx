import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react-native';

export default function SignupScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !phone || !password) return Alert.alert("Error", "All fields are required");
        setLoading(true);

        try {
            // ⏳ Simulate API Call
            await new Promise(resolve => setTimeout(resolve, 1500));
            Alert.alert("Success", "Account created! Please login.");
            navigation.navigate('Login');
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black p-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
                <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="mb-8">
                    <Text className="text-white text-3xl font-bold">Create Account</Text>
                    <Text className="text-gray-400 text-sm mt-1">Join as a partner to manage properties</Text>
                </View>

                <View className="space-y-4 gap-4">
                    {/* Name */}
                    <View className="bg-gray-900 rounded-xl flex-row items-center p-4 border border-gray-800">
                        <User color="#9CA3AF" size={20} />
                        <TextInput placeholder="Full Name" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={name} onChangeText={setName} />
                    </View>

                    {/* Email */}
                    <View className="bg-gray-900 rounded-xl flex-row items-center p-4 border border-gray-800">
                        <Mail color="#9CA3AF" size={20} />
                        <TextInput placeholder="Email Address" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    </View>

                    {/* Phone */}
                    <View className="bg-gray-900 rounded-xl flex-row items-center p-4 border border-gray-800">
                        <Phone color="#9CA3AF" size={20} />
                        <TextInput placeholder="Phone Number" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    </View>

                    {/* Password */}
                    <View className="bg-gray-900 rounded-xl flex-row items-center p-4 border border-gray-800">
                        <Lock color="#9CA3AF" size={20} />
                        <TextInput placeholder="Password" placeholderTextColor="#6B7280" className="flex-1 text-white ml-3" value={password} onChangeText={setPassword} secureTextEntry />
                    </View>

                    <TouchableOpacity onPress={handleSignup} disabled={loading} className="bg-blue-600 p-4 rounded-xl items-center mt-4">
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Sign Up</Text>}
                    </TouchableOpacity>
                </View>

                <View className="flex-row justify-center mt-6 mb-10">
                    <Text className="text-gray-500">Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text className="text-blue-500 font-bold">Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
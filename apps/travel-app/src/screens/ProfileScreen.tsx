import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // ✅ 1. Import Router Hook
import {
    ArrowLeft, User, LogOut, ChevronRight,
    ShieldCheck, HelpCircle, FileText
} from 'lucide-react-native';
import { signOut } from '../services/api';

export default function ProfileScreen() { // ❌ navigation prop hata diya
    const router = useRouter(); // ✅ 2. Initialize Router

    const handleLogout = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                        // ✅ 3. Correct way to Logout in Expo Router
                        // 'replace' use karein taaki user Back button se wapas na aa sake
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const MenuItem = ({ icon, label, onPress, isDestructive = false }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100"
        >
            <View className="flex-row items-center gap-3">
                <View className={`p-2 rounded-full ${isDestructive ? 'bg-red-50' : 'bg-gray-50'}`}>
                    {icon}
                </View>
                <Text className={`font-medium text-base ${isDestructive ? 'text-red-600' : 'text-gray-900'}`}>
                    {label}
                </Text>
            </View>
            <ChevronRight size={18} color="#D1D5DB" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SafeAreaView className="flex-1">

                {/* Header */}
                <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft color="#1F2937" size={24} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold ml-2">My Profile</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* User Card */}
                    <View className="bg-white m-4 p-5 rounded-2xl shadow-sm border border-gray-100 items-center">
                        <View className="relative">
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60' }}
                                className="w-24 h-24 rounded-full border-4 border-orange-50"
                            />
                            <View className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mt-3">Naman Rathore</Text>
                        <Text className="text-gray-500 text-sm">naman@example.com</Text>

                        <TouchableOpacity className="mt-4 bg-orange-600 px-6 py-2 rounded-full">
                            <Text className="text-white font-bold text-sm">Edit Profile</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Options */}
                    <View className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <MenuItem
                            icon={<User size={20} color="#4B5563" />}
                            label="Personal Information"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon={<FileText size={20} color="#4B5563" />}
                            label="My Bookings"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon={<ShieldCheck size={20} color="#4B5563" />}
                            label="Privacy & Security"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon={<HelpCircle size={20} color="#4B5563" />}
                            label="Help & Support"
                            onPress={() => { }}
                        />
                    </View>

                    {/* Sign Out Button */}
                    <View className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
                        <MenuItem
                            icon={<LogOut size={20} color="#DC2626" />}
                            label="Sign Out"
                            onPress={handleLogout}
                            isDestructive
                        />
                    </View>

                    <Text className="text-center text-gray-400 text-xs mb-8">
                        App Version 1.0.0 • Made with ❤️ in Mathura
                    </Text>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
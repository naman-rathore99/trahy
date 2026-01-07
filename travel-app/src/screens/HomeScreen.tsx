import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Building2, Car, Plus } from 'lucide-react-native';

export default function HomeScreen({ navigation }: any) {
    return (
        <SafeAreaView className="flex-1 bg-black p-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <View>
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Dashboard</Text>
                    <Text className="text-white text-2xl font-bold">Hello, Partner</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.replace('Login')} className="bg-gray-800 p-2 rounded-lg">
                    <LogOut color="#EF4444" size={20} />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View className="flex-row gap-4 mb-8">
                <View className="flex-1 bg-blue-900/20 p-4 rounded-2xl border border-blue-800">
                    <Building2 color="#60A5FA" size={24} />
                    <Text className="text-white text-2xl font-bold mt-2">1</Text>
                    <Text className="text-blue-200 text-xs">Active Hotels</Text>
                </View>
                <View className="flex-1 bg-gray-900 p-4 rounded-2xl border border-gray-800">
                    <Car color="#9CA3AF" size={24} />
                    <Text className="text-white text-2xl font-bold mt-2">0</Text>
                    <Text className="text-gray-400 text-xs">Vehicles</Text>
                </View>
            </View>

            {/* Action Section */}
            <Text className="text-white text-lg font-bold mb-4">Quick Actions</Text>
            <TouchableOpacity className="flex-row items-center bg-gray-900 p-4 rounded-xl border border-gray-800 mb-4">
                <View className="bg-blue-600 p-2 rounded-lg mr-4">
                    <Plus color="white" size={20} />
                </View>
                <View>
                    <Text className="text-white font-bold">Add New Property</Text>
                    <Text className="text-gray-400 text-xs">List a hotel or homestay</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center bg-gray-900 p-4 rounded-xl border border-gray-800">
                <View className="bg-purple-600 p-2 rounded-lg mr-4">
                    <Plus color="white" size={20} />
                </View>
                <View>
                    <Text className="text-white font-bold">Register Vehicle</Text>
                    <Text className="text-gray-400 text-xs">Add a cab or bike</Text>
                </View>
            </TouchableOpacity>

        </SafeAreaView>
    );
}
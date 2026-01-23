import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* 1. Header & Profile Card */}
        <View className="px-6 pt-4 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">My Profile</Text>
          <View className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex-row items-center">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop' }} 
              className="w-16 h-16 rounded-full border-2 border-gray-100"
            />
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-gray-900">Naman Rathore</Text>
              <Text className="text-gray-500 text-sm">naman@shubhyatra.com</Text>
            </View>
            <TouchableOpacity className="bg-orange-50 p-2 rounded-full">
              <Feather name="edit-2" size={20} color="#FF5A1F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Active Services (Vehicle Bookings) */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Active Services</Text>

          {/* Hotel Booking Card */}
          <View className="bg-white p-4 rounded-2xl mb-3 border border-gray-200 shadow-sm flex-row">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070' }}
              className="w-16 h-16 rounded-xl bg-gray-200"
            />
            <View className="ml-3 flex-1 justify-center">
              <Text className="font-bold text-gray-900 text-base">Hotel Madhuvan</Text>
              <Text className="text-primary text-xs font-bold">Check-in Today</Text>
            </View>
            <View className="justify-center">
               <View className="bg-green-100 px-3 py-1 rounded-full">
                 <Text className="text-green-700 text-xs font-bold">Confirmed</Text>
               </View>
            </View>
          </View>

          {/* Vehicle Service Card */}
          <View className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-row">
            <View className="w-16 h-16 rounded-xl bg-orange-50 items-center justify-center">
               <MaterialCommunityIcons name="car-sports" size={32} color="#FF5A1F" />
            </View>
            <View className="ml-3 flex-1 justify-center">
              <Text className="font-bold text-gray-900 text-base">Pickup Cab (SUV)</Text>
              <Text className="text-gray-500 text-xs">Driver: Rajesh Kumar • 4:30 PM</Text>
            </View>
            <View className="justify-center">
               <View className="bg-blue-100 px-3 py-1 rounded-full">
                 <Text className="text-blue-700 text-xs font-bold">On Way</Text>
               </View>
            </View>
          </View>
        </View>

        {/* 3. Settings List */}
        <View className="px-6 mt-2">
          <Text className="text-lg font-bold text-gray-900 mb-4">Preferences</Text>
          <View className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <SettingItem icon="credit-card" title="Payment Methods" value="Visa **42" />
            <SettingItem icon="users" title="Co-Travelers" value="2 Added" />
            <SettingItem icon="bell" title="Notifications" hasSwitch value={true} />
            <SettingItem icon="shield" title="Privacy & Security" />
            <SettingItem icon="help-circle" title="Help & Support" />
            
            <TouchableOpacity 
              onPress={() => router.replace('/auth/login')}
              className="flex-row items-center justify-between p-4 bg-red-50 border-t border-red-100"
            >
              <View className="flex-row items-center">
                <Feather name="log-out" size={18} color="#EF4444" />
                <Text className="text-red-600 font-bold text-base ml-3">Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ icon, title, hasSwitch, value }: any) {
  return (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-50">
      <View className="flex-row items-center">
        <Feather name={icon} size={18} color="#4B5563" />
        <Text className="text-gray-700 font-medium text-base ml-3">{title}</Text>
      </View>
      {hasSwitch ? (
        <Switch trackColor={{ false: '#E5E7EB', true: '#FF5A1F' }} value={value} />
      ) : (
        <View className="flex-row items-center">
           {value && <Text className="text-gray-400 mr-2 text-sm">{value}</Text>}
           <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      )}
    </View>
  );
}
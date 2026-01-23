import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const BOOKINGS = [
  { id: '1', type: 'hotel', name: 'Hotel Royal Palace', date: '12 Oct - 14 Oct', status: 'Completed', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070' },
  { id: '2', type: 'vehicle', name: 'Airport Drop (Sedan)', date: '14 Oct, 10:00 AM', status: 'Scheduled', icon: 'car' },
  { id: '3', type: 'hotel', name: 'Shubham Grand', date: '20 Nov - 22 Nov', status: 'Upcoming', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2050' },
];

export default function BookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-6">
      <View className="mt-4 mb-6">
        <Text className="text-2xl font-bold text-gray-900">My Trips</Text>
        <Text className="text-gray-500">Manage your stays and rides</Text>
      </View>

      <View className="flex-row mb-6 bg-gray-200 p-1 rounded-xl">
        <TouchableOpacity className="flex-1 bg-white py-2 rounded-lg shadow-sm items-center">
          <Text className="font-bold text-gray-900">Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 py-2 rounded-lg items-center">
          <Text className="font-medium text-gray-500">History</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={BOOKINGS}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white p-4 rounded-2xl mb-4 border border-gray-100 shadow-sm flex-row">
            {item.type === 'hotel' ? (
              <Image source={{ uri: item.image }} className="w-20 h-20 rounded-xl bg-gray-200" />
            ) : (
              <View className="w-20 h-20 rounded-xl bg-orange-50 items-center justify-center">
                <MaterialCommunityIcons name="car" size={32} color="#FF5A1F" />
              </View>
            )}
            
            <View className="ml-4 flex-1 justify-between py-1">
              <View>
                <View className="flex-row justify-between items-start">
                   <Text className="font-bold text-gray-900 text-lg flex-1 mr-2" numberOfLines={1}>{item.name}</Text>
                   <StatusBadge status={item.status} />
                </View>
                <Text className="text-gray-500 text-sm mt-1">{item.date}</Text>
              </View>
              
              <View className="flex-row items-center mt-2">
                <Text className="text-primary font-bold text-sm">View Details</Text>
                <Feather name="arrow-right" size={14} color="#FF5A1F" className="ml-1" />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = 'bg-gray-100 text-gray-600';
  if (status === 'Upcoming' || status === 'Scheduled') color = 'bg-blue-100 text-blue-700';
  if (status === 'Completed') color = 'bg-green-100 text-green-700';
  
  const [bg, text] = color.split(' ');
  return (
    <View className={`${bg} px-2 py-1 rounded-md`}>
      <Text className={`${text} text-[10px] font-bold uppercase`}>{status}</Text>
    </View>
  );
}
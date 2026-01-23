import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const VEHICLE_DATA = [
  { 
    id: '1', 
    name: 'Suzuki Dzire', 
    type: 'Cab', 
    category: 'Sedan',
    price: '₹2,000', 
    seats: 4, 
    ac: true,
    image: 'https://imgd.aeplcdn.com/370x208/n/cw/ec/45691/dzire-exterior-right-front-three-quarter-3.jpeg?q=80',
    tags: ['Best Seller', 'AC']
  },
  { 
    id: '2', 
    name: 'Toyota Innova', 
    type: 'SUV', 
    category: 'Luxury',
    price: '₹3,500', 
    seats: 7, 
    ac: true,
    image: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/140809/innova-crysta-exterior-right-front-three-quarter-2.jpeg?q=80',
    tags: ['Family Choice']
  },
  { 
    id: '3', 
    name: 'Auto Rickshaw', 
    type: 'Auto', 
    category: 'Budget',
    price: '₹800', 
    seats: 3, 
    ac: false,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Bajaj_RE_Auto_Rickshaw_in_Pune.jpg/1200px-Bajaj_RE_Auto_Rickshaw_in_Pune.jpg',
    tags: ['Cheapest']
  },
  { 
    id: '4', 
    name: 'Royal Enfield', 
    type: 'Bike', 
    category: '2-Wheeler',
    price: '₹600', 
    seats: 2, 
    ac: false,
    image: 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/124013/hunter-350-right-front-three-quarter.jpeg?q=80',
    tags: ['Self Drive']
  },
];

const FILTERS = ['All', 'Cab', 'SUV', 'Auto', 'Bike'];

// THIS IS THE LINE THAT WAS LIKELY MISSING OR BROKEN
export default function VehiclesScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredData = activeFilter === 'All' 
    ? VEHICLE_DATA 
    : VEHICLE_DATA.filter(v => v.type === activeFilter);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-2 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Rent a Vehicle</Text>
        <Text className="text-gray-500">Choose the best ride for your journey</Text>
      </View>

      <View className="mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setActiveFilter(filter)}
              className={`mr-3 px-5 py-2.5 rounded-full border ${activeFilter === filter ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
            >
              <Text className={`font-bold ${activeFilter === filter ? 'text-white' : 'text-gray-600'}`}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl mb-5 shadow-sm border border-gray-100 overflow-hidden">
            <View className="relative">
              <Image source={{ uri: item.image }} className="w-full h-44" resizeMode="cover" />
              <View className="absolute top-3 left-3 flex-row gap-2">
                {item.tags.map(tag => (
                   <View key={tag} className="bg-white/90 px-2 py-1 rounded-md backdrop-blur-md">
                     <Text className="text-[10px] font-bold text-gray-800 uppercase">{tag}</Text>
                   </View>
                ))}
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                  <Text className="text-gray-500 text-xs">{item.category}</Text>
                </View>
                <View className="items-end">
                   <Text className="text-primary text-xl font-bold">{item.price}</Text>
                   <Text className="text-gray-400 text-[10px]">/ day</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4 py-3 border-t border-gray-50 mt-2">
                <View className="flex-row items-center">
                   <Ionicons name="people" size={16} color="#6B7280" />
                   <Text className="text-gray-500 text-xs ml-1.5">{item.seats} Seats</Text>
                </View>
                <View className="flex-row items-center">
                   <MaterialCommunityIcons name={item.ac ? "air-conditioner" : "wind-power"} size={16} color="#6B7280" />
                   <Text className="text-gray-500 text-xs ml-1.5">{item.ac ? "AC" : "Non-AC"}</Text>
                </View>
                <View className="flex-row items-center">
                   <Ionicons name="speedometer" size={16} color="#6B7280" />
                   <Text className="text-gray-500 text-xs ml-1.5">Unlimited km</Text>
                </View>
              </View>

              <TouchableOpacity className="bg-gray-900 w-full py-3.5 rounded-xl items-center mt-2 active:bg-gray-800">
                <Text className="text-white font-bold">Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
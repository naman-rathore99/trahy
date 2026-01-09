import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function YatraScreen({ navigation }: any) {
    return (
        <View className="flex-1 bg-black justify-center items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-12 left-6 bg-gray-900 p-2 rounded-full">
                <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Cab Booking Coming Soon!</Text>
        </View>
    );
}
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
export default function YatraScreen({ navigation }: any) {
    return (
        <View className="flex-1 bg-white justify-center items-center">
            <Text>Yatra Page (Cabs)</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text className="text-blue-500 mt-4">Go Back</Text></TouchableOpacity>
        </View>
    );
}
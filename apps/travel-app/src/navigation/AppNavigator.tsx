import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SignupUserScreen from '../screens/SignupUserScreen';
import HomeScreen from '../screens/HomeScreen'; // ✅ Import hai
import StaysScreen from '../screens/StaysScreen';
import RentalsScreen from '../screens/RentalsScreen';
import YatraScreen from '../screens/YatraScreen';
import HotelDetailsScreen from '../screens/HotelDetailsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignupPartner" component={SignupScreen} />
                <Stack.Screen name="SignupUser" component={SignupUserScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="HotelDetails" component={HotelDetailsScreen} />
                <Stack.Screen name="Stays" component={StaysScreen} />
                <Stack.Screen name="Rentals" component={RentalsScreen} />
                <Stack.Screen name="Yatra" component={YatraScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
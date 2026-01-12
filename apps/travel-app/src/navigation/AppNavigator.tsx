// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// // ✅ Import All Screens
// import LoginScreen from '../screens/LoginScreen';
// import SignupScreen from '../screens/SignupScreen';
// import HomeScreen from '../screens/HomeScreen';
// import StaysScreen from '../screens/StaysScreen';
// import HotelDetailsScreen from '../screens/HotelDetailsScreen';
// import RentalsScreen from '../screens/RentalsScreen';
// import ProfileScreen from '../screens/ProfileScreen'; // 👈 Import This

// const Stack = createNativeStackNavigator();

// export default function AppNavigator() {
//     return (
//         <NavigationContainer>
//             <Stack.Navigator screenOptions={{ headerShown: false }}>

//                 {/* Auth Screens */}
//                 <Stack.Screen name="Login" component={LoginScreen} />
//                 <Stack.Screen name="SignupUser" component={SignupScreen} />

//                 {/* Main App Screens */}
//                 <Stack.Screen name="Home" component={HomeScreen} />
//                 <Stack.Screen name="Stays" component={StaysScreen} />
//                 <Stack.Screen name="HotelDetails" component={HotelDetailsScreen} />
//                 <Stack.Screen name="Rentals" component={RentalsScreen} />

//                 {/* ✅ REGISTER PROFILE SCREEN HERE */}
//                 <Stack.Screen name="Profile" component={ProfileScreen} />

//             </Stack.Navigator>
//         </NavigationContainer>
//     );
// }
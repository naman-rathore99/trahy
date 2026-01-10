import { Tabs } from 'expo-router';
import { Home, BedDouble, Car, User } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false, // Upar wala default header hatane ke liye
                tabBarActiveTintColor: '#E11D48', // Active color (Rose-600)
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
            }}
        >
            {/* 1. Home Tab */}
            <Tabs.Screen
                name="home" // File: home.tsx
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />

            {/* 2. Stays (Hotels) Tab */}
            <Tabs.Screen
                name="stays" // File: stays.tsx
                options={{
                    title: 'Hotels', // ✅ Yahan naam 'Hotels' karein
                    tabBarIcon: ({ color }) => <BedDouble size={24} color={color} />,
                }}
            />

            {/* 3. Vehicles (Rentals) Tab */}
            <Tabs.Screen
                name="vehicles" // File: vehicles.tsx
                options={{
                    title: 'Rentals', // ✅ Yahan naam 'Rentals' ya 'Vehicles' karein
                    tabBarIcon: ({ color }) => <Car size={24} color={color} />,
                }}
            />

            {/* 4. Profile Tab */}
            <Tabs.Screen
                name="profile" // File: profile.tsx
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
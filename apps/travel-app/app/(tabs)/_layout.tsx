import { Tabs } from 'expo-router';
import { Home, BedDouble, Car, User, Search } from 'lucide-react-native';
import { View, Text, Platform } from 'react-native';

export default function TabLayout() {

    // 💎 Custom "Expanding Pill" Component
    const TabIcon = ({ icon: Icon, label, focused }: any) => {
        return (
            <View
                className={`flex-row items-center  justify-center rounded-full py-5 px-5 transition-all ${focused ? 'bg-[#6366f1]' : 'bg-transparent'
                    }`}
                style={{ gap: 8 }} // Gap between icon and text
            >
                {/* Icon */}
                <Icon
                    size={22}
                    color={focused ? 'white' : '#94a3b8'} // White if active, Gray if inactive
                    strokeWidth={focused ? 2.5 : 2}
                />

                {/* Label (Only shows when focused) */}
                {focused && (
                    <Text className="text-white text-xs font-bold tracking-wide">
                        {label}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false, // Hide default system labels

                // 🌑 DARK FLOATING BAR CONTAINER
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 25,
                    left: 20,
                    right: 20,
                    backgroundColor: '#1e293b', // Premium Dark Slate
                    borderRadius: 40,          // Fully rounded capsule edges
                    height: 80,                // Taller for better touch targets
                    borderTopWidth: 0,         // Remove ugly top line

                    // Shadows for Depth
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,

                    paddingBottom: 0, // Center items vertically
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            }}
        >
            {/* 1. Home */}
            <Tabs.Screen
                name="home"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={Home} label="Home" focused={focused} />
                    ),
                }}
            />

            {/* 2. Stays (Hotels) */}
            <Tabs.Screen
                name="stays"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={BedDouble} label="Stays" focused={focused} />
                    ),
                }}
            />

            {/* 3. Vehicles (Rentals) */}
            <Tabs.Screen
                name="vehicles"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={Car} label="Ride" focused={focused} />
                    ),
                }}
            />

            {/* 4. Profile */}
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={User} label="Profile" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}
import { Tabs } from 'expo-router';
import { Home, BedDouble, Car, User } from 'lucide-react-native';
import { View, Text, Platform, LayoutAnimation, UIManager, TouchableOpacity } from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function TabIcon({
    icon: Icon,
    label,
    focused,
}: {
    icon: any
    label: string
    focused: boolean
}) {
    // 🪄 MAGIC SAUCE: This line creates the smooth sliding effect
    if (focused) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 30,
                paddingVertical: 8,
                paddingHorizontal: 12,
                // 🎨 Sophisticated Active State: Very light gray bg for subtle contrast
                backgroundColor: focused ? '#F3F4F6' : 'transparent',
                minWidth: focused ? 100 : 50, // Smoothly animates between these widths
            }}
        >
            {/* Icon */}
            <View style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? '#E11D48' : 'transparent', // Icon circle bg
                borderRadius: 16,
            }}>
                <Icon
                    size={20}
                    // Active: White icon on Rose circle. Inactive: Gray icon.
                    color={focused ? '#FFFFFF' : '#94A3B8'}
                    strokeWidth={focused ? 2.5 : 2}
                />
            </View>

            {/* Label - Only renders when focused */}
            {focused && (
                <Text
                    numberOfLines={1}
                    style={{
                        marginLeft: 8,
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#1F2937', // Dark Gray text
                    }}
                >
                    {label}
                </Text>
            )}
        </View>
    )
}

/* -----------------------------
   Tabs Layout
------------------------------*/
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,

                // 💎 FLOATING BAR CONTAINER
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 30 : 20,
                    left: 20,
                    right: 20,
                    height: 65, // Tighter height for a sleeker look
                    borderRadius: 35,
                    backgroundColor: '#ffffff',

                    // 🌑 Subtle, Expensive-looking Shadow
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.1, // Lighter opacity
                    shadowRadius: 15,   // Bigger spread (softer)
                    elevation: 10,

                    borderTopWidth: 0, // Removes ugly line
                    paddingBottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                },

                // Centers content vertically
                tabBarItemStyle: {
                    height: 65,
                    padding: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon={Home} label="Home" focused={focused} />,
                }}
            />

            <Tabs.Screen
                name="stays"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon={BedDouble} label="Stays" focused={focused} />,
                }}
            />

            <Tabs.Screen
                name="vehicles"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon={Car} label="Rentals" focused={focused} />,
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon={User} label="Profile" focused={focused} />,
                }}
            />
        </Tabs>
    )
}
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabBarBackground() {
  // On iOS, we use the BlurView to get that nice frosted glass effect
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint="systemChromeMaterialDark"
        intensity={100}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  // On Android, we return a solid background matching your Dark Theme (#111827)
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111827' }]} />
  );
}

// This utility is sometimes used by the template for calculating scroll offsets
export function useBottomTabOverflow() {
  return 0;
}
import { Redirect } from 'expo-router';
import '../global.css';
export default function Index() {
  // As soon as the app opens, go to the Home Tab
  return <Redirect href="./(tabs)/home" />;
}
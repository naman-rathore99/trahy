import { GoogleSignin, statusCodes, isErrorWithCode, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚙️ CONFIGURATION
GoogleSignin.configure({
    // ⚠️ Get this from Firebase Console > Authentication > Sign-in method > Google > Web Client ID
    webClientId: 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE.apps.googleusercontent.com',
    offlineAccess: true,
});

export const signInWithGoogle = async () => {
    try {
        // 1. Check Play Services
        await GoogleSignin.hasPlayServices();

        // 2. Prompt User
        const response = await GoogleSignin.signIn();

        // ✅ FIX: Check if response has data (New Architecture)
        if (isSuccessResponse(response)) {
            const { idToken, user } = response.data;

            // 3. Save User to Local Storage
            // Note: idToken can be null, handle fallback
            await AsyncStorage.setItem('userToken', idToken || 'dummy-google-token');
            await AsyncStorage.setItem('userInfo', JSON.stringify(user));

            return response.data;
        } else {
            // Handle case where sign-in was not successful (e.g. cancelled flow)
            return null;
        }

    } catch (error: any) {
        if (isErrorWithCode(error)) {
            switch (error.code) {
                case statusCodes.SIGN_IN_CANCELLED:
                    console.log("User cancelled login");
                    break;
                case statusCodes.IN_PROGRESS:
                    console.log("Sign in is in progress");
                    break;
                case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                    Alert.alert("Error", "Google Play Services not available");
                    break;
                default:
                    console.error("Google Signin Error:", error);
                    Alert.alert("Error", "Login Failed. Please try again.");
            }
        } else {
            // Generic error
            console.error("Unknown Error:", error);
            Alert.alert("Error", "An unexpected error occurred.");
        }
        return null;
    }
};

export const logoutGoogle = async () => {
    try {
        await GoogleSignin.signOut();
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
    } catch (error) {
        console.error("Logout Error:", error);
    }
};
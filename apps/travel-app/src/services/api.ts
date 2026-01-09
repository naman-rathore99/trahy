import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Use 10.0.2.2 for Android Emulator, localhost for iOS
export const API_URL = "http://10.0.2.2:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor for Auth Token
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper to Save Token
export const setAuthToken = async (token: string | null) => {
    if (token) {
        await AsyncStorage.setItem('userToken', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        await AsyncStorage.removeItem('userToken');
        delete api.defaults.headers.common['Authorization'];
    }
};

// ✅ API Functions
export const getStays = async () => {
    try {
        const response = await api.get('/stays');
        return response.data;
    } catch (error) {
        console.error("API Error (Stays):", error);
        throw error;
    }
};

export const getVehicles = async () => {
    try {
        const response = await api.get('/vehicle'); // Singular 'vehicle' route
        return response.data;
    } catch (error) {
        console.error("API Error (Vehicles):", error);
        throw error;
    }
};

export default api;
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ✅ SMART URL: Switches automatically based on device
const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return "http://192.168.29.191:3000/api"; // Your IP
    }
    return "http://localhost:3000/api"; // Web/iOS
};

export const API_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ 1. Interceptor: Adds token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ 2. Helper: Manually save/remove token
export const setAuthToken = async (token: string | null) => {
    if (token) {
        await AsyncStorage.setItem('userToken', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        await AsyncStorage.removeItem('userToken');
        delete api.defaults.headers.common['Authorization'];
    }
};

// API Functions
export const getStays = async () => {
    const response = await api.get('/stays');
    return response.data;
};

export const getVehicles = async () => {
    const response = await api.get('/vehicle');
    return response.data;
};

export default api;
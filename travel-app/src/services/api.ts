import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const API_URL = "http://10.0.2.2:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ INTERCEPTOR: Automatically adds the Token to every request
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✅ HELPER: Function to Save/Remove Token (Use this on Login/Logout)
export const setAuthToken = async (token: string | null) => {
    if (token) {
        // Login: Save token and set header
        await AsyncStorage.setItem('userToken', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        // Logout: Clear token and remove header
        await AsyncStorage.removeItem('userToken');
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
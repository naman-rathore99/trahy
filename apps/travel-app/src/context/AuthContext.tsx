import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api'; // Import from your api file

type AuthContextType = {
    isLoading: boolean;
    userToken: string | null;
    login: (token: string) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);

    // ✅ CHECK LOGIN STATUS ON APP START
    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                setUserToken(token);
                // Also update API headers immediately
                setAuthToken(token);
            }
        } catch (e) {
            console.log(`Login Status Error: ${e}`);
        } finally {
            setIsLoading(false); // Stop loading screen
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    // ✅ LOGIN FUNCTION
    const login = async (token: string) => {
        setIsLoading(true);
        setUserToken(token);
        await setAuthToken(token); // Save to storage
        setIsLoading(false);
    };

    // ✅ LOGOUT FUNCTION
    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        await setAuthToken(null); // Clear from storage
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ isLoading, userToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
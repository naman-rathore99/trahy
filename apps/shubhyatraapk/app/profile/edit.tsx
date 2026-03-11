import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

export default function EditProfileScreen() {
  const router = useRouter();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Form Data
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
  });

  // 1. Fetch User Data on Load
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Get Firestore Data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        setForm({
          name: user.displayName || "",
          email: user.email || "", // Email is read-only usually
          phone: userData.phone || "",
          location: userData.location || "",
          bio: userData.bio || ""
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, []);

  // 2. Handle Save
  const handleSave = async () => {
    if (!form.name) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;

    if (!user) return;

    try {
      // A. Update Auth Profile (Display Name)
      if (user.displayName !== form.name) {
        await updateProfile(user, { displayName: form.name });
      }

      // B. Update Firestore (Phone, Bio, Location)
      await updateDoc(doc(db, "users", user.uid), {
        displayName: form.name,
        phone: form.phone,
        location: form.location,
        bio: form.bio,
        updatedAt: new Date().toISOString()
      });

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      
    } catch (error: any) {
      console.error("Update Error:", error);
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable Input Component
  const renderInput = (label: string, key: keyof typeof form, icon: any, keyboard: any = "default", multiline = false, editable = true) => (
    <View className="mb-5">
      <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{label}</Text>
      
      <View 
        className={`flex-row items-center bg-gray-50 dark:bg-gray-800 border rounded-2xl px-4 ${
          focusedInput === key 
            ? "border-[#FF5A1F] bg-orange-50/10 dark:bg-orange-900/10" 
            : "border-gray-100 dark:border-gray-700"
        } ${multiline ? "h-24 items-start py-3" : "h-14"} ${!editable ? "opacity-60 bg-gray-100 dark:bg-gray-900" : ""}`}
      >
        <Ionicons 
            name={icon} 
            size={20} 
            color={focusedInput === key ? "#FF5A1F" : "#9CA3AF"} 
            style={{ marginTop: multiline ? 2 : 0 }}
        />
        <TextInput 
          value={form[key]}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
          onFocus={() => setFocusedInput(key)}
          onBlur={() => setFocusedInput(null)}
          keyboardType={keyboard}
          multiline={multiline}
          editable={editable}
          placeholder={`Enter your ${label.toLowerCase()}`}
          className={`flex-1 ml-3 text-gray-900 dark:text-white font-semibold text-base ${multiline ? "h-full" : ""}`}
          placeholderTextColor="#9CA3AF"
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
    </View>
  );

  if (isFetching) {
      return (
          <View className="flex-1 bg-white dark:bg-gray-900 justify-center items-center">
              <ActivityIndicator size="large" color="#FF5A1F" />
          </View>
      );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <StatusBar style="light" />

      {/* Top Orange Header */}
      <View className="h-48 bg-[#FF5A1F] absolute top-0 left-0 right-0 rounded-b-[40px] z-0" />

      <SafeAreaView className="flex-1">
        {/* Header Bar */}
        <View className="px-6 py-2 flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full justify-center items-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Edit Profile</Text>
          <View className="w-10" /> 
        </View>

        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            className="flex-1"
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* Profile Picture */}
                <View className="items-center mt-6 mb-2">
                    <View className="relative shadow-xl shadow-black/50">
                        <Image
                            source={{ uri: auth.currentUser?.photoURL || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop" }}
                            className="w-32 h-32 rounded-full border-[5px] border-white dark:border-gray-900"
                        />
                        <TouchableOpacity 
                            onPress={() => Alert.alert("Coming Soon", "Photo upload will be added in the next update.")}
                            className="absolute bottom-1 right-1 bg-gray-900 dark:bg-black p-2.5 rounded-full border-[3px] border-white dark:border-gray-900"
                        >
                            <Ionicons name="camera" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form Container */}
                <View className="bg-white dark:bg-gray-900 mx-6 mt-4 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    {renderInput("Full Name", "name", "person-outline")}
                    {renderInput("Email Address", "email", "mail-outline", "email-address", false, false)} {/* Email Disabled */}
                    {renderInput("Phone Number", "phone", "call-outline", "phone-pad")}
                    {renderInput("Location", "location", "location-outline")}
                    {renderInput("Bio", "bio", "information-circle-outline", "default", true)}
                </View>

                {/* Save Button */}
                <View className="px-6 mt-6">
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={isLoading}
                        className={`h-14 rounded-2xl justify-center items-center shadow-lg shadow-orange-200 dark:shadow-none flex-row ${isLoading ? 'bg-orange-300' : 'bg-[#FF5A1F]'}`}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator size="small" color="white" />
                                <Text className="text-white font-bold text-lg ml-2">Saving...</Text>
                            </>
                        ) : (
                            <Text className="text-white font-bold text-lg">Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

export default function EditProfileScreen() {
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Image States
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLocalImage, setIsLocalImage] = useState(false); // 🚨 Tracks if the image needs to be uploaded

  // Form Data
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });

  // Cloudinary Credentials
  const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // 1. Fetch User Data on Load
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        setProfileImage(
          user.photoURL ||
            "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
        );
        setForm({
          name: user.displayName || "",
          email: user.email || "",
          phone: userData.phone || "",
          location: userData.location || "",
          bio: userData.bio || "",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, []);

  // 2. Open Gallery and Preview Image
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to change your profile picture.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square crop for profiles
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri); // Show local preview
      setIsLocalImage(true); // Flag that this is a new image needing upload
    }
  };

  // 3. Handle Save (Upload Image THEN Update Firebase)
  const handleSave = async () => {
    if (!form.name) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      let finalImageUrl = profileImage;

      // Step A: Upload to Cloudinary ONLY if they selected a new image
      if (isLocalImage && profileImage) {
        const data = new FormData();
        data.append("file", {
          uri: profileImage,
          type: "image/jpeg",
          name: `profile_${user.uid}_${Date.now()}.jpg`,
        } as any);

        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "");
        data.append("cloud_name", CLOUDINARY_CLOUD_NAME || "");

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

        const cloudinaryResponse = await fetch(cloudinaryUrl, {
          method: "POST",
          body: data,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        });

        const cloudinaryResult = await cloudinaryResponse.json();

        if (!cloudinaryResult.secure_url) {
          throw new Error("Cloudinary upload failed");
        }

        finalImageUrl = cloudinaryResult.secure_url; // Update to the live web link!
      }

      // Step B: Update Firebase Auth Profile (Display Name & Photo URL)
      const authUpdates: any = {};
      if (user.displayName !== form.name) authUpdates.displayName = form.name;
      if (isLocalImage) authUpdates.photoURL = finalImageUrl;

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(user, authUpdates);
      }

      // Step C: Update Firestore Database Document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: form.name,
        phone: form.phone,
        location: form.location,
        bio: form.bio,
        ...(isLocalImage && { photoUrl: finalImageUrl }), // Only update if new image
        updatedAt: new Date().toISOString(),
      });

      // Reset local image flag since it's now synced with the cloud
      setIsLocalImage(false);

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Update Error:", error);
      Alert.alert("Error", "Could not update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable Input Component
  const renderInput = (
    label: string,
    key: keyof typeof form,
    icon: any,
    keyboard: any = "default",
    multiline = false,
    editable = true,
  ) => (
    <View className="mb-5">
      <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
        {label}
      </Text>

      <View
        className={`flex-row items-center bg-gray-50 dark:bg-gray-800 border rounded-2xl px-4 ${
          focusedInput === key
            ? "border-[#FF5A1F] bg-orange-50/10 dark:bg-orange-900/10"
            : "border-gray-100 dark:border-gray-700"
        } ${multiline ? "h-24 items-start py-3" : "h-14"} ${
          !editable ? "opacity-60 bg-gray-100 dark:bg-gray-900" : ""
        }`}
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
          className={`flex-1 ml-3 text-gray-900 dark:text-white font-semibold text-base ${
            multiline ? "h-full" : ""
          }`}
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

      {/* Top Orange Header Background */}
      <View className="h-48 bg-[#FF5A1F] absolute top-0 left-0 right-0 rounded-b-[40px] z-0" />

      <SafeAreaView className="flex-1">
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Profile Picture */}
            <View className="items-center mt-6 mb-2">
              <View className="relative shadow-xl shadow-black/50">
                <Image
                  source={{ uri: profileImage as string }}
                  className="w-32 h-32 rounded-full border-[5px] border-white dark:border-gray-900"
                />
                <TouchableOpacity
                  onPress={pickImage}
                  className="absolute bottom-1 right-1 bg-gray-900 dark:bg-black p-2.5 rounded-full border-[3px] border-white dark:border-gray-900"
                >
                  <Ionicons name="camera" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Container */}
            <View className="bg-white dark:bg-gray-900 mx-6 mt-4 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              {renderInput("Full Name", "name", "person-outline")}
              {renderInput(
                "Email Address",
                "email",
                "mail-outline",
                "email-address",
                false,
                false,
              )}
              {renderInput(
                "Phone Number",
                "phone",
                "call-outline",
                "phone-pad",
              )}
              {renderInput("Location", "location", "location-outline")}
              {renderInput(
                "Bio",
                "bio",
                "information-circle-outline",
                "default",
                true,
              )}
            </View>

            {/* Save Button */}
            <View className="px-6 mt-6">
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                className={`h-14 rounded-2xl justify-center items-center shadow-lg flex-row ${
                  isLoading
                    ? "bg-orange-300 shadow-none"
                    : "bg-[#FF5A1F] shadow-orange-200 dark:shadow-none"
                }`}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold text-lg ml-2">
                      Saving...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

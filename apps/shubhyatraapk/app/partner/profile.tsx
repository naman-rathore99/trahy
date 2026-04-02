import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

export default function PartnerProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Track original phone to detect changes
  const [originalPhone, setOriginalPhone] = useState("");

  // Image State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLocalImage, setIsLocalImage] = useState(false);

  // OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");

  const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // 1. Fetch Partner Data
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          await user.reload();

          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setBusinessName(data.businessName || "");
            setOwnerName(user.displayName || "");
            setPhone(data.phone || "");
            setOriginalPhone(data.phone || ""); // Save the baseline phone number
            setAddress(data.address || "");
            setProfileImage(user.photoURL || null);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setIsFetching(false);
        }
      };

      fetchProfile();
    }, []),
  );

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Allow access to photos to change your business logo.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setIsLocalImage(true);
    }
  };

  // 2. Intercept the Save Click
  const handleSaveClick = async () => {
    if (!businessName || !phone) {
      Alert.alert("Error", "Business Name and Phone are required.");
      return;
    }

    // If the phone changed, trigger the Email OTP flow!
    if (phone !== originalPhone) {
      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      setExpectedOtp(generatedOtp);

      // TODO: Replace this with your backend trigger to send email
      console.log(`Sending OTP ${generatedOtp} to ${auth.currentUser?.email}`);
      Alert.alert(
        "Developer Mock",
        `An OTP was sent to your email. (Mock OTP: ${generatedOtp})`,
      );

      setShowOtpModal(true);
    } else {
      // Phone didn't change, just save normally
      performFinalSave();
    }
  };

  // 3. Verify OTP
  const verifyOtp = () => {
    if (otpInput === expectedOtp) {
      setShowOtpModal(false);
      setOtpInput("");
      performFinalSave(); // OTP passed, finalize the save!
    } else {
      Alert.alert(
        "Invalid OTP",
        "The code you entered is incorrect. Please try again.",
      );
    }
  };

  // 4. The Actual Save Logic (Cloudinary + Firestore)
  const performFinalSave = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      let finalImageUrl = profileImage;

      if (isLocalImage && profileImage) {
        const data = new FormData();
        data.append("file", {
          uri: profileImage,
          type: "image/jpeg",
          name: `partner_${user.uid}_${Date.now()}.jpg`,
        } as any);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "");
        data.append("cloud_name", CLOUDINARY_CLOUD_NAME || "");

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: data,
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const cloudinaryResult = await cloudinaryResponse.json();
        if (!cloudinaryResult.secure_url)
          throw new Error("Cloudinary upload failed");
        finalImageUrl = cloudinaryResult.secure_url;
      }

      if (isLocalImage && finalImageUrl) {
        await updateProfile(user, { photoURL: finalImageUrl });
      }

      await updateDoc(doc(db, "users", user.uid), {
        businessName,
        phone,
        address,
        ...(isLocalImage && { photoUrl: finalImageUrl }),
        updatedAt: new Date().toISOString(),
      });

      setOriginalPhone(phone); // Update baseline phone
      setIsLocalImage(false);
      Alert.alert("Success", "Business profile updated successfully!");
    } catch (error) {
      console.error("Save Error:", error);
      Alert.alert("Error", "Could not save changes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your business account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/auth/login" as any);
            } catch (error) {
              console.error("Logout Error:", error);
            }
          },
        },
      ],
    );
  };

  if (isFetching) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#09090B]">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style="dark" />

      {/* 🚨 OTP MODAL */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-[50%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Verify Phone Change
              </Text>
              {/* ✅ THIS IS THE FIX: Closed with TouchableOpacity instead of View */}
              <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                <Ionicons name="close-circle" size={28} color="gray" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 mb-6">
              To secure your account, we've sent a 6-digit code to{" "}
              <Text className="font-bold text-gray-900 dark:text-white">
                {auth.currentUser?.email}
              </Text>
              . Enter it below to confirm your new phone number.
            </Text>

            <TextInput
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center text-2xl font-bold tracking-widest text-gray-900 dark:text-white mb-6"
            />

            <TouchableOpacity
              onPress={verifyOtp}
              className="bg-[#FF5A1F] h-14 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-bold text-lg">
                Verify & Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView className="flex-1">
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Business Hub
          </Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={pickImage}
              className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full items-center justify-center mb-3 relative border-4 border-white dark:border-gray-800 shadow-sm overflow-hidden"
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Ionicons name="business" size={40} color="#FF5A1F" />
              )}
              <View className="absolute bottom-0 w-full bg-black/50 py-1 items-center">
                <Text className="text-white text-[10px] font-bold">EDIT</Text>
              </View>
            </TouchableOpacity>

            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {businessName || "Your Business"}
            </Text>
            <Text className="text-gray-500 text-xs mt-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full overflow-hidden font-bold tracking-widest uppercase">
              Verified Partner ✓
            </Text>
          </View>

          <View className="space-y-5 gap-4">
            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Business Name
              </Text>
              <TextInput
                className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Royal Heritage Hotel"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Owner Name (Admin Only)
              </Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 font-medium"
                value={ownerName}
                editable={false} // Locked Down
              />
            </View>

            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Contact Phone
              </Text>
              <TextInput
                className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2 ml-1">
                Full Address
              </Text>
              <TextInput
                className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium h-24"
                value={address}
                onChangeText={setAddress}
                multiline
                textAlignVertical="top"
                placeholder="Enter business address..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSaveClick}
            disabled={isLoading}
            className="mt-6 bg-[#FF5A1F] h-14 rounded-xl items-center justify-center shadow-sm flex-row"
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Saving...
                </Text>
              </>
            ) : (
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            )}
          </TouchableOpacity>

          <View className="mt-10 mb-6 border-t border-gray-200 dark:border-gray-800 pt-8">
            <Text className="text-gray-900 dark:text-white text-lg font-black mb-4">
              Manage Business
            </Text>
            <View className="gap-3">
              {[
                {
                  label: "Manage Rooms",
                  icon: "bed-outline",
                  route: "/partner/rooms",
                },

                {
                  label: "Verification Documents",
                  icon: "document-text-outline",
                  route: "/partner/documents",
                },
                {
                  label: "App Settings",
                  icon: "settings-outline",
                  route: "/partner/settings",
                },
                {
                  label: "Help & Support",
                  icon: "help-buoy-outline",
                  route: "/partner/support",
                },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(item.route as any)}
                  className="flex-row items-center justify-between bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color="#FF5A1F"
                      />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold">
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="mt-2 mb-12 flex-row items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-500 font-bold text-base">Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

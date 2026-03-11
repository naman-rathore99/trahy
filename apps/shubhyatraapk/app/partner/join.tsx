import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// Notice: We completely removed the Firebase Storage imports!
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
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

export default function PartnerJoinScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Form State
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [govtIdImage, setGovtIdImage] = useState<string | null>(null);

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🚨 YOUR CLOUDINARY CREDENTIALS 🚨
  const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  // 1. Open Phone Gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setGovtIdImage(result.assets[0].uri);
    }
  };

  // 2. Handle Form Submission to Cloudinary + Firebase
  const handleSubmit = async () => {
    if (!name || !businessName || !phone) {
      Alert.alert("Missing Details", "Please fill out all text fields.");
      return;
    }

    if (!govtIdImage) {
      Alert.alert(
        "ID Required",
        "Please upload a valid Government ID proof to proceed.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Step A: Package the image for Cloudinary
      const data = new FormData();
      data.append("file", {
        uri: govtIdImage,
        type: "image/jpeg",
        name: `partner_id_${Date.now()}.jpg`,
      } as any);

      data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "");
      data.append("cloud_name", CLOUDINARY_CLOUD_NAME || "");

      // Step B: Upload directly to Cloudinary via REST API
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME || ""}/image/upload`;

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

      const downloadUrl = cloudinaryResult.secure_url;

      // Step C: Save all data (including the new Cloudinary URL) to Firestore
      await addDoc(collection(db, "partner_applications"), {
        name,
        businessName,
        phone,
        idDocumentUrl: downloadUrl, // 👈 Cloudinary URL saved here!
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setIsSubmitting(false);

      // Step D: Success!
      Alert.alert(
        "Application Received! 🎉",
        "Thank you for your interest in joining Shubh Yatra. Our team will verify your ID and contact you within 24 hours.",
        [{ text: "Back to Home", onPress: () => router.back() }],
      );
    } catch (error: any) {
      console.error("Submission Error:", error);
      setIsSubmitting(false);
      Alert.alert(
        "Upload Failed",
        "There was an error submitting your application. Please check your internet connection and try again.",
      );
    }
  };

  const benefits = [
    {
      icon: "trending-up",
      title: "More Bookings",
      desc: "Reach thousands of travelers visiting Mathura & Vrindavan.",
    },
    {
      icon: "shield-checkmark",
      title: "Verified Partners",
      desc: "We only work with trusted, ID-verified property owners.",
    },
    {
      icon: "wallet",
      title: "Zero Onboarding Fee",
      desc: "List your property for free and only pay a small commission on success.",
    },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-900">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-xl font-bold">
            List Your Property
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View className="px-6 py-8 items-center bg-white dark:bg-[#09090B] border-b border-gray-100 dark:border-gray-900">
              <View className="w-20 h-20 bg-[#5f259f]/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="business" size={40} color="#5f259f" />
              </View>
              <Text className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2">
                Grow Your Hotel Business
              </Text>
              <Text className="text-gray-500 text-center text-sm px-4">
                Partner with Shubh Yatra to get consistent, reliable bookings.
              </Text>
            </View>

            {/* Benefits Section */}
            <View className="px-6 py-8 bg-gray-50 dark:bg-black">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-4">
                Why partner with us?
              </Text>
              {benefits.map((item, index) => (
                <View key={index} className="flex-row items-center mb-6 pr-4">
                  <View className="w-12 h-12 bg-white dark:bg-[#111827] rounded-full items-center justify-center mr-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color="#FF5A1F"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 dark:text-white text-base">
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1 leading-4">
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Application Form */}
            <View className="px-6 pb-10">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-4">
                Apply Now
              </Text>

              <View className="gap-4">
                <View className="bg-white dark:bg-[#111827] flex-row items-center px-4 h-14 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <TextInput
                    placeholder="Your Full Name"
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={name}
                    onChangeText={setName}
                    className="flex-1 ml-3 text-gray-900 dark:text-white"
                  />
                </View>

                <View className="bg-white dark:bg-[#111827] flex-row items-center px-4 h-14 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <TextInput
                    placeholder="Property Name (e.g., Royal Hotel)"
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={businessName}
                    onChangeText={setBusinessName}
                    className="flex-1 ml-3 text-gray-900 dark:text-white"
                  />
                </View>

                <View className="bg-white dark:bg-[#111827] flex-row items-center px-4 h-14 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <TextInput
                    placeholder="Mobile Number"
                    keyboardType="phone-pad"
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={phone}
                    onChangeText={setPhone}
                    className="flex-1 ml-3 text-gray-900 dark:text-white"
                  />
                </View>

                {/* 📸 Image Upload Section */}
                <View className="mt-4">
                  <Text className="text-gray-900 dark:text-white text-base font-bold mb-1">
                    Government ID Proof <Text className="text-red-500">*</Text>
                  </Text>
                  <Text className="text-gray-500 text-xs mb-3">
                    Upload Aadhar, PAN, or GST Certificate for verification.
                  </Text>

                  <TouchableOpacity
                    onPress={pickImage}
                    className="h-40 w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] items-center justify-center overflow-hidden"
                  >
                    {govtIdImage ? (
                      <Image
                        source={{ uri: govtIdImage }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="items-center">
                        <Ionicons
                          name="cloud-upload-outline"
                          size={36}
                          color={isDark ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text className="text-gray-500 font-medium mt-2">
                          Tap to browse gallery
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Button to remove the image if they made a mistake */}
                  {govtIdImage && (
                    <TouchableOpacity
                      onPress={() => setGovtIdImage(null)}
                      className="mt-3 self-end"
                    >
                      <Text className="text-red-500 font-bold">
                        Remove Image
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Submit Button */}
        <View className="p-6 bg-white dark:bg-[#09090B] border-t border-gray-100 dark:border-gray-900 shadow-2xl">
          <TouchableOpacity
            disabled={isSubmitting}
            onPress={handleSubmit}
            className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-2 ${isSubmitting ? "bg-[#5f259f]/50" : "bg-[#5f259f]"}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-bold text-lg">
                  Submit Application
                </Text>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="white"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

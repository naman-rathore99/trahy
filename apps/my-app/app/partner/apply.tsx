import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { submitApplication } from "../../service/api";

// ✅ Standardized City List (Same as User Side)
const CITIES = [
  "Mathura",
  "Vrindavan",
  "Gokul",
  "Govardhan",
  "Barsana",
  "Nandgaon",
];

export default function ApplyScreen() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");

  // ✅ New City State
  const [city, setCity] = useState("Mathura");
  const [showCityPicker, setShowCityPicker] = useState(false);

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pick Image Logic
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Submit Logic
  const handleSubmit = async () => {
    if (!ownerName || !businessName || !contactNumber || !email || !city) {
      Alert.alert("Missing Fields", "Please fill in all details.");
      return;
    }

    setLoading(true);
    try {
      await submitApplication({
        ownerName,
        name: businessName, // Maps to 'hotelName' in backend
        contactNumber,
        email,
        city, // ✅ Sending City
        verificationImage: image,
        serviceType: "Hotel", // You can change this if you add a toggle for Taxi later
      });

      Alert.alert(
        "Success",
        "Your application has been sent! We will contact you shortly.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">
          Partner Application
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Intro */}
        <Text className="text-gray-500 mb-6">
          Join our network of spiritual stays and travel providers. Fill details
          to get verified.
        </Text>

        {/* Form Fields */}
        <View className="space-y-4">
          <View>
            <Text className="font-medium text-gray-900 mb-2">Owner Name</Text>
            <TextInput
              placeholder="Ex. Rajesh Kumar"
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl"
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </View>

          <View>
            <Text className="font-medium text-gray-900 mb-2">
              Business Name (Hotel/Agency)
            </Text>
            <TextInput
              placeholder="Ex. Krishna Residency"
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          {/* ✅ CITY PICKER */}
          <View className="z-20">
            <Text className="font-medium text-gray-900 mb-2">
              Business Location
            </Text>
            <TouchableOpacity
              onPress={() => setShowCityPicker(!showCityPicker)}
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex-row justify-between items-center"
            >
              <Text className="text-gray-900">{city}</Text>
              <Feather name="chevron-down" size={20} color="gray" />
            </TouchableOpacity>

            {showCityPicker && (
              <View className="absolute top-[85px] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                {CITIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setCity(c);
                      setShowCityPicker(false);
                    }}
                    className="p-4 border-b border-gray-100 active:bg-orange-50"
                  >
                    <Text
                      className={
                        city === c
                          ? "text-[#FF5A1F] font-bold"
                          : "text-gray-700"
                      }
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View>
            <Text className="font-medium text-gray-900 mb-2">
              Contact Number
            </Text>
            <TextInput
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl"
              value={contactNumber}
              onChangeText={setContactNumber}
            />
          </View>

          <View>
            <Text className="font-medium text-gray-900 mb-2">
              Email Address
            </Text>
            <TextInput
              placeholder="partner@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Image Upload */}
          <View>
            <Text className="font-medium text-gray-900 mb-2">
              Property / ID Proof
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              className="bg-gray-50 border-dashed border-2 border-gray-300 p-6 rounded-xl items-center justify-center"
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  className="w-full h-40 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Feather name="image" size={32} color="gray" />
                  <Text className="text-gray-400 mt-2">
                    Tap to upload image
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`mt-8 py-4 rounded-xl items-center shadow-lg ${loading ? "bg-gray-400" : "bg-[#FF5A1F]"}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Submit Application
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

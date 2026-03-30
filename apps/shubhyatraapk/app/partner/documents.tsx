import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

// Base template for documents
const DEFAULT_DOCS = [
  { id: "aadhar", name: "Aadhar Card", status: "Upload Required" },
  { id: "pan", name: "PAN Card", status: "Upload Required" },
  { id: "gst", name: "GST Certificate", status: "Upload Required" },
  { id: "license", name: "Hotel License", status: "Upload Required" },
  { id: "cheque", name: "Bank Cheque (Cancelled)", status: "Upload Required" },
];

export default function PartnerDocuments() {
  const router = useRouter();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // 1. Fetch Document Statuses from Firestore
  useFocusEffect(
    useCallback(() => {
      const fetchDocuments = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const savedDocs = data.documents || {};

            // Merge default layout with saved Firestore statuses
            const mergedDocs = DEFAULT_DOCS.map((baseDoc) => {
              const savedDoc = savedDocs[baseDoc.id];
              return {
                ...baseDoc,
                status: savedDoc?.status || "Upload Required",
                url: savedDoc?.url || null,
                date: savedDoc?.date || "Action needed",
              };
            });

            setDocuments(mergedDocs);
          }
        } catch (error) {
          console.error("Error fetching docs:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDocuments();
    }, []),
  );

  // 2. Handle the Upload Flow (Camera or Gallery)
  const pickAndUploadDocument = async (docId: string, docName: string) => {
    Alert.alert(
      "Upload Document",
      `How would you like to upload your ${docName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Choose from Gallery",
          onPress: () => launchPicker(docId, true),
        },
        {
          text: "Take Photo",
          onPress: () => launchPicker(docId, false),
        },
      ],
    );
  };

  const launchPicker = async (docId: string, useGallery: boolean) => {
    let result;
    if (useGallery) {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission denied");
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    } else {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission denied");
      result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0].uri) {
      uploadToCloudinary(docId, result.assets[0].uri);
    }
  };

  // 3. Upload to Cloudinary & Update Firestore
  const uploadToCloudinary = async (docId: string, imageUri: string) => {
    setUploadingId(docId);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      // A. Upload to Cloudinary
      const data = new FormData();
      data.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: `doc_${docId}_${user.uid}_${Date.now()}.jpg`,
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
      if (!cloudinaryResult.secure_url) throw new Error("Upload failed");

      // B. Save URL to Firestore & update status to Pending
      const today = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      const newDocData = {
        url: cloudinaryResult.secure_url,
        status: "Pending Review",
        date: `Submitted on ${today}`,
      };

      await updateDoc(doc(db, "users", user.uid), {
        [`documents.${docId}`]: newDocData,
      });

      // C. Update Local UI State
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, ...newDocData } : d)),
      );

      Alert.alert(
        "Success",
        "Document uploaded successfully and is now pending review.",
      );
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert(
        "Upload Failed",
        "Could not upload document. Please try again.",
      );
    } finally {
      setUploadingId(null);
    }
  };

  const handleDocumentPress = (doc: any) => {
    if (doc.status === "Verified") {
      Alert.alert("Verified", "This document has been verified by our team.");
    } else if (doc.status === "Pending Review") {
      Alert.alert(
        "In Review",
        "Our team is currently reviewing this document. We will notify you once verified.",
      );
    } else {
      pickAndUploadDocument(doc.id, doc.name);
    }
  };

  // Helper function to get UI styles based on status
  const getUIConfig = (status: string) => {
    if (status === "Verified") {
      return {
        icon: "checkmark-circle",
        color: "#16A34A",
        bg: "bg-green-50 dark:bg-green-900/20",
        badgeBg: "bg-green-100 dark:bg-green-900/30",
      };
    }
    if (status === "Pending Review") {
      return {
        icon: "time",
        color: "#F59E0B",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        badgeBg: "bg-orange-100 dark:bg-orange-900/30",
      };
    }
    return {
      icon: "cloud-upload",
      color: "#EF4444",
      bg: "bg-red-50 dark:bg-red-900/20",
      badgeBg: "bg-red-100 dark:bg-red-900/30",
    };
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#09090B]">
        <ActivityIndicator size="large" color="#FF5A1F" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#09090B]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        {/* --- Header --- */}
        <View className="px-6 py-4 flex-row items-center gap-4 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full border border-gray-200 dark:border-gray-700"
          >
            <Ionicons name="arrow-back" size={24} color="gray" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Documents
          </Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mb-6 flex-row items-start border border-blue-100 dark:border-blue-900/30">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-700 dark:text-blue-400 font-bold text-sm mb-1">
                Verification Status
              </Text>
              <Text className="text-blue-600 dark:text-blue-300 text-xs leading-5">
                Please ensure all documents are clear and valid. Verification
                typically takes 24-48 hours.
              </Text>
            </View>
          </View>

          {/* Documents List */}
          <View className="pb-10">
            {documents.map((doc) => {
              const ui = getUIConfig(doc.status);
              const isUploading = uploadingId === doc.id;

              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => handleDocumentPress(doc)}
                  disabled={isUploading}
                  className="bg-white dark:bg-[#1F2937] p-4 rounded-2xl mb-3 border border-gray-100 dark:border-gray-800 flex-row items-center justify-between shadow-sm"
                >
                  <View className="flex-row items-center flex-1">
                    {/* Icon Box */}
                    <View
                      className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${ui.bg}`}
                    >
                      {isUploading ? (
                        <ActivityIndicator color={ui.color} size="small" />
                      ) : (
                        <Ionicons
                          name="document-text"
                          size={22}
                          color={ui.color}
                        />
                      )}
                    </View>

                    {/* Text Info */}
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900 dark:text-white text-base">
                        {doc.name}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {isUploading ? "Uploading..." : doc.date}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View className="items-end">
                    <View
                      className={`px-2 py-1 rounded-md flex-row items-center gap-1 ${ui.badgeBg}`}
                    >
                      <Ionicons
                        name={ui.icon as any}
                        size={10}
                        color={ui.color}
                      />
                      <Text
                        style={{ color: ui.color }}
                        className="text-[10px] font-bold uppercase"
                      >
                        {doc.status === "Upload Required"
                          ? "Upload"
                          : doc.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

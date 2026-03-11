import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnerDocuments() {
  const router = useRouter();

  const [documents, setDocuments] = useState([
    { id: '1', name: "Aadhar Card", status: "Verified", icon: "checkmark-circle", color: "#16A34A", date: "Verified on 10 Jan" },
    { id: '2', name: "PAN Card", status: "Verified", icon: "checkmark-circle", color: "#16A34A", date: "Verified on 10 Jan" },
    { id: '3', name: "GST Certificate", status: "Pending Review", icon: "time", color: "#F59E0B", date: "Submitted yesterday" },
    { id: '4', name: "Hotel License", status: "Upload Required", icon: "cloud-upload", color: "#EF4444", date: "Action needed" },
    { id: '5', name: "Bank Cheque (Cancelled)", status: "Upload Required", icon: "cloud-upload", color: "#EF4444", date: "Action needed" },
  ]);

  const handleDocumentPress = (doc: any) => {
    if (doc.status === "Verified") {
        Alert.alert("Verified", "This document has been verified by our team.");
    } else if (doc.status === "Pending Review") {
        Alert.alert("In Review", "Our team is currently reviewing this document.");
    } else {
        Alert.alert("Upload", `Please upload a clear photo of your ${doc.name}.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Open Camera", onPress: () => Alert.alert("Simulated", "Camera opened.") }
        ]);
    }
  };

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
            <Text className="text-xl font-bold text-gray-900 dark:text-white">Documents</Text>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            
            {/* Info Banner */}
            <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mb-6 flex-row items-start border border-blue-100 dark:border-blue-900/30">
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <View className="ml-3 flex-1">
                    <Text className="text-blue-700 dark:text-blue-400 font-bold text-sm mb-1">Verification Status</Text>
                    <Text className="text-blue-600 dark:text-blue-300 text-xs leading-5">
                        Please ensure all documents are clear and valid. Verification typically takes 24-48 hours.
                    </Text>
                </View>
            </View>

            {/* Documents List */}
            <View className="pb-10">
                {documents.map((doc) => (
                    <TouchableOpacity 
                        key={doc.id} 
                        onPress={() => handleDocumentPress(doc)}
                        className="bg-white dark:bg-[#1F2937] p-4 rounded-2xl mb-3 border border-gray-100 dark:border-gray-800 flex-row items-center justify-between shadow-sm"
                    >
                        <View className="flex-row items-center flex-1">
                            {/* Icon Box */}
                            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                                doc.status === 'Verified' ? 'bg-green-50 dark:bg-green-900/20' : 
                                (doc.status === 'Pending Review' ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-red-50 dark:bg-red-900/20')
                            }`}>
                                <Ionicons name="document-text" size={22} color={doc.color} />
                            </View>
                            
                            {/* Text Info */}
                            <View className="flex-1">
                                <Text className="font-bold text-gray-900 dark:text-white text-base">{doc.name}</Text>
                                <Text className="text-gray-400 text-xs mt-0.5">{doc.date}</Text>
                            </View>
                        </View>

                        {/* Status Badge */}
                        <View className="items-end">
                            <View className={`px-2 py-1 rounded-md flex-row items-center gap-1 ${
                                doc.status === 'Verified' ? 'bg-green-100 dark:bg-green-900/30' : 
                                (doc.status === 'Pending Review' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-red-100 dark:bg-red-900/30')
                            }`}>
                                <Ionicons name={doc.icon as any} size={10} color={doc.color} />
                                <Text style={{ color: doc.color }} className="text-[10px] font-bold uppercase">
                                    {doc.status === 'Upload Required' ? 'Upload' : doc.status}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
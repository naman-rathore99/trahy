import { auth, db } from "@/config/firebase";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { WebView } from "react-native-webview";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

interface BookingDetails {
  listingId: string;
  listingName: string;
  listingImage?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  serviceType?: string;
  vehicleIncluded?: boolean;
  vehicleType?: string | null;
  vehiclePricePerDay?: number;
  vehicleTotalAmount?: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
}

interface Props {
  bookingDetails: BookingDetails;
}

export default function PaymentWebView({ bookingDetails }: Props) {
  const router = useRouter();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    initiatePayment();
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // ✅ Get Firebase ID token for secure API call
      const idToken = await user.getIdToken();

      const res = await fetch(`${BASE_URL}/api/payment/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...bookingDetails,
          userId: user.uid,
          mobile: bookingDetails.customerPhone,
          source: "mobile",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url || !data.bookingId) {
        throw new Error(data.error || "Could not initiate payment");
      }

      setPaymentUrl(data.url);
      setLoading(false);

      // ✅ Start Firestore listener — this is what actually tells the app payment is done
      startFirestoreListener(data.bookingId);
    } catch (err: any) {
      console.error("Payment init error:", err);
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const startFirestoreListener = (bookingId: string) => {
    const bookingRef = doc(db, "bookings", bookingId);

    const unsubscribe = onSnapshot(bookingRef, (snapshot) => {
      if (!snapshot.exists() || resolvedRef.current) return;

      const status = snapshot.data()?.status;

      if (status === "confirmed") {
        resolvedRef.current = true;
        unsubscribeRef.current?.();
        router.replace(`/booking/success?id=${bookingId}` as any);
      } else if (status === "failed") {
        resolvedRef.current = true;
        unsubscribeRef.current?.();
        router.replace(`/booking/failed?id=${bookingId}` as any);
      }
    });

    unsubscribeRef.current = unsubscribe;
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#5f259f" />
        <Text style={{ marginTop: 12, color: "#6b7280", fontSize: 14 }}>
          Setting up payment...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            color: "#ef4444",
            marginBottom: 8,
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Payment Setup Failed
        </Text>
        <Text
          style={{ color: "#6b7280", marginBottom: 24, textAlign: "center" }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={initiatePayment}
          style={{
            backgroundColor: "#5f259f",
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: paymentUrl! }}
      style={{ flex: 1 }}
      startInLoadingState
      renderLoading={() => (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#5f259f" />
        </View>
      )}
      onError={() => {
        setError("Failed to load payment page. Check your connection.");
        setPaymentUrl(null);
      }}
    />
  );
}

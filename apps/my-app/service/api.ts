import axios from 'axios';
import { auth } from './firebaseConfig';

const BASE_URL = 'http://192.168.0.176:3000/api';

console.log(`🚀 API Targeting: ${BASE_URL}`);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});


export interface Hotel {
  id: string;
  title: string;
  location: string;
  price: string;
  rating: string;
  image: string;
  tag: string;
  amenities: string[];
}

export interface Room {
  id: string;
  name: string;
  price: number;
  type?: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface HotelDetails {
  hotel: {
    id: string;
    title: string;
    location: string;
    price: string;
    rating: string;
    image: string;
    description: string;
    amenities: string[];
  };
  rooms: Room[];
}

export interface PartnerRevenue {
  totalSales: number;
  platformFee: number;
  partnerPayout: number;
  totalBookings: number;
}

// ---------------------------------------------------------------------------
// 🚀 API FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * 1. GET ALL HOTELS (Home Screen)
 */
export const getHotels = async (): Promise<Hotel[]> => {
  try {
    const response = await apiClient.get('/public/hotels');
    const rawData = response.data.hotels || [];

    return rawData.map((item: any) => {
      // Logic to pick the best image
      const validImage = (item.images && item.images.length > 0)
        ? item.images[0]
        : (item.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945');

      return {
        id: item.id,
        title: item.name || 'Unknown Hotel',
        location: item.location || item.city || 'Mathura, India',
        price: `₹${item.price || item.pricePerNight || '0'}`,
        rating: item.rating ? String(item.rating) : 'New',
        image: validImage,
        tag: generateTag(item.price, item.rating),
        amenities: item.amenities || [],
      };
    });

  } catch (error: any) {
    console.error("❌ FETCH ERROR:", error.message);
    return [];
  }
};

/**
 * 2. GET HOTEL DETAILS (Details Screen)
 */
export const getHotelDetails = async (id: string): Promise<HotelDetails | null> => {
  try {
    const response = await apiClient.get(`/public/hotels/${id}`);
    const data = response.data;

    return {
      hotel: {
        id: data.hotel.id,
        title: data.hotel.name,
        location: data.hotel.location || data.hotel.city,
        price: `₹${data.hotel.price}`,
        rating: data.hotel.rating?.toString() || "New",
        image: (data.hotel.images && data.hotel.images.length > 0)
          ? data.hotel.images[0]
          : 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        description: data.hotel.description,
        amenities: data.hotel.amenities || [],
      },
      rooms: data.rooms.map((r: any) => ({
        id: r.id,
        name: r.name || r.type || 'Standard Room',
        price: Number(r.price) || Number(data.hotel.price),
        type: r.type || 'Standard'
      }))
    };
  } catch (error) {
    console.error("❌ Fetch Details Error:", error);
    return null;
  }
};

/**
 * 3. GET REVIEWS
 */
export const getReviews = async (hotelId: string): Promise<Review[]> => {
  try {
    const response = await apiClient.get(`/reviews?hotelId=${hotelId}`);
    return response.data.reviews || [];
  } catch (error) {
    console.error("❌ Fetch Reviews Error:", error);
    return [];
  }
};

/**
 * 4. POST REVIEW
 */
export const postReview = async (hotelId: string, rating: number, text: string) => {
  try {
    // Use the 'auth' object we imported from firebaseConfig
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : "";

    const response = await apiClient.post('/reviews', {
      hotelId,
      rating,
      text
    }, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Post Review Error:", error);
    throw error;
  }
};

/**
 * 5. GET PARTNER REVENUE
 */
export const getPartnerRevenue = async (partnerId: string): Promise<PartnerRevenue | null> => {
  try {
    const response = await apiClient.get('/revenue', {
      params: { role: 'partner', partnerId: partnerId, period: '30days' }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Fetch Revenue Error:", error);
    return null;
  }
};

/**
 * 6. SUBMIT PARTNER APPLICATION (For Apply Screen)
 * ✅ Missing function added here
 */
export const createHotel = async (applicationData: any) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("You must be logged in to apply.");

    const token = await user.getIdToken();

    const response = await apiClient.post('/partner/apply', {
      ...applicationData,
      ownerId: user.uid,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error("❌ Create Application Error:", error);
    throw error;
  }
};
export const submitApplication = async (applicationData: any) => {
  try {
    // ✅ URL UPDATED to match your folder structure
    const response = await apiClient.post('/public/join-request', applicationData);

    return response.data;
  } catch (error) {
    console.error("❌ Application Error:", error);
    throw error;
  }
};
export const syncUserWithBackend = async (userData: {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  city?: string;
}) => {
  try {
    // Calling the Next.js API we just created
    const response = await apiClient.post('/auth/sync-user', userData);
    return response.data;
  } catch (error) {
    console.error("❌ Sync User Error:", error);
    // We don't throw here because Auth succeeded, we just failed to sync DB. 
    // The user can still proceed, we can try syncing later.
    return null;
  }
};
// --- HELPERS ---
const generateTag = (price: number, rating: number) => {
  if (rating >= 4.8) return 'Top Rated';
  if (price < 1100) return 'Best Value';
  return 'Popular';
};

export default apiClient;
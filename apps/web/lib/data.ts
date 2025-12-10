// lib/data.ts

// 1. Define Room Interface FIRST
export interface Room {
  id: string;
  name: string;
  type: "AC" | "Non-AC";
  price: number;
  bed: string;
  capacity: number;
  image: string;
}

// 2. Define Vehicle Interface SECOND
export interface Vehicle {
  id: string;
  name: string;
  type: "Bike" | "Car" | "SUV";
  price: number;
  image: string;
  seats: number;
}

// 3. Define Destination Interface (Uses Room[] and Vehicle[])
export interface Destination {
  id: number;
  title: string;
  location: string;
  rating: number;
  description: string;
  image: string;
  price: number; // Starting price
  amenities: string[];
  rooms: Room[]; // 👈 Now it can find Room
  vehicles: Vehicle[]; // 👈 Now it can find Vehicle
  images: string[];
  hasBanquetHall: boolean;
  hallCapacity?: number;
}

// --- HELPER FUNCTIONS ---

const generateRooms = (basePrice: number): Room[] => [
  {
    id: "r1",
    name: "Standard Room",
    type: "Non-AC",
    price: basePrice,
    bed: "1 Queen Bed",
    capacity: 2,
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "r2",
    name: "Deluxe Room",
    type: "AC",
    price: basePrice + 50,
    bed: "1 King Bed",
    capacity: 2,
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "r3",
    name: "Family Suite",
    type: "AC",
    price: basePrice + 150,
    bed: "2 King Beds",
    capacity: 4,
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800&auto=format&fit=crop",
  },
];

const generateVehicles = (): Vehicle[] => [
  {
    id: "v1",
    name: "Honda Activa",
    type: "Bike",
    price: 15,
    seats: 2,
    image:
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "v2",
    name: "Swift Dzire",
    type: "Car",
    price: 40,
    seats: 4,
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "v3",
    name: "Toyota Fortuner",
    type: "SUV",
    price: 80,
    seats: 7,
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop",
  },
];

// --- RAW DATA ---

const rawData: Omit<Destination, "id">[] = [
  {
    title: "Thailand Grand Resort",
    location: "Bangkok, Thailand",
    rating: 4.9,
    description:
      "A tropical paradise featuring lively cities and stunning beaches.",
    image:
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2600&auto=format&fit=crop",
    price: 120,
    amenities: ["Wifi", "Pool", "Air conditioning", "Spa"],
    rooms: generateRooms(120),
    vehicles: generateVehicles(),
    images: [
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
    ],
    hasBanquetHall: true,
    hallCapacity: 200,
  },
  {
    title: "Parisian Luxury Hotel",
    location: "Paris, France",
    rating: 4.8,
    description:
      "Experience the romance of Paris with a view of the Eiffel Tower.",
    image:
      "https://images.unsplash.com/photo-1471623432079-916ef5b5e9f6?q=80&w=2600&auto=format&fit=crop",
    price: 350,
    amenities: ["Wifi", "Heating", "Kitchen", "Gym"],
    rooms: generateRooms(350),
    vehicles: generateVehicles(),
    images: [
      "https://images.unsplash.com/photo-1471623432079-916ef5b5e9f6?q=80&w=2600&auto=format&fit=crop",
    ],
    hasBanquetHall: false,
  },
  {
    title: "Dubai Skyline Hotel",
    location: "Downtown Dubai",
    rating: 5.0,
    description:
      "Luxury redefined with breathtaking views of the Burj Khalifa.",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea936a7fe48?q=80&w=2600&auto=format&fit=crop",
    price: 500,
    amenities: ["Wifi", "Pool", "Gym", "Air conditioning", "Butler"],
    rooms: generateRooms(500),
    vehicles: generateVehicles(),
    images: [
      "https://images.unsplash.com/photo-1512453979798-5ea936a7fe48?q=80&w=2600&auto=format&fit=crop",
    ],
    hasBanquetHall: true,
    hallCapacity: 500,
  },
];

// --- EXPORTS ---

export const allDestinations: Destination[] = rawData.map((item, index) => ({
  ...item,
  id: index + 1,
}));

export function getDestinationById(
  id: string | number
): Destination | undefined {
  return allDestinations.find((dest) => String(dest.id) === String(id));
}

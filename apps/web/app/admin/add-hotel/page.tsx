"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import ImageUpload from "@/components/ImageUpload"; // Single Image (For Vehicle)
import MultiImageUpload from "@/components/MultiImageUpload"; // Multi Image (For Hotel)
import { apiRequest } from "@/lib/api";

export default function AddHotelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // --- FORM STATE ---
  const [hotel, setHotel] = useState({
    name: "",
    location: "",
    pricePerNight: "",
    description: "",
    imageUrls: [] as string[], // Array for Hotel Gallery
  });

  // --- VEHICLE STATE ---
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicle, setVehicle] = useState({
    name: "",
    type: "Sedan",
    pricePerDay: "",
    imageUrl: "", // Single string for Vehicle
  });

  // --- 1. AUTH PROTECTION ---
  useEffect(() => {
    const auth = getAuth(app);
    // Listen for the definitive auth state (logged in vs logged out)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("User not found, redirecting...");
        router.push("/login");
      } else {
        console.log("Admin verified:", user.email);
        setIsAuthChecking(false); // Stop loading, show form
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- 2. SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (hotel.imageUrls.length === 0) {
      alert("Please upload at least one hotel image");
      return;
    }
    if (hasVehicle && !vehicle.imageUrl) {
      alert("Please upload a vehicle image");
      return;
    }

    setLoading(true);

    try {
      // Construct the payload matching backend expectations
      const payload = {
        ...hotel,
        pricePerNight: Number(hotel.pricePerNight), // Ensure number format

        hasVehicle,
        vehicleDetails: hasVehicle
          ? {
              ...vehicle,
              pricePerDay: Number(vehicle.pricePerDay), // Ensure number format
            }
          : null,
      };

      // Send to Backend
      await apiRequest("/api/admin/add-hotel", "POST", payload);

      alert("Success! Property & Vehicle added.");
      router.push("/admin"); // Redirect to Admin Dashboard
    } catch (error: any) {
      console.error(error);
      alert("Failed to add property: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. LOADING SCREEN (While checking Auth) ---
  if (isAuthChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  // --- 4. MAIN UI ---
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-black px-8 py-6">
          <h1 className="text-2xl font-bold text-white">
            Admin: Add New Property
          </h1>
          <p className="text-gray-400 mt-1">
            Add hotel details, gallery, and optional vehicle services.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* SECTION 1: HOTEL DETAILS */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">
              1. Hotel Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Property Name
                </label>
                <input
                  required
                  value={hotel.name}
                  onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
                  placeholder="e.g. The Grand Palace"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  required
                  value={hotel.location}
                  onChange={(e) =>
                    setHotel({ ...hotel, location: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="e.g. Mumbai, India"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price per Night (₹)
                </label>
                <input
                  required
                  type="number"
                  value={hotel.pricePerNight}
                  onChange={(e) =>
                    setHotel({ ...hotel, pricePerNight: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="4500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={hotel.description}
                  onChange={(e) =>
                    setHotel({ ...hotel, description: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Tell us about the property..."
                />
              </div>

              {/* HOTEL GALLERY (Multi Image) */}
              <div className="md:col-span-2">
                <MultiImageUpload
                  label="Property Gallery (Max 5)"
                  urls={hotel.imageUrls}
                  onChange={(urls) => setHotel({ ...hotel, imageUrls: urls })}
                  maxFiles={5}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: VEHICLE TOGGLE */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  2. Vehicle Service
                </h3>
                <p className="text-sm text-gray-500">
                  Does this hotel provide transport?
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <button
                type="button"
                onClick={() => setHasVehicle(!hasVehicle)}
                className={`
                  relative inline-flex h-6 w-11  cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                  ${hasVehicle ? "bg-black" : "bg-gray-300"}
                `}
              >
                <span
                  className={` 
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${hasVehicle ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            {/* VEHICLE FORM (Conditional) */}
            {hasVehicle && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Name
                  </label>
                  <input
                    required={hasVehicle}
                    value={vehicle.name}
                    onChange={(e) =>
                      setVehicle({ ...vehicle, name: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    placeholder="e.g. Toyota Innova"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicle.type}
                    onChange={(e) =>
                      setVehicle({ ...vehicle, type: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  >
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Hatchback</option>
                    <option>Luxury</option>
                    <option>Bike</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price per Day (₹)
                  </label>
                  <input
                    required={hasVehicle}
                    type="number"
                    value={vehicle.pricePerDay}
                    onChange={(e) =>
                      setVehicle({ ...vehicle, pricePerDay: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    placeholder="2000"
                  />
                </div>

                {/* VEHICLE IMAGE (Single Image) */}
                <div className="md:col-span-2">
                  <ImageUpload
                    label="Vehicle Image"
                    currentUrl={vehicle.imageUrl}
                    onUpload={(url) =>
                      setVehicle({ ...vehicle, imageUrl: url })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-lg"
            >
              {loading ? "Publishing..." : "Publish Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

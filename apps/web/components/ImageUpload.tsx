"use client";

import { useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";

// REPLACE WITH YOUR ACTUAL KEYS
const CLOUDINARY_CLOUD_NAME = "dcts5t8sf";
const CLOUDINARY_PRESET = "travel_rooms";

interface ImageUploadProps {
  label?: string;
  onUpload: (url: string) => void;
  currentUrl?: string;
  className?: string;
  clearOnSuccess?: boolean; // <--- 1. NEW PROP
}

export default function ImageUpload({
  label,
  onUpload,
  currentUrl,
  className = "h-48",
  clearOnSuccess = false, // <--- 2. Default to false
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        onUpload(data.secure_url);

        // <--- 3. RESET LOGIC HERE
        if (clearOnSuccess) {
          setPreview(""); // Clear preview so it goes back to "+" button
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to upload image.");
      setPreview("");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreview("");
    onUpload("");
  };

  return (
    <div className="w-full h-full">
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className={`relative w-full ${className}`}>
        {preview ? (
          <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
            <img
              src={preview}
              alt="Preview"
              className={`w-full h-full object-cover transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-black">
                <Loader2 className="animate-spin" size={32} />
              </div>
            )}
            {!loading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md z-10"
              >
                <X size={16} />
              </button>
            )}
            {/* HIDE INPUT if loading or if we want to force remove first */}
            {!loading && !clearOnSuccess && (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            )}
          </div>
        ) : (
          <div className="relative w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-black dark:hover:text-white">
            {loading ? (
              <Loader2 className="animate-spin mb-2" size={20} />
            ) : (
              <UploadCloud size={24} className="mb-2" />
            )}
            <p className="text-[10px] uppercase font-bold text-center px-2">
              {loading ? "Uploading..." : "Add Photo"}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

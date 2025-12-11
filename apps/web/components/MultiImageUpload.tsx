"use client";
import { CldUploadWidget } from "next-cloudinary";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";

interface MultiImageUploadProps {
  label: string;
  urls: string[]; // Receives an Array of strings now
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MultiImageUpload({
  label,
  urls = [],
  onChange,
  maxFiles = 5,
}: MultiImageUploadProps) {
  const handleRemove = (urlToRemove: string) => {
    onChange(urls.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-bold text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">
          {urls.length} / {maxFiles} images
        </span>
      </div>

      {/* 1. PREVIEW GRID */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {urls.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={url}
                alt="Uploaded"
                className="object-cover w-full h-full"
              />

              {/* Delete Button (Overlay) */}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. UPLOAD BUTTON */}
      {urls.length < maxFiles && (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ multiple: true, maxFiles: maxFiles - urls.length }}
          onSuccess={(result: any) => {
            if (result.info?.secure_url) {
              // Add new URL to existing array
              onChange([...urls, result.info.secure_url]);
            }
          }}
        >
          {({ open }) => (
            <div
              onClick={() => open()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors"
            >
              <div className="bg-blue-50 p-3 rounded-full mb-3">
                <UploadCloud className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Click to upload images
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP up to 10MB
              </p>
            </div>
          )}
        </CldUploadWidget>
      )}
    </div>
  );
}

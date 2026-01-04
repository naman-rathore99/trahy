"use client";

import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X, Trash } from "lucide-react";
import { useState, useEffect } from "react";

interface MultiImageUploadProps {
  label?: string; // Optional label
  urls: string[]; // Receives an Array of strings
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MultiImageUpload({
  label,
  urls = [],
  onChange,
  maxFiles = 5,
}: MultiImageUploadProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRemove = (urlToRemove: string) => {
    onChange(urls.filter((url) => url !== urlToRemove));
  };

  const onUpload = (result: any) => {
    // Check for secure_url and add it to the list
    if (result.info?.secure_url) {
      onChange([...urls, result.info.secure_url]);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-4">
      {/* Optional Label Header */}
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-sm font-bold uppercase text-gray-500">{label}</label>
          <span className="text-xs text-gray-400">
            {urls.length} / {maxFiles} images
          </span>
        </div>
      )}

      {/* 1. PREVIEW GRID (Existing Images) */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {urls.map((url) => (
            <div
              key={url}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-100"
            >
              {/* Delete Button (Overlay) */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-colors"
                >
                  <Trash size={14} />
                </button>
              </div>
              <img
                src={url}
                alt="Uploaded image"
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 2. UPLOAD BUTTON (Custom UI) */}
      {urls.length < maxFiles && (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "shubhyatra_preset"} // Fallback to your preset name if env is missing
          options={{
            multiple: true,
            maxFiles: maxFiles - urls.length
          }}
          onSuccess={onUpload}
        >
          {({ open }) => {
            const onClick = () => {
              if (open) open();
            };

            return (
              <button
                type="button"
                onClick={onClick}
                className="flex flex-col items-center justify-center gap-3 w-full h-40 rounded-xl border-2 border-dashed border-gray-300 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all group"
              >
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                  <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-rose-500 transition-colors" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 block group-hover:text-rose-600">
                    Click to Upload
                  </span>
                  <span className="text-xs text-gray-400">
                    {maxFiles - urls.length} slots remaining
                  </span>
                </div>
              </button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
}
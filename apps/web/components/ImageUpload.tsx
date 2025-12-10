"use client";
import { CldUploadWidget } from "next-cloudinary";
import { useState } from "react";

interface ImageUploadProps {
  label: string;
  onUpload: (url: string) => void;
  currentUrl?: string; // To show if something is already there
}

export default function ImageUpload({
  label,
  onUpload,
  currentUrl,
}: ImageUploadProps) {
  const [uploaded, setUploaded] = useState(!!currentUrl);

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        options={{ sources: ["local", "camera"], multiple: false, maxFiles: 1 }}
        onSuccess={(result: any) => {
          if (result.info?.secure_url) {
            onUpload(result.info.secure_url);
            setUploaded(true);
          }
        }}
      >
        {({ open }) => (
          <div
            onClick={() => open()}
            className={`
              cursor-pointer relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200
              ${
                uploaded
                  ? "border-green-400 bg-green-50 hover:bg-green-100"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400"
              }
            `}
          >
            {uploaded ? (
              <div className="text-center">
                {/* Success Checkmark Icon */}
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mb-2">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-sm text-green-700 font-medium">
                  Image Uploaded
                </p>
                <p className="text-xs text-green-600">Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                {/* Upload Icon */}
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-1 text-sm text-gray-600">Click to upload</p>
              </div>
            )}
          </div>
        )}
      </CldUploadWidget>
    </div>
  );
}

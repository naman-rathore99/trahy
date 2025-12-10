"use client";
import { CldUploadWidget } from "next-cloudinary";

interface ImageUploadProps {
  label: string;
  onUpload: (url: string) => void;
}

export default function ImageUpload({ label, onUpload }: ImageUploadProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} // Uses .env.local
        options={{
          sources: ["local", "camera"],
          multiple: false,
          maxFiles: 1,
        }}
        onSuccess={(result: any) => {
          // Double check the structure of the result
          if (result.info && result.info.secure_url) {
            console.log("Cloudinary Success:", result.info.secure_url);
            onUpload(result.info.secure_url);
          } else {
            console.error("Upload finished but URL not found in:", result);
          }
        }}
        onError={(err) => {
          console.error("Cloudinary Error:", err);
          alert("Image upload failed. Check console.");
        }}
      >
        {({ open }) => {
          return (
            <button
              type="button"
              onClick={() => open()}
              className="w-full border-2 border-dashed border-gray-300 p-4 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              + Upload {label}
            </button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}

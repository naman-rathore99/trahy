"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <div className="flex flex-col gap-4 mb-12">
      {/* 1. Main Large Viewer */}
      <div className="relative w-full h-[400px] md:h-[500px] bg-gray-100 rounded-[2rem] overflow-hidden shadow-sm group">
        <img
          src={activeImage}
          alt="Active view"
          className="w-full h-full object-cover transition-transform duration-500"
        />

        {/* Optional: Navigation Arrows overlay */}
        <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {/* Logic for arrows could be added here, but clicking thumbnails is often enough */}
        </div>
      </div>

      {/* 2. Scrollable Thumbnails (Amazon Style) */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {images.map((img, index) => (
          <button
            key={index}
            onClick={() => setActiveImage(img)}
            className={`relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all snap-start ${
              activeImage === img
                ? "border-black ring-2 ring-black/20 scale-95 opacity-100"
                : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300"
            }`}
          >
            <img
              src={img}
              className="w-full h-full object-cover"
              alt={`Thumbnail ${index}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;

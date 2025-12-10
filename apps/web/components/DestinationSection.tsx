// components/DestinationSection.tsx
import React from "react";
import { Star, MapPin } from "lucide-react";
import { Destination } from "@/lib/data";

interface Props {
  destinations: Destination[];
  onItemClick: (dest: Destination) => void;
}

const DestinationSection = ({ destinations, onItemClick }: Props) => {
  const safeDestinations = destinations || [];

  return (
    <section className="max-w-[1400px] mx-auto px-8 py-16">
      <h2 className="text-4xl font-medium text-gray-900 mb-10">
        Popular Destinations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {safeDestinations.map((item) => (
          <article
            key={item.id}
            onClick={() => onItemClick(item)}
            className="
              relative rounded-xl bg-white shadow-md 
              cursor-pointer overflow-hidden group
              transition-all duration-300
              hover:shadow-2xl hover:-translate-y-2
              border border-transparent hover:border-indigo-500
            "
          >
            <div className="block h-full w-full border rounded-xl" >
              {/* Image */}
              <div className="h-40 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Content */}
              <div className="w-full bg-white p-4">
                {/* Location */}
                <p className="text-sm text-black font-medium text-indigo-500 flex items-center gap-1">
                  <MapPin size={14} />
                  {item.location}
                </p>

                {/* Title */}
                <p className="mt-1 mb-2 text-lg font-semibold text-gray-800 line-clamp-1">
                  {item.title}
                </p>

                {/* Description */}
                <p className="text-sm font-light text-gray-500 line-clamp-2">
                  {item.description ||
                    "Explore this destination and enjoy a premium experience."}
                </p>

                {/* Tags: rating + price */}
                <div className="flex items-center justify-between mt-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    {item.rating}
                  </div>

                  {/* Price pill */}
                  <div className="rounded-xl bg-blue-100 py-1 px-3 text-xs font-medium text-gray-700">
                    ₹{item.price}/night
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle glow underline on active hover */}
            <div
              className="
              absolute bottom-0 left-0 w-full h-[3px]
              bg-indigo-500 scale-x-0 group-hover:scale-x-100
              transition-transform duration-300 origin-left
            "
            ></div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DestinationSection;

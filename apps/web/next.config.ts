import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ✅ Allow Cloudinary
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // ✅ Allow Google Auth Images (Optional but recommended)
      },
    ],
  },
};

export default nextConfig;

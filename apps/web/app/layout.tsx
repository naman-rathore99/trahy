import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Renamed variable to 'montserrat' for clarity (was 'poppins')
const montserrat = Montserrat({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  // 1. Base URL (Critical for SEO images to work)
  metadataBase: new URL("https://shubhyatra.world"),

  // 2. Title Template (Pages will auto-fill: "Hotel Name | Shubh Yatra")
  title: {
    default: "Shubh Yatra | Best Stays & Travel in Mathura & Vrindavan",
    template: "%s | Shubh Yatra",
  },

  // 3. Description (What shows up in Google search results)
  description:
    "Book affordable hotels, luxury stays, and vehicle rentals in Mathura, Vrindavan, and Gokul. Your trusted partner for a spiritual journey.",

  // 4. Keywords (Helps Google categorize you)
  keywords: [
    "Mathura Hotels",
    "Vrindavan Dharamshala",
    "Bike Rental Mathura",
    "Car Rental Vrindavan",
    "Shubh Yatra",
    "Braj Tour Packages",
  ],

  // 5. OpenGraph (How your link looks on WhatsApp/Facebook)
  openGraph: {
    title: "Shubh Yatra - Travel & Stay Simplified",
    description:
      "Seamless bookings for hotels and vehicles in the heart of Braj.",
    url: "https://shubhyatra.world",
    siteName: "Shubh Yatra",
    images: [
      {
        url: "/og-image.jpg", // ✅ ACTION: Add a 1200x630px image named 'og-image.jpg' to your 'public' folder
        width: 1200,
        height: 630,
        alt: "Shubh Yatra Preview",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  // 6. Robots (Allow Google to scan your site)
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}>{children}</body>
    </html>
  );
}

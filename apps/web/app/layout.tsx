import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import FooterWrapper from "@/components/FooterWrapper";
import NavbarWrapper from "@/components/NavbarWrapper"; // ✅ 1. Import this

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shubhyatra.world"),
  title: {
    default: "Shubh Yatra | Best Stays & Travel in Mathura & Vrindavan",
    template: "%s | Shubh Yatra",
  },
  description:
    "Book affordable hotels, luxury stays, and vehicle rentals in Mathura, Vrindavan, and Gokul. Your trusted partner for a spiritual journey.",
  keywords: [
    "Mathura Hotels",
    "Vrindavan Dharamshala",
    "Bike Rental Mathura",
    "Car Rental Vrindavan",
    "Shubh Yatra",
    "Braj Tour Packages",
  ],
  openGraph: {
    title: "Shubh Yatra - Travel & Stay Simplified",
    description:
      "Seamless bookings for hotels and vehicles in the heart of Braj.",
    url: "https://shubhyatra.world",
    siteName: "Shubh Yatra",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Shubh Yatra Preview",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.className} antialiased`}>
        <NavbarWrapper />

        {children}

        <FooterWrapper />
      </body>
    </html>
  );
}

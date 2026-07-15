import "../styles/globals.css";
import Navbar from "@/components/navbar/Navbar";
import ClientProviders from "./client-providers";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import AuthToast from "@/components/auth/AuthToast";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Sporty Pulse | Home Fitness & Recovery Equipment",
    template: "%s | Sporty Pulse",
  },
  description:
    "Sporty Pulse helps you stay active and recover at home with premium fitness and recovery equipment designed for busy lifestyles.",
  keywords: [
    "home fitness equipment",
    "workout at home",
    "fitness recovery tools",
    "massage gun",
    "Sporty Pulse",
  ],
  authors: [{ name: "Sporty Pulse" }],
  creator: "Sporty Pulse",
  openGraph: {
    title: "Sporty Pulse | Home Fitness & Recovery Equipment",
    description:
      "Turn any space into your personal fitness zone with Sporty Pulse.",
    url: "https://sportypulse.co.za",
    siteName: "Sporty Pulse",
    images: [
      {
        url: "/sportsman.jpg",
        width: 1200,
        height: 630,
        alt: "At-home fitness training",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sporty Pulse",
    description: "Premium home fitness and recovery equipment for busy people.",
    images: ["/sportsman.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://sporty-pulse.vercel.app/"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={bebas.className}>
      <body className="antialiased">
        <ClientProviders>
          <Navbar />
          <AuthToast />
          {children}
          <Toaster richColors position="bottom-right" />
        </ClientProviders>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Fjalla_One, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import AppBanner from "@/components/AppBanner";
import { Colors } from "@/lib/colors";

const fjallaOne = Fjalla_One({
  weight: "400",
  variable: "--font-fjalla-one",
  subsets: ["latin"],
});

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hoppenings - Discover Brewery Events, Beer Releases & Breweries",
  description: "Your source for the latest brewery events, beer releases, and brewery information. Discover craft beer events, new releases, and local breweries.",
  keywords: "brewery events, beer releases, breweries, craft beer, beer events, brewery directory",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: "Hoppenings - Discover Brewery Events, Beer Releases & Breweries",
    description: "Your source for the latest brewery events, beer releases, and brewery information.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fjallaOne.variable} ${beVietnamPro.variable} antialiased`}
        style={{ backgroundColor: Colors.background, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        <AppBanner />
        <Navigation />
        {children}
      </body>
    </html>
  );
}

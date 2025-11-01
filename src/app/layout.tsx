import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { BUSINESS_SCHEMA } from "@/lib/seo/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Dorety Bakery',
    default: 'Dorety Bakery - Fresh Baked Goods & Pastries',
  },
  description: 'Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients. Order online for delivery or pickup.',
  keywords: ['bakery', 'fresh bread', 'pastries', 'cakes', 'desserts', 'Cairo', 'Egypt', 'delivery', 'pickup', 'online ordering'],
  authors: [{ name: 'Dorety Bakery' }],
  creator: 'Dorety Bakery',
  publisher: 'Dorety Bakery',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://doretybakery.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://doretybakery.com',
    siteName: 'Dorety Bakery',
    title: 'Dorety Bakery - Fresh Baked Goods & Pastries',
    description: 'Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Dorety Bakery - Fresh Baked Goods',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dorety Bakery - Fresh Baked Goods & Pastries',
    description: 'Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients.',
    images: ['/og-image.jpg'],
    creator: '@doretybakery',
    site: '@doretybakery',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(BUSINESS_SCHEMA),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}

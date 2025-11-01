import Link from "next/link";
import { Metadata } from "next";
import { BUSINESS_SCHEMA } from "@/lib/seo/config";
import BannerDisplay from "@/components/BannerDisplay";

export const metadata: Metadata = {
  title: "Fresh Baked Goods & Artisanal Pastries",
  description: "Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients. Order online for delivery or pickup in Cairo, Egypt.",
  keywords: [
    "bakery Cairo", 
    "fresh bread Egypt", 
    "artisanal pastries", 
    "online bakery", 
    "Cairo delivery", 
    "custom cakes", 
    "Egyptian bakery",
    "fresh daily baking",
    "quality ingredients"
  ],
  openGraph: {
    title: "Dorety Bakery - Fresh Baked Goods & Artisanal Pastries",
    description: "Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dorety Bakery - Fresh baked goods and pastries",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dorety Bakery - Fresh Baked Goods & Artisanal Pastries",
    description: "Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients.",
  },
  alternates: {
    canonical: "/",
  },
};

const HOMEPAGE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://doretybakery.com/#webpage",
  url: "https://doretybakery.com",
  name: "Dorety Bakery - Fresh Baked Goods & Artisanal Pastries",
  isPartOf: {
    "@id": "https://doretybakery.com/#website"
  },
  about: {
    "@id": "https://doretybakery.com/#organization"
  },
  description: "Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients.",
  breadcrumb: {
    "@id": "https://doretybakery.com/#breadcrumb"
  },
  inLanguage: "en-US",
  potentialAction: [
    {
      "@type": "ReadAction",
      target: ["https://doretybakery.com"]
    }
  ]
};

export default async function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(HOMEPAGE_SCHEMA),
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Hero Section with Banners */}
        <div className="mb-8">
          <BannerDisplay position="HERO" className="w-full max-w-7xl mx-auto" />
        </div>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="text-center">
                <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                  Welcome to{" "}
                  <span className="text-amber-600">Dorety Bakery</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Freshly baked goods, artisanal pastries, and delicious treats made with love and the finest ingredients. Serving Cairo with quality and tradition since day one.
                </p>
                
                <div className="flex gap-4 justify-center flex-col sm:flex-row">
                  <Link
                    href="/products"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    aria-label="Browse our fresh baked products"
                  >
                    Browse Our Products
                  </Link>
                  <Link
                    href="/about"
                    className="border border-amber-600 text-amber-600 hover:bg-amber-50 font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    aria-label="Learn more about Dorety Bakery"
                  >
                    Learn More
                  </Link>
                </div>
              </div>

              {/* Features */}
              <section className="mt-20" aria-labelledby="features-heading">
                <h2 id="features-heading" className="sr-only">Our Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <div className="mx-auto h-12 w-12 text-amber-600 mb-4" aria-hidden="true">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Fresh Daily</h3>
                    <p className="text-gray-600">All our products are baked fresh every morning using traditional recipes and premium ingredients.</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <div className="mx-auto h-12 w-12 text-amber-600 mb-4" aria-hidden="true">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Made with Love</h3>
                    <p className="text-gray-600">Every item is crafted with care and attention to detail by our expert bakers with years of experience.</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <div className="mx-auto h-12 w-12 text-amber-600 mb-4" aria-hidden="true">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
                    <p className="text-gray-600">Quick and reliable delivery throughout Cairo to bring our delicious treats right to your door.</p>
                  </div>
                </div>
              </section>

              {/* Call to Action */}
              <section className="mt-20 bg-white rounded-2xl p-8 shadow-lg text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Order?</h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  Browse our selection of fresh-baked goods and place your order for delivery or pickup. 
                  Experience the taste of authentic, artisanal baking.
                </p>
                <div className="flex gap-4 justify-center flex-col sm:flex-row">
                  <Link
                    href="/products"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  >
                    Order Now
                  </Link>
                  <Link
                    href="/register"
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Create Account
                  </Link>
                </div>
              </section>
            </div>

            {/* Sidebar with Banners */}
            <div className="lg:col-span-1">
              <BannerDisplay position="SIDEBAR" className="sticky top-4" />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

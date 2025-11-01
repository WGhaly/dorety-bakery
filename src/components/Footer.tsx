import React from 'react';
import Link from 'next/link';
import { SiteName, ContactInfo, BusinessHours, PickupAddress } from './SettingsDisplay';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Business Info */}
          <div>
            <SiteName as="h3" className="text-lg font-semibold mb-4" />
            <div className="space-y-2">
              <div>
                <ContactInfo type="email" as="a" className="hover:text-orange-400 transition-colors duration-200" />
              </div>
              <div>
                <ContactInfo type="phone" className="text-gray-300" />
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
            <BusinessHours className="text-gray-300 space-y-1" />
          </div>

          {/* Pickup Location */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pickup Location</h3>
            <PickupAddress className="text-gray-300" />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Shop</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="/products" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link href="/specials" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Daily Specials
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Account</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="/profile" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Order History
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Favorites
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Support</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="/help" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Legal</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/refunds" className="text-gray-300 hover:text-orange-400 transition-colors duration-200">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} <SiteName />. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
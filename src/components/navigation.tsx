'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CartIcon } from "@/components/cart/cart-icon";

export function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-amber-600 hover:text-amber-700">
              Fadi&apos;s Bakery
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                href="/products"
                className="text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Products
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                <CartIcon />
                
                {/* User Menu */}
                <div className="flex items-center space-x-1">
                  <Link
                    href="/addresses"
                    className="text-gray-700 hover:text-amber-600 px-3 py-2 transition-colors text-sm font-medium"
                  >
                    Addresses
                  </Link>
                  <Link
                    href="/orders"
                    className="text-gray-700 hover:text-amber-600 px-3 py-2 transition-colors text-sm font-medium"
                  >
                    Orders
                  </Link>
                </div>
                
                <span className="text-gray-800 text-sm font-medium">Welcome, {session.user.name}</span>
                <Link
                  href="/dashboard"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/products"
                  className="text-gray-700 hover:text-amber-600 px-3 py-2 transition-colors text-sm font-medium"
                >
                  Products
                </Link>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-amber-600 px-3 py-2 transition-colors text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
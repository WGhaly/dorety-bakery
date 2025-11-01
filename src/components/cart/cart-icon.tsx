'use client';

import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';

interface CartIconProps {
  className?: string;
  showCount?: boolean;
}

export function CartIcon({ className = "", showCount = true }: CartIconProps) {
  const { totalItems, loading } = useCart();

  return (
    <Link
      href="/cart"
      className={`relative inline-flex items-center p-2 text-gray-600 hover:text-amber-600 transition-colors ${className}`}
    >
      {/* Cart SVG Icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.4 8H19M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6"
        />
      </svg>

      {/* Item Count Badge */}
      {showCount && totalItems > 0 && !loading && (
        <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}

      {/* Loading indicator */}
      {loading && (
        <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </span>
      )}
    </Link>
  );
}
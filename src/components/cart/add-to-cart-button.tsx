'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/formatCurrency';

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  showPrice?: boolean;
  productPrice?: number;
}

export function AddToCartButton({ 
  productId, 
  quantity = 1, 
  disabled = false,
  className = "",
  variant = 'primary',
  size = 'md',
  children,
  showPrice = false,
  productPrice = 0
}: AddToCartButtonProps) {
  const { data: session } = useSession();
  const { addItem, loading, inCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    const success = await addItem(productId, quantity);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    
    setIsAdding(false);
  };

  const isInCart = inCart(productId);
  const isDisabled = disabled || loading || isAdding;
  const totalPrice = showPrice && productPrice ? formatCurrency(productPrice * quantity) : null;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-200
    disabled:cursor-not-allowed disabled:opacity-60
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim();

  if (showSuccess) {
    return (
      <button
        className={`${baseClasses} bg-green-600 hover:bg-green-600`}
        disabled
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Added to Cart!
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={baseClasses}
    >
      {isAdding ? (
        <>
          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Adding...
        </>
      ) : isInCart ? (
        <>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {children || 'Add Another'}
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.4 8H19M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
          </svg>
          {children || (totalPrice ? `Add to Cart - ${totalPrice}` : 'Add to Cart')}
        </>
      )}
    </button>
  );
}
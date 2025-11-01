'use client';

import { useCart } from '@/hooks/use-cart';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useState } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';

export default function CartPage() {
  const { data: session, status } = useSession();
  const { 
    cart, 
    loading, 
    error, 
    isEmpty, 
    updateItemQuantity, 
    removeItem, 
    clearCart,
    subTotal,
    totalItems 
  } = useCart();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityUpdate = async (cartItemId: string, newQuantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    await updateItemQuantity(cartItemId, newQuantity);
    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(cartItemId);
      return next;
    });
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    await removeItem(cartItemId);
    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(cartItemId);
      return next;
    });
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex space-x-4 p-4 border rounded-lg">
                  <div className="w-20 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.4 8H19M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-800 mb-8">Start shopping to add items to your cart.</p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-lg font-medium"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Cart</h1>
            <p className="text-red-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h1>
          {!isEmpty && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cart?.items.map((item) => {
                const isUpdating = updatingItems.has(item.id);
                
                return (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.media.length > 0 ? (
                          <OptimizedImage
                            src={item.product.media[0]}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        <Link 
                          href={`/products/${item.product.slug}`}
                          className="hover:text-amber-600"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      <p className="text-gray-800">{formatCurrency(item.price)} each</p>
                      
                      {/* Stock status */}
                      {!item.product.inStock && (
                        <p className="text-sm text-red-600 mt-1">Out of stock</p>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityUpdate(item.id, Math.max(1, item.quantity - 1))}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      
                      <span className="w-12 text-center font-medium">
                        {isUpdating ? (
                          <div className="w-4 h-4 mx-auto border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          item.quantity
                        )}
                      </span>
                      
                      <button
                        onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <p className="text-lg font-medium text-gray-900">
                        {formatCurrency(item.lineTotal)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating}
                        className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
                <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-800">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Delivery Fee</span>
                  <span className="font-medium">TBD</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(subTotal)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-amber-600 text-white py-3 px-6 rounded-md font-medium hover:bg-amber-700 transition-colors block text-center"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="w-full mt-3 bg-gray-200 text-gray-800 py-3 px-6 rounded-md font-medium hover:bg-gray-300 transition-colors block text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
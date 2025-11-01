'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';

interface Product {
  id: string;
  name: string;
  price: number;
  stockQty?: number;
}

interface ClientActionsProps {
  product: Product;
}

export default function ClientActions({ product }: ClientActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);
  const { addItem, loading } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
    console.log('Quantity changing from', quantity, 'to', newQuantity);
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    console.log('Add to cart clicked for quantity:', quantity);
    
    const success = await addItem(product.id, quantity);
    
    if (success) {
      alert(`Added ${quantity} ${product.name} to cart!`);
    } else {
      alert('Failed to add to cart. Please try again.');
    }
  };

  // Calculate total price
  const totalPrice = (product.price * quantity).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
          Quantity:
        </label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
          max={Math.min(99, product.stockQty || 99)}
          className="w-20 rounded-md border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500 text-center"
          suppressHydrationWarning
        />
      </div>
      
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full py-3 px-6 bg-amber-600 text-white text-lg font-medium rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
        suppressHydrationWarning
      >
        {loading ? 'Adding...' : (mounted ? `Add to Cart - $${totalPrice}` : `Add to Cart - $${product.price.toFixed(2)}`)}
      </button>
    </div>
  );
}
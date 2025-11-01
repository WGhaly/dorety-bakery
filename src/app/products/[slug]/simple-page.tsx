'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';

interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  sku?: string;
  slug: string;
  media: string[];
  badges: string[];
  allergens: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  stockQty?: number;
  inventoryTrackingEnabled: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  salesCount: number;
}

export default function SimpleProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { addItem, loading: cartLoading } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        const slug = params.slug as string;
        console.log('Loading product with slug:', slug);
        
        const response = await fetch(`/api/products?search=${slug}&limit=1`);
        const data = await response.json();
        const foundProduct = data.products.find((p: Product) => p.slug === slug);
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    if (params.slug) {
      loadProduct();
    }
  }, [params.slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    const success = await addItem(product.id, quantity);
    
    if (success) {
      alert(`Added ${quantity} ${product.name} to cart!`);
    } else {
      alert('Failed to add to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const inStock = !product.inventoryTrackingEnabled || (product.stockQty && product.stockQty > 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href="/products" className="text-gray-500 hover:text-gray-700">Products</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.media.length > 0 ? (
                <Image
                  src={product.media[0]}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">{product.category.name}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {product.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-block px-3 py-1 text-sm font-medium bg-amber-200 text-amber-900 rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-3xl font-bold text-gray-900 mb-6">${product.price.toFixed(2)}</p>

              {/* Stock Status */}
              <div className="mb-6">
                {inStock ? (
                  <div className="flex items-center text-green-600">
                    <span className="font-medium">In stock</span>
                    {product.inventoryTrackingEnabled && product.stockQty && (
                      <span className="ml-2 text-gray-600">({product.stockQty} available)</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <span className="font-medium">Out of stock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            {inStock && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={Math.min(99, product.stockQty || 99)}
                    className="w-20 rounded-md border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500 text-center"
                  />
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="w-full py-3 px-6 bg-amber-600 text-white text-lg font-medium rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading ? 'Adding...' : `Add to Cart - ${(product.price * quantity).toFixed(2)}`}
                </button>
              </div>
            )}

            {/* Description */}
            <div className="space-y-4">
              {product.shortDescription && (
                <p className="text-lg text-gray-700">{product.shortDescription}</p>
              )}
              
              {product.longDescription && (
                <p className="text-gray-600">{product.longDescription}</p>
              )}
            </div>

            {/* Allergens */}
            {product.allergens.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Allergen Information</h3>
                <div className="flex flex-wrap gap-2">
                  {product.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="inline-block px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full border border-red-200 font-medium"
                    >
                      Contains {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
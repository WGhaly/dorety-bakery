'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/structured-data';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { formatCurrency } from '@/lib/formatCurrency';

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

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  console.log('ProductPage component mounted with params:', params);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      const slug = params.slug as string;
      console.log('Fetching product with slug:', slug);
      
      if (!slug) {
        throw new Error('No slug provided');
      }
      
      // First try to find by slug
      const response = await fetch(`/api/products?search=${slug}&limit=1`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();
      const foundProduct = data.products.find((p: Product) => p.slug === slug);
      
      if (!foundProduct) {
        throw new Error('Product not found');
      }

      setProduct(foundProduct);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect called with params.slug:', params.slug);
    if (params.slug) {
      console.log('Calling fetchProduct...');
      fetchProduct();
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
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
  const lowStock = product.inventoryTrackingEnabled && product.stockQty && product.stockQty <= 5;

  // Generate structured data
  const productStructuredData = product ? generateProductStructuredData(product) : null;
  const breadcrumbStructuredData = product ? generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category.name, url: `/products/category/${product.category.slug}` },
    { name: product.name }
  ]) : null;

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Head */}
      {product && productStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
        />
      )}
      {product && breadcrumbStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/products" className="text-gray-500 hover:text-gray-700">
                Products
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                href={`/products/category/${product.category.slug}`}
                className="text-gray-500 hover:text-gray-700"
              >
                {product.category.name}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.media.length > 0 ? (
                <Image
                  src={product.media[selectedImageIndex]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {product.media.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.media.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-amber-500' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-600">{product.category.name}</span>
                {product.sku && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">SKU: {product.sku}</span>
                  </>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              {/* Badges */}
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

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                {product.salesCount > 0 && (
                  <span className="text-sm text-gray-600">
                    {product.salesCount} sold
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {inStock ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">
                      {lowStock ? 'Low stock' : 'In stock'}
                    </span>
                    {product.inventoryTrackingEnabled && product.stockQty && (
                      <span className="ml-2 text-gray-600">
                        ({product.stockQty} available)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Out of stock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Cart */}
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
                
                <AddToCartButton 
                  productId={product.id}
                  quantity={quantity}
                  className="w-full py-3 text-lg font-medium"
                  showPrice={true}
                  productPrice={product.price}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-4">
              {product.shortDescription && (
                <p className="text-lg text-gray-700">{product.shortDescription}</p>
              )}
              
              {product.longDescription && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600">{product.longDescription}</p>
                </div>
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

            {/* Nutrition */}
            {product.nutrition && Object.keys(product.nutrition).length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Nutrition Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.nutrition.calories && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calories:</span>
                      <span className="font-medium">{product.nutrition.calories}</span>
                    </div>
                  )}
                  {product.nutrition.protein && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Protein:</span>
                      <span className="font-medium">{product.nutrition.protein}g</span>
                    </div>
                  )}
                  {product.nutrition.carbs && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carbs:</span>
                      <span className="font-medium">{product.nutrition.carbs}g</span>
                    </div>
                  )}
                  {product.nutrition.fat && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fat:</span>
                      <span className="font-medium">{product.nutrition.fat}g</span>
                    </div>
                  )}
                  {product.nutrition.fiber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fiber:</span>
                      <span className="font-medium">{product.nutrition.fiber}g</span>
                    </div>
                  )}
                  {product.nutrition.sugar && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sugar:</span>
                      <span className="font-medium">{product.nutrition.sugar}g</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">More from {product.category.name}</h2>
          <div className="text-center text-gray-500">
            Related products coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
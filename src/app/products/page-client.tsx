'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { formatCurrency } from '@/lib/formatCurrency';

interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  price: number;
  slug: string;
  media: string[];
  badges: string[];
  allergens: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  salesCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
  initialPagination: Pagination | null;
}

export default function ProductsPageClient({
  initialProducts = [],
  initialCategories = [],
  initialPagination = null
}: ProductsPageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false); // Start with false since we have initial data
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [pagination, setPagination] = useState<Pagination | null>(initialPagination);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        isActive: 'true',
        sortBy,
        sortOrder: 'desc',
        ...(search && { search }),
        ...(categoryFilter && { categoryId: categoryFilter }),
      });

      const response = await fetch(`/api/products?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data: ProductsResponse = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Only fetch if filters change (skip initial load since we have server data)
  useEffect(() => {
    // Only fetch if we have filters or different page than initial
    if (search || categoryFilter || sortBy !== 'createdAt' || page !== 1) {
      fetchProducts();
    }
  }, [page, search, categoryFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Our Products
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-600">
            Freshly baked goods made with love and the finest ingredients
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-gray-50 rounded-lg p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
            {/* Search */}
            <div className="md:col-span-2 lg:col-span-6">
              <label htmlFor="search" className="block text-sm font-medium text-gray-800 mb-2">
                Search Products
              </label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Search for bread, pastries, cakes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-3 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm placeholder-gray-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>
            </div>
            
            {/* Category Filter */}
            <div className="lg:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-800 mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 py-3 pl-4 pr-8 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Sort Filter */}
            <div className="lg:col-span-3">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-800 mb-2">
                Sort By
              </label>
              <div className="relative">
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 py-3 pl-4 pr-8 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm appearance-none bg-white"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="price">Price (Low-High)</option>
                  <option value="-price">Price (High-Low)</option>
                  <option value="salesCount">Most Popular</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Filters */}
          {(search || categoryFilter) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500">Active filters:</span>
                {search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-900">
                    Search: &quot;{search}&quot;
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-200 hover:bg-amber-300 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Category: {categories.find(c => c.id === categoryFilter)?.name}
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('')}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setPage(1);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Categories Grid */}
        {!search && !categoryFilter && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products/category/${category.slug}`}
                  className="group relative bg-gray-100 rounded-lg p-4 md:p-6 hover:bg-gray-200 transition-colors"
                >
                  <div className="text-center">
                    <h3 className="text-sm md:text-lg font-medium text-gray-800 group-hover:text-amber-700 transition-colors">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs md:text-sm text-gray-600">
                      {category.productCount || 0} products
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pageNum
                        ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No products found</div>
            <p className="mt-2 text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Product Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square bg-gray-100 relative">
          {product.media.length > 0 ? (
            <OptimizedImage
              src={product.media[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          
          {/* Badges */}
          {product.badges.length > 0 && (
            <div className="absolute top-2 left-2 space-y-1">
              {product.badges.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="inline-block px-2 py-1 text-xs font-medium bg-amber-200 text-amber-900 rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Product Info - Flex grow to fill remaining space */}
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/products/${product.slug}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-800 group-hover:text-amber-700 transition-colors line-clamp-2">
                {product.name}
              </h3>
              {product.shortDescription && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {product.shortDescription}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {product.category.name}
              </p>
            </div>
            <div className="ml-4 text-right flex-shrink-0">
              <p className="text-lg font-bold text-gray-800">
                EGP {product.price.toFixed(2)}
              </p>
              {product.salesCount > 0 && (
                <p className="text-xs text-gray-500">
                  {product.salesCount} sold
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Allergens */}
        {product.allergens.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {product.allergens.slice(0, 3).map((allergen) => (
              <span
                key={allergen}
                className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded font-medium"
              >
                {allergen}
              </span>
            ))}
            {product.allergens.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded font-medium">
                +{product.allergens.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Spacer to push quantity and add to cart to bottom */}
        <div className="flex-grow"></div>

        {/* Quantity Selector and Add to Cart - Always at bottom */}
        <div className="space-y-3 mt-auto">
          <div className="flex items-center justify-between">
            <label htmlFor={`quantity-${product.id}`} className="text-sm font-medium text-gray-700">
              Quantity:
            </label>
            <input
              type="number"
              id={`quantity-${product.id}`}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="99"
              className="w-20 rounded border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500 text-center"
            />
          </div>
          
          <AddToCartButton 
            productId={product.id}
            quantity={quantity}
            showPrice={true}
            productPrice={product.price}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
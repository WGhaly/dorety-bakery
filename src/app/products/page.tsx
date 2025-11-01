import type { Metadata } from 'next';
import { generateProductsMetadata } from '@/lib/metadata';
import ProductsPageClient from './page-client';

export const metadata: Metadata = generateProductsMetadata();

// Fetch products on server-side
async function getProducts() {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/products?page=1&limit=12&isActive=true&sortBy=createdAt&sortOrder=desc`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    return response.json();
  } catch (error) {
    console.error('Server-side product fetch error:', error);
    return { products: [], pagination: null };
  }
}

async function getCategories() {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/categories`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return response.json();
  } catch (error) {
    console.error('Server-side categories fetch error:', error);
    return { categories: [] };
  }
}

export default async function ProductsPage() {
  // Fetch data on server-side to avoid hydration issues
  const [productsData, categoriesData] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <ProductsPageClient 
      initialProducts={productsData.products || []}
      initialCategories={categoriesData.categories || []}
      initialPagination={productsData.pagination}
    />
  );
}
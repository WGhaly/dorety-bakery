import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://doretybakery.com';

interface SitemapProduct {
  slug: string;
  updatedAt?: string;
}

interface SitemapCategory {
  slug: string;
  updatedAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Static pages with SEO priority
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${BASE_URL}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/cart`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${BASE_URL}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      {
        url: `${BASE_URL}/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      {
        url: `${BASE_URL}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
    ];

    // Fetch dynamic content from database
    const [cmsPages, categories, products] = await Promise.all([
      prisma.page.findMany({
        where: {
          status: 'PUBLISHED',
        },
        select: {
          slug: true,
          updatedAt: true,
          type: true,
        },
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
    ]);

    // CMS pages from content management
    const cmsPagesMap: MetadataRoute.Sitemap = cmsPages.map((page: { slug: string; updatedAt: Date; type: string }) => ({
      url: `${BASE_URL}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: page.type === 'STATIC' ? 'monthly' : 'weekly',
      priority: page.type === 'LANDING' ? 0.8 : 0.6,
    }));

    // Product categories
    const categoriesMap: MetadataRoute.Sitemap = categories.map((category: { slug: string; updatedAt: Date }) => ({
      url: `${BASE_URL}/products/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Individual products
    const productsMap: MetadataRoute.Sitemap = products.map((product: { slug: string; updatedAt: Date }) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Combine all pages
    return [
      ...staticPages,
      ...cmsPagesMap,
      ...categoriesMap,
      ...productsMap,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback to API calls if database is unavailable
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/products?limit=1000`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/categories`)
      ]);

      const productsData = productsResponse.ok ? await productsResponse.json() : { products: [] };
      const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : { categories: [] };

      const staticPages = [
        {
          url: BASE_URL,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 1,
        },
        {
          url: `${BASE_URL}/products`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        },
      ];

      const productPages = productsData.products.map((product: SitemapProduct) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

      const categoryPages = categoriesData.categories.map((category: SitemapCategory) => ({
        url: `${BASE_URL}/products/category/${category.slug}`,
        lastModified: new Date(category.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

      return [...staticPages, ...productPages, ...categoryPages];
    } catch (fallbackError) {
      console.error('Fallback sitemap generation failed:', fallbackError);
      
      // Return minimal sitemap if all else fails
      return [
        {
          url: BASE_URL,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 1,
        },
        {
          url: `${BASE_URL}/products`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        },
      ];
    }
  }
}
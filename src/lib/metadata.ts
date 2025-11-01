import type { Metadata } from 'next';

interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  slug: string;
  media: string[];
  category: {
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  products: Product[];
}

export function generateProductMetadata(product: Product): Metadata {
  const title = `${product.name} | Dorety Bakery`;
  const description = product.shortDescription || product.longDescription || `Fresh ${product.name} from Dorety Bakery. Order online for pickup or delivery.`;
  const images = product.media.length > 0 ? [product.media[0]] : [];
  
  return {
    title,
    description,
    keywords: [
      product.name,
      product.category.name,
      'bakery',
      'fresh baked',
      'Dorety Bakery',
      'order online',
      'pickup',
      'delivery'
    ],
    openGraph: {
      title,
      description,
      images,
      type: 'website',
      siteName: 'Dorety Bakery',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'USD',
      'product:availability': 'in stock',
      'product:category': product.category.name,
    },
  };
}

export function generateCategoryMetadata(category: Category): Metadata {
  const title = `${category.name} | Dorety Bakery`;
  const description = category.description || `Browse our selection of fresh ${category.name.toLowerCase()} at Dorety Bakery. ${category.products.length} products available for order.`;
  
  return {
    title,
    description,
    keywords: [
      category.name,
      'bakery products',
      'fresh baked',
      'Dorety Bakery',
      'order online',
      'pickup',
      'delivery'
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Dorety Bakery',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/products/category/${category.slug}`,
    },
  };
}

export function generateProductsMetadata(): Metadata {
  return {
    title: 'Our Products | Dorety Bakery',
    description: 'Browse our complete selection of fresh baked goods, pastries, breads, and desserts. Order online for pickup or delivery from Dorety Bakery.',
    keywords: [
      'bakery products',
      'fresh baked goods',
      'pastries',
      'breads',
      'desserts',
      'Dorety Bakery',
      'order online',
      'pickup',
      'delivery'
    ],
    openGraph: {
      title: 'Our Products | Dorety Bakery',
      description: 'Browse our complete selection of fresh baked goods, pastries, breads, and desserts. Order online for pickup or delivery from Dorety Bakery.',
      type: 'website',
      siteName: 'Dorety Bakery',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title: 'Our Products | Dorety Bakery',
      description: 'Browse our complete selection of fresh baked goods, pastries, breads, and desserts.',
    },
    alternates: {
      canonical: '/products',
    },
  };
}
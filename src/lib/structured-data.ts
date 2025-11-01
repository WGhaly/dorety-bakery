interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  slug: string;
  media: string[];
  badges: string[];
  allergens: string[];
  sku?: string;
  inventoryTrackingEnabled: boolean;
  stockQty?: number;
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
  description?: string;
  slug: string;
  products: Product[];
}

export function generateProductStructuredData(product: Product) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doretybakery.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.longDescription || `Fresh ${product.name} from Dorety Bakery`,
    image: product.media.map(url => `${baseUrl}${url}`),
    brand: {
      '@type': 'Brand',
      name: 'Dorety Bakery'
    },
    category: product.category.name,
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: (!product.inventoryTrackingEnabled || (product.stockQty && product.stockQty > 0)) 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Dorety Bakery'
      }
    },
    aggregateRating: product.salesCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      bestRating: '5',
      worstRating: '1',
      ratingCount: Math.max(1, Math.floor(product.salesCount / 3))
    } : undefined,
    additionalProperty: [
      ...(product.allergens.length > 0 ? [{
        '@type': 'PropertyValue',
        name: 'Allergens',
        value: product.allergens.join(', ')
      }] : []),
      ...(product.badges.length > 0 ? [{
        '@type': 'PropertyValue',
        name: 'Features',
        value: product.badges.join(', ')
      }] : [])
    ]
  };
}

export function generateCategoryStructuredData(category: Category) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doretybakery.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description || `Browse our selection of ${category.name.toLowerCase()} at Dorety Bakery`,
    url: `${baseUrl}/products/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: category.products.length,
      itemListElement: category.products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.shortDescription || `Fresh ${product.name}`,
          image: product.media.length > 0 ? `${baseUrl}${product.media[0]}` : undefined,
          url: `${baseUrl}/products/${product.slug}`,
          offers: {
            '@type': 'Offer',
            price: product.price.toFixed(2),
            priceCurrency: 'USD'
          }
        }
      }))
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: `${baseUrl}/products`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: `${baseUrl}/products/category/${category.slug}`
        }
      ]
    }
  };
}

export function generateBreadcrumbStructuredData(items: Array<{name: string, url?: string}>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doretybakery.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${baseUrl}${item.url}` : undefined
    }))
  };
}

export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: 'Dorety Bakery',
    description: 'Fresh baked goods, pastries, breads, and desserts made daily with the finest ingredients.',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://doretybakery.com',
    telephone: '+1-555-0123',
    email: 'info@doretybakery.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Bakery Street',
      addressLocality: 'Your City',
      addressRegion: 'Your State',
      postalCode: '12345',
      addressCountry: 'US'
    },
    openingHours: [
      'Mo-Fr 07:00-19:00',
      'Sa 08:00-18:00',
      'Su 09:00-17:00'
    ],
    servesCuisine: 'Bakery',
    priceRange: '$',
    hasMenu: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://doretybakery.com'}/products`
  };
}
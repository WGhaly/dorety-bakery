import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ClientActions from './client-actions';

interface Props {
  params: { slug: string };
}

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

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products?search=${slug}&limit=1`, {
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.products.find((p: Product) => p.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  if (!product) {
    return {
      title: 'Product Not Found | Dorety Bakery',
      description: 'The requested product could not be found.'
    };
  }

  const title = `${product.name} | Dorety Bakery`;
  const description = product.shortDescription || product.longDescription || `Fresh ${product.name} from Dorety Bakery. Order online for pickup or delivery.`;
  
  return {
    title,
    description,
    keywords: [
      product.name,
      product.category.name,
      'bakery',
      'fresh baked',
      'Dorety Bakery',
      'order online'
    ],
    openGraph: {
      title,
      description,
      images: product.media.length > 0 ? [product.media[0]] : [],
      type: 'website',
      siteName: 'Dorety Bakery',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.media.length > 0 ? [product.media[0]] : [],
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The requested product could not be found.</p>
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

            {/* Quantity and Add to Cart - Client Component */}
            {inStock && (
              <ClientActions key={product.id} product={product} />
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
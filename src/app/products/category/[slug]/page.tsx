import type { Metadata } from 'next';
import CategoryPageComponent from './page-component';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    // Fetch category data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/categories/slug/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return {
        title: 'Category Not Found | Dorety Bakery',
        description: 'The requested category could not be found.'
      };
    }

    const data = await response.json();
    const category = data.category;
    const products = data.products || [];
    
    if (!category) {
      return {
        title: 'Category Not Found | Dorety Bakery',
        description: 'The requested category could not be found.'
      };
    }

    const title = `${category.name} | Dorety Bakery`;
    const productsCount = products.length;
    const description = category.description || `Browse our selection of fresh ${category.name.toLowerCase()} at Dorety Bakery. ${productsCount} products available for order.`;
    
    return {
      title,
      description,
      keywords: [
        category.name,
        'bakery products',
        'fresh baked',
        'Dorety Bakery',
        'order online'
      ],
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'Dorety Bakery',
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
  } catch (error) {
    return {
      title: 'Category | Dorety Bakery',
      description: 'Browse our bakery products organized by category.'
    };
  }
}

export default function CategoryPage() {
  return <CategoryPageComponent />;
}
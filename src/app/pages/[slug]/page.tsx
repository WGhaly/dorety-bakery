import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";

interface PageProps {
  params: {
    slug: string;
  };
}

async function getPage(slug: string) {
  try {
    const page = await prisma.page.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
    });

    return page;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getPage(params.slug);

  if (!page) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || page.title,
    keywords: page.metaKeywords?.split(",").map((k: string) => k.trim()) || [],
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || page.title,
      type: "article",
      images: page.featuredImage ? [
        {
          url: page.featuredImage,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || page.title,
    },
    alternates: {
      canonical: `/pages/${page.slug}`,
    },
  };
}

export default async function PageDisplay({ params }: PageProps) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.excerpt || page.metaDescription,
    author: {
      "@type": "Organization",
      name: "Dorety Bakery",
    },
    publisher: {
      "@type": "Organization",
      name: "Dorety Bakery",
      logo: {
        "@type": "ImageObject",
        url: "https://doretybakery.com/logo.png",
      },
    },
    datePublished: page.createdAt.toISOString(),
    dateModified: page.updatedAt.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://doretybakery.com/pages/${page.slug}`,
    },
    ...(page.featuredImage && {
      image: {
        "@type": "ImageObject",
        url: page.featuredImage,
        height: 630,
        width: 1200,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema),
        }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <header className="mb-8">
            {page.featuredImage && (
              <div className="mb-6">
                <Image
                  src={page.featuredImage}
                  alt={page.title}
                  width={800}
                  height={256}
                  className="w-full h-64 object-cover rounded-lg shadow-sm"
                />
              </div>
            )}
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
              
              {page.excerpt && (
                <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
                  {page.excerpt}
                </p>
              )}
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span className="capitalize">
                  {page.type.toLowerCase().replace('_', ' ')}
                </span>
                <span>•</span>
                <time dateTime={page.updatedAt.toISOString()}>
                  Last updated {new Date(page.updatedAt).toLocaleDateString()}
                </time>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="bg-white rounded-lg shadow-sm p-8">
            <div 
              className="prose prose-lg max-w-none
                         prose-headings:text-gray-900 
                         prose-p:text-gray-700 prose-p:leading-relaxed
                         prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
                         prose-strong:text-gray-900
                         prose-ul:text-gray-700 prose-ol:text-gray-700
                         prose-li:text-gray-700
                         prose-blockquote:border-amber-200 prose-blockquote:text-gray-600
                         prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                         prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </main>

          {/* Page Footer */}
          <footer className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Visit Dorety Bakery
              </h2>
              <p className="text-gray-600 mb-4">
                Experience our fresh baked goods and artisanal pastries in person or order online.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/products"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Browse Products
                </Link>
                <a
                  href="/contact"
                  className="border border-amber-600 text-amber-600 hover:bg-amber-50 px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/categories/slug/[slug] - Get category by slug with products (public route)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Find category by slug
    const category = await prisma.category.findUnique({
      where: { 
        slug,
        isActive: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build product where clause
    const productWhere: Prisma.ProductWhereInput = {
      categoryId: category.id,
      isActive: true,
    };

    if (search) {
      productWhere.OR = [
        { name: { contains: search } },
        { shortDescription: { contains: search } },
        { longDescription: { contains: search } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    (orderBy as Record<string, Prisma.SortOrder>)[sortBy] = sortOrder as Prisma.SortOrder;

    const [products, totalProductCount] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        include: {
          _count: {
            select: {
              orderItems: true,
              cartItems: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where: productWhere }),
    ]);

    // Parse JSON fields for products
    const productsWithParsedData = products.map((product) => {
      // Type assertion since TypeScript can't infer the included _count
      const productWithCount = product as typeof product & { _count: { orderItems: number; cartItems: number } };
      let media = [];
      let allergens = [];
      let badges = [];
      let nutrition = null;

      try {
        media = productWithCount.media ? JSON.parse(productWithCount.media) : [];
      } catch (e) {
        media = [];
      }

      try {
        allergens = productWithCount.allergens ? JSON.parse(productWithCount.allergens) : [];
      } catch (e) {
        allergens = [];
      }

      try {
        badges = productWithCount.badges ? JSON.parse(productWithCount.badges) : [];
      } catch (e) {
        badges = [];
      }

      try {
        nutrition = productWithCount.nutrition ? JSON.parse(productWithCount.nutrition) : null;
      } catch (e) {
        nutrition = null;
      }

      return {
        ...productWithCount,
        media,
        allergens,
        badges,
        nutrition,
        salesCount: productWithCount._count.orderItems,
        cartCount: productWithCount._count.cartItems,
      };
    });

    return NextResponse.json({
      category,
      products: productsWithParsedData,
      pagination: {
        page,
        limit,
        totalCount: totalProductCount,
        totalPages: Math.ceil(totalProductCount / limit),
        hasNext: page * limit < totalProductCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
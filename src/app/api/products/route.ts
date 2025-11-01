import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import slug from 'slug';
import { Prisma } from '@prisma/client';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  media: z.array(z.string()).default([]),
  sku: z.string().optional(),
  isActive: z.boolean().default(true),
  inventoryTrackingEnabled: z.boolean().default(true),
  stockQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    sugar: z.number().optional(),
  }).optional(),
  allergens: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
});

// GET /api/products - List products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortDescription: { contains: search } },
        { longDescription: { contains: search } },
        { sku: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    
    // Handle special sort cases
    if (sortBy === 'salesCount') {
      orderBy = {
        orderItems: {
          _count: sortOrder as Prisma.SortOrder
        }
      };
    } else if (sortBy === '-price') {
      orderBy = {
        price: 'desc'
      };
    } else {
      orderBy = {
        [sortBy]: sortOrder as Prisma.SortOrder
      };
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
      prisma.product.count({ where }),
    ]);

    // Parse JSON fields and add computed fields
    const productsWithParsedData = products.map((product) => {
      // Type assertion for complex include types
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
      products: productsWithParsedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (Admin only) OR fetch products by IDs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a request to fetch products by IDs (for guest cart)
    if (body.productIds && Array.isArray(body.productIds)) {
      // Fetch products by IDs for guest cart
      const products = await prisma.product.findMany({
        where: {
          id: { in: body.productIds },
          isActive: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Parse JSON fields
      const productsWithParsedData = products.map((product) => {
        let media = [];
        let allergens = [];
        let badges = [];
        let nutrition = null;

        try {
          media = product.media ? JSON.parse(product.media) : [];
        } catch (e) {
          media = [];
        }

        try {
          allergens = product.allergens ? JSON.parse(product.allergens) : [];
        } catch (e) {
          allergens = [];
        }

        try {
          badges = product.badges ? JSON.parse(product.badges) : [];
        } catch (e) {
          badges = [];
        }

        try {
          nutrition = product.nutrition ? JSON.parse(product.nutrition) : null;
        } catch (e) {
          nutrition = null;
        }

        return {
          ...product,
          media,
          allergens,
          badges,
          nutrition,
          inStock: !product.inventoryTrackingEnabled || (product.stockQty && product.stockQty > 0),
        };
      });

      return NextResponse.json({ products: productsWithParsedData });
    }

    // Original create product logic
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const validatedData = createProductSchema.parse(body);

    // Generate SKU if not provided
    let finalSku = validatedData.sku;
    if (!finalSku) {
      const productSlug = slug(validatedData.name);
      const timestamp = Date.now().toString().slice(-6);
      finalSku = `${productSlug}-${timestamp}`.toUpperCase();
    }

    // Check if SKU already exists
    if (finalSku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: finalSku },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      );
    }

    // Generate product slug
    const productSlug = slug(validatedData.name);
    let finalSlug = productSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${productSlug}-${counter}`;
      counter++;
    }

    // Prepare data for database
    const productData = {
      name: validatedData.name,
      shortDescription: validatedData.shortDescription,
      longDescription: validatedData.longDescription,
      price: validatedData.price,
      cost: validatedData.cost,
      categoryId: validatedData.categoryId,
      sku: finalSku,
      slug: finalSlug,
      isActive: validatedData.isActive,
      inventoryTrackingEnabled: validatedData.inventoryTrackingEnabled,
      stockQty: validatedData.stockQty,
      lowStockThreshold: validatedData.lowStockThreshold,
      media: JSON.stringify(validatedData.media),
      allergens: validatedData.allergens ? JSON.stringify(validatedData.allergens) : null,
      badges: validatedData.badges ? JSON.stringify(validatedData.badges) : null,
      nutrition: validatedData.nutrition ? JSON.stringify(validatedData.nutrition) : null,
    };

    const product = await prisma.product.create({
      data: productData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Parse JSON fields for response
    const productResponse = {
      ...product,
      media: JSON.parse(product.media),
      allergens: product.allergens ? JSON.parse(product.allergens) : [],
      badges: product.badges ? JSON.parse(product.badges) : [],
      nutrition: product.nutrition ? JSON.parse(product.nutrition) : null,
    };

    return NextResponse.json(productResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import slug from 'slug';

// Use a more flexible approach for the response type
type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  media?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
  products?: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
};

interface ProductWithCounts {
  id: string;
  name: string;
  price: number;
  media: string;
  allergens?: string;
  badges?: string;
  nutrition?: string;
  _count: {
    orderItems: number;
    cartItems: number;
  };
}

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255).optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/categories/[id] - Get single category with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        ...(includeProducts && {
          products: {
            where: {
              isActive: true,
            },
            include: {
              _count: {
                select: {
                  orderItems: true,
                  cartItems: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,
          },
        }),
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const categoryResponse: CategoryResponse = {
      ...category,
      productCount: category._count.products,
    };

    // Parse JSON fields for products if included
    if (includeProducts && category.products) {
      categoryResponse.products = category.products.map((product) => {
        // Type assertion since conditional include makes types complex
        const productWithCount = product as typeof product & { _count: { orderItems: number; cartItems: number } };
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
          salesCount: productWithCount._count.orderItems,
          cartCount: productWithCount._count.cartItems,
        };
      });
    }

    return NextResponse.json(categoryResponse);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Generate new slug if name is being updated
    let newSlug = existingCategory.slug;
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const categorySlug = slug(validatedData.name);
      let finalSlug = categorySlug;
      let counter = 1;

      // Ensure slug is unique (excluding current category)
      while (true) {
        const slugExists = await prisma.category.findUnique({
          where: { slug: finalSlug },
        });
        
        if (!slugExists || slugExists.id === id) {
          break;
        }
        
        finalSlug = `${categorySlug}-${counter}`;
        counter++;
      }
      
      newSlug = finalSlug;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...validatedData,
        slug: newSlug,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has any products
    const hasProducts = await prisma.product.findFirst({
      where: { categoryId: id },
    });

    if (hasProducts) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Move products to another category first.' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
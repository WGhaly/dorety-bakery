import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import slug from 'slug';
import { Prisma } from '@prisma/client';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// GET /api/categories - List categories with products count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const sortBy = searchParams.get('sortBy') || 'displayOrder';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build where clause
    const where: Prisma.CategoryWhereInput = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    // Build orderBy
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {};
    (orderBy as Record<string, Prisma.SortOrder>)[sortBy] = sortOrder as Prisma.SortOrder;

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy,
    });

    const categoriesWithCounts = categories.map(category => ({
      ...category,
      productCount: category._count.products,
    }));

    return NextResponse.json({
      categories: categoriesWithCounts,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Generate category slug
    const categorySlug = slug(validatedData.name);
    let finalSlug = categorySlug;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${categorySlug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        slug: finalSlug,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
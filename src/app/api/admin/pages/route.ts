import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Prisma, PageStatus, PageType } from '@prisma/client';
import { z } from 'zod';

const PageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  type: z.enum(['STATIC', 'LANDING', 'POLICY', 'BLOG']).default('STATIC'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  openGraphImage: z.string().url().optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  showInNavigation: z.boolean().default(false),
  navigationOrder: z.number().optional(),
  isHomePage: z.boolean().default(false),
  featuredImage: z.string().url().optional().or(z.literal('')),
  bannerConfig: z.string().optional(),
  sections: z.string().optional(),
});

const UpdatePageSchema = PageSchema.partial();

// GET /api/admin/pages - List all pages
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const where: Prisma.PageWhereInput = {};
    
    if (status) {
      const validStatuses: PageStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
      if (validStatuses.includes(status as PageStatus)) {
        where.status = status as PageStatus;
      }
    }
    
    if (type) {
      const validTypes: PageType[] = ['STATIC', 'LANDING', 'POLICY', 'BLOG'];
      if (validTypes.includes(type as PageType)) {
        where.type = type as PageType;
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        orderBy: [
          { navigationOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.page.count({ where }),
    ]);

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/pages - Create new page
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = PageSchema.parse(body);

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingPage) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // If setting as home page, unset current home page
    if (validatedData.isHomePage) {
      await prisma.page.updateMany({
        where: { isHomePage: true },
        data: { isHomePage: false },
      });
    }

    const page = await prisma.page.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }

    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
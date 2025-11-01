import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
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

// GET /api/admin/pages/[id] - Get single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/pages/[id] - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdatePageSchema.parse(body);

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check if slug already exists (excluding current page)
    if (validatedData.slug && validatedData.slug !== existingPage.slug) {
      const slugExists = await prisma.page.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    // If setting as home page, unset current home page
    if (validatedData.isHomePage && !existingPage.isHomePage) {
      await prisma.page.updateMany({
        where: { 
          isHomePage: true,
          id: { not: id },
        },
        data: { isHomePage: false },
      });
    }

    // Handle status change to published
    interface PageUpdateData {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      type?: 'STATIC' | 'LANDING' | 'POLICY' | 'BLOG';
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string;
      openGraphImage?: string;
      canonicalUrl?: string;
      showInNavigation?: boolean;
      navigationOrder?: number;
      isHomePage?: boolean;
      featuredImage?: string;
      bannerConfig?: string;
      sections?: string;
      updatedBy: string;
      publishedAt?: Date;
    }

    const updateData: PageUpdateData = {
      ...validatedData,
      updatedBy: session.user.id,
    };

    if (validatedData.status === 'PUBLISHED' && existingPage.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const page = await prisma.page.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }

    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/pages/[id] - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Don't allow deletion of home page
    if (existingPage.isHomePage) {
      return NextResponse.json({ error: 'Cannot delete home page' }, { status: 400 });
    }

    await prisma.page.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
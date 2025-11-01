import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const settingUpdateSchema = z.object({
  value: z.string(),
  category: z.enum(['GENERAL', 'SEO', 'SOCIAL', 'BUSINESS', 'FEATURES', 'APPEARANCE', 'ANALYTICS']).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{
    key: string;
  }>;
}

// GET /api/admin/settings/[key] - Get specific setting
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await params;

    const setting = await prisma.siteConfiguration.findFirst({
      where: { key: decodeURIComponent(key) },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 });
  }
}

// PUT /api/admin/settings/[key] - Update setting
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await params;
    const body = await request.json();
    const validatedData = settingUpdateSchema.parse(body);

    const setting = await prisma.siteConfiguration.update({
      where: { key: decodeURIComponent(key) },
      data: validatedData,
    });

    return NextResponse.json({ setting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }

    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}

// DELETE /api/admin/settings/[key] - Delete setting
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await params;

    await prisma.siteConfiguration.delete({
      where: { key: decodeURIComponent(key) },
    });

    return NextResponse.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ConfigCategory } from '@prisma/client';

const settingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(),
  category: z.enum(['GENERAL', 'SEO', 'SOCIAL', 'BUSINESS', 'FEATURES', 'APPEARANCE', 'ANALYTICS']),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

interface SettingInput {
  key: string;
  value: string;
  category: 'GENERAL' | 'SEO' | 'SOCIAL' | 'BUSINESS' | 'FEATURES' | 'APPEARANCE' | 'ANALYTICS';
  description?: string;
  isPublic?: boolean;
}

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category: category as ConfigCategory } : {};

    const settings = await prisma.siteConfiguration.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ],
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/admin/settings - Create new setting
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = settingSchema.parse(body);

    // Check if setting already exists
    const existingSetting = await prisma.siteConfiguration.findFirst({
      where: { key: validatedData.key }
    });

    if (existingSetting) {
      return NextResponse.json({ error: 'Setting key already exists' }, { status: 400 });
    }

    const setting = await prisma.siteConfiguration.create({
      data: validatedData,
    });

    return NextResponse.json({ setting }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }

    console.error('Error creating setting:', error);
    return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 });
  }
}

// PUT /api/admin/settings - Bulk update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings must be an array' }, { status: 400 });
    }

    const updatePromises = settings.map(async (setting: SettingInput) => {
      const validatedData = settingSchema.parse(setting);
      
      return prisma.siteConfiguration.upsert({
        where: { key: setting.key },
        update: {
          value: validatedData.value,
          category: validatedData.category,
          description: validatedData.description,
          isPublic: validatedData.isPublic,
        },
        create: validatedData,
      });
    });

    const updatedSettings = await Promise.all(updatePromises);

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }

    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
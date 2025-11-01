import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma, ConfigCategory } from '@prisma/client';

interface SettingValue {
  value: string;
  category: ConfigCategory;
  description: string | null;
}

// GET /api/settings - Get public settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const keys = searchParams.get('keys')?.split(',');

    const where: Prisma.SiteConfigurationWhereInput = { isPublic: true };

    if (category) {
      where.category = category as ConfigCategory;
    }

    if (keys && keys.length > 0) {
      where.key = { in: keys };
    }

    const settings = await prisma.siteConfiguration.findMany({
      where,
      select: {
        key: true,
        value: true,
        category: true,
        description: true,
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ],
    });

    // Convert to key-value map for easier consumption
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        category: setting.category,
        description: setting.description,
      };
      return acc;
    }, {} as Record<string, SettingValue>);

    return NextResponse.json({ 
      settings: settingsMap,
      count: settings.length 
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
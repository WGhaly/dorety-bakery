import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma, TargetUserType } from '@prisma/client';

// GET /api/banners - Get active banners for public display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'home';
    const userType = searchParams.get('userType') || 'ALL';

    const now = new Date();
    
    const where: Prisma.BannerWhereInput = {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    // Filter by target user type
    if (userType !== 'ALL') {
      // Validate userType is a valid TargetUserType
      const validUserTypes: TargetUserType[] = ['ALL', 'CUSTOMERS', 'GUESTS', 'NEW_CUSTOMERS'];
      const validUserType = validUserTypes.includes(userType as TargetUserType) ? userType as TargetUserType : 'ALL';
      
      where.targetUserType = {
        in: ['ALL' as TargetUserType, validUserType],
      };
    }

    // Filter by target pages if specified
    if (page !== 'all') {
      where.OR = [
        { targetPages: null },
        { targetPages: { contains: page } },
      ];
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: {
        priority: 'desc',
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        content: true,
        imageUrl: true,
        buttonText: true,
        buttonUrl: true,
      },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching public banners:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/banners/track - Track banner interactions
export async function POST(request: NextRequest) {
  try {
    const { bannerId, action } = await request.json();

    if (!bannerId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'impression') {
      await prisma.banner.update({
        where: { id: bannerId },
        data: {
          impressions: {
            increment: 1,
          },
        },
      });
    } else if (action === 'click') {
      await prisma.banner.update({
        where: { id: bannerId },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking banner interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
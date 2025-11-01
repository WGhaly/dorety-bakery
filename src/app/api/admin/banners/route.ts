import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Prisma, TargetUserType } from '@prisma/client';
import { z } from 'zod';

const BannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  targetPages: z.string().optional(),
  targetUserType: z.enum(['ALL', 'CUSTOMERS', 'GUESTS', 'NEW_CUSTOMERS']).default('ALL'),
});

const UpdateBannerSchema = BannerSchema.partial();

// GET /api/admin/banners - List all banners
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Prisma.BannerWhereInput = {};
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.banner.count({ where }),
    ]);

    return NextResponse.json({
      banners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/banners - Create new banner
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BannerSchema.parse(body);

    const banner = await prisma.banner.create({
      data: validatedData,
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }

    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/banners (public) - Get active banners for display
export async function getBanners(request: NextRequest) {
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
    // Validate userType is a valid TargetUserType
    const validUserTypes: TargetUserType[] = ['ALL', 'CUSTOMERS', 'GUESTS', 'NEW_CUSTOMERS'];
    const validUserType = validUserTypes.includes(userType as TargetUserType) ? userType as TargetUserType : 'ALL';
    
    if (validUserType !== 'ALL') {
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
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ledgerService } from '@/lib/ledger';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const collectCODSchema = z.object({
  orderId: z.string(),
  amountCollected: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, amountCollected, notes } = collectCODSchema.parse(body);

    // Verify order exists and is eligible for COD collection
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true, 
        total: true, 
        paymentMethod: true,
        status: true 
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentMethod !== 'COD') {
      return NextResponse.json(
        { error: 'Order is not COD payment method' },
        { status: 400 }
      );
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Order must be delivered before COD collection' },
        { status: 400 }
      );
    }

    // Check if COD already collected
    const existingCollection = await prisma.cODTracking.findUnique({
      where: { orderId },
    });

    if (existingCollection?.collectedAt) {
      return NextResponse.json(
        { error: 'COD already collected for this order' },
        { status: 400 }
      );
    }

    // Record COD collection in ledger
    await ledgerService.recordCODCollection(
      orderId, 
      amountCollected, 
      session.user.id
    );

    // Get updated COD tracking
    const codTracking = await prisma.cODTracking.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: { name: true, phone: true }
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'COD collected successfully',
      codTracking,
    });
  } catch (error) {
    console.error('Error collecting COD:', error);
    return NextResponse.json(
      { error: 'Failed to collect COD' },
      { status: 500 }
    );
  }
}

// Get COD collection status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Get specific order COD tracking
      const codTracking = await prisma.cODTracking.findUnique({
        where: { orderId },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              customer: {
                select: { name: true, phone: true }
              },
            },
          },
        },
      });

      return NextResponse.json({ codTracking });
    }

    // Get summary of outstanding COD
    const outstanding = await ledgerService.getOutstandingCOD();
    
    // Get recent collections
    const recentCollections = await prisma.cODTracking.findMany({
      where: {
        collectedAt: {
          not: null,
        },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: { name: true }
            },
          },
        },
      },
      orderBy: {
        collectedAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      outstanding,
      recentCollections,
    });
  } catch (error) {
    console.error('Error fetching COD data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch COD data' },
      { status: 500 }
    );
  }
}
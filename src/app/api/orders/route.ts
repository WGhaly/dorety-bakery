import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus } from '@prisma/client';

/**
 * Orders API - List user's orders
 * GET /api/orders
 * 
 * Features:
 * - Pagination support
 * - Status filtering
 * - Order history with items
 * - Mobile-optimized response format
 */

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      customerId: session.user.id
    };

    if (status) {
      where.status = status as OrderStatus;
    }

    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  media: true
                }
              }
            }
          },
          deliveryAddress: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    // Format response for mobile optimization
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentType: order.fulfillmentType,
      total: order.total,
      itemCount: order.items.length,
      placedAt: order.placedAt,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      items: order.items.map(item => ({
        id: item.id,
        name: item.nameSnapshot,
        price: item.priceSnapshot,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        product: item.product
      })),
      deliveryAddress: order.deliveryAddress ? {
        label: order.deliveryAddress.label,
        line1: order.deliveryAddress.line1,
        city: order.deliveryAddress.city,
        area: order.deliveryAddress.area
      } : null
    }));

    const pagination = {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    };

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination
      }
    });

  } catch (error) {
    console.error('Orders list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Prisma, OrderStatus, FulfillmentType } from '@prisma/client';

/**
 * Admin Orders List API
 * 
 * GET /api/admin/orders
 * 
 * Features:
 * - Pagination with configurable limits
 * - Search by order number, customer name, email
 * - Filter by status, fulfillment type, date range
 * - Sort by creation date (newest first)
 * - Includes customer and order items details
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search term for order number or customer
 * - status: Filter by order status
 * - fulfillment: Filter by fulfillment type
 * - dateFrom: Start date filter (ISO string)
 * - dateTo: End date filter (ISO string)
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const fulfillment = searchParams.get('fulfillment')?.trim();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search
          }
        },
        {
          customer: {
            OR: [
              {
                name: {
                  contains: search
                }
              },
              {
                email: {
                  contains: search
                }
              }
            ]
          }
        }
      ];
    }

    // Status filter
    if (status) {
      where.status = status as OrderStatus;
    }

    // Fulfillment type filter
    if (fulfillment) {
      where.fulfillmentType = fulfillment as FulfillmentType;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Include the entire day for the end date
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where });

    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Fetch orders with relations
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              }
            }
          }
        },
        deliveryAddress: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    });

    const response = {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      filters: {
        search,
        status,
        fulfillment,
        dateFrom,
        dateTo,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin orders list error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
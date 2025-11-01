import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

/**
 * Admin Bulk Order Operations API
 * 
 * PATCH /api/admin/orders/bulk-update
 * 
 * Performs bulk operations on multiple orders:
 * - Bulk status updates
 * - Validation of status transitions
 * - Transaction-based updates for consistency
 * - Detailed response with success/failure counts
 */

const bulkUpdateSchema = z.object({
  orderIds: z.array(z.string()).min(1, 'At least one order ID is required'),
  status: z.enum([
    'PENDING',
    'CONFIRMED', 
    'PREPARING',
    'READY',
    'DELIVERED',
    'PICKED_UP',
    'CANCELLED'
  ])
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = bulkUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { orderIds, status: newStatus } = validation.data;

    // Get existing orders to validate transitions
    const existingOrders = await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      },
      select: {
        id: true,
        status: true,
        orderNumber: true,
      }
    });

    if (existingOrders.length === 0) {
      return NextResponse.json(
        { error: 'No orders found with the provided IDs' },
        { status: 404 }
      );
    }

    // Validate status transitions for each order
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PREPARING', 'CANCELLED'],
      'PREPARING': ['READY', 'CANCELLED'],
      'READY': ['DELIVERED', 'PICKED_UP', 'CANCELLED'],
      'DELIVERED': [], // Final state
      'PICKED_UP': [], // Final state
      'CANCELLED': [], // Final state
    };

    const validOrders: string[] = [];
    const invalidOrders: Array<{ id: string, orderNumber: string, currentStatus: string, reason: string }> = [];

    existingOrders.forEach(order => {
      const currentStatus = order.status;
      const allowedTransitions = validTransitions[currentStatus] || [];

      if (currentStatus === newStatus) {
        // Order already has the target status - consider valid
        validOrders.push(order.id);
      } else if (allowedTransitions.includes(newStatus)) {
        validOrders.push(order.id);
      } else {
        invalidOrders.push({
          id: order.id,
          orderNumber: order.orderNumber,
          currentStatus,
          reason: `Cannot transition from ${currentStatus} to ${newStatus}`
        });
      }
    });

    // Prepare update data
    interface OrderUpdateData {
      status: OrderStatus;
      updatedAt: Date;
      deliveredAt?: Date;
    }

    const updateData: OrderUpdateData = {
      status: newStatus as OrderStatus,
      updatedAt: new Date(),
    };

    // Set completion timestamps for final states
    if (newStatus === 'DELIVERED' || newStatus === 'PICKED_UP') {
      updateData.deliveredAt = new Date();
    }

    // Perform bulk update in a transaction
    let updatedCount = 0;
    if (validOrders.length > 0) {
      const result = await prisma.order.updateMany({
        where: {
          id: { in: validOrders }
        },
        data: updateData
      });
      updatedCount = result.count;
    }

    const response = {
      success: true,
      summary: {
        total: orderIds.length,
        updated: updatedCount,
        skipped: invalidOrders.length,
        newStatus
      },
      details: {
        updatedOrders: validOrders,
        skippedOrders: invalidOrders
      },
      message: `Successfully updated ${updatedCount} of ${orderIds.length} orders to ${newStatus}`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Bulk order update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform bulk update',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
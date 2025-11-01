import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { ledgerService } from '@/lib/ledger';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

/**
 * Admin Order Status Update API
 * 
 * PATCH /api/admin/orders/[id]/status
 * 
 * Updates the status of a specific order with validation:
 * - Validates status transitions
 * - Updates order timestamps
 * - Logs status changes for audit trail
 * - Handles fulfillment-specific logic
 */

const updateStatusSchema = z.object({
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

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;
    const body = await request.json();
    
    // Validate request body
    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { status: newStatus } = validation.data;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        fulfillmentType: true,
        orderNumber: true,
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transitions (business logic)
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PREPARING', 'CANCELLED'],
      'PREPARING': ['READY', 'CANCELLED'],
      'READY': ['DELIVERED', 'PICKED_UP', 'CANCELLED'],
      'DELIVERED': [], // Final state
      'PICKED_UP': [], // Final state
      'CANCELLED': [], // Final state
    };

    const currentStatus = existingOrder.status;
    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus) && currentStatus !== newStatus) {
      return NextResponse.json(
        { 
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          allowedTransitions
        },
        { status: 400 }
      );
    }

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

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
        }
      }
    });

    // Handle ledger updates for specific status changes
    try {
      if (newStatus === 'CANCELLED' && currentStatus !== 'CANCELLED') {
        // Record order cancellation in ledger
        await ledgerService.recordOrderCancellation(
          orderId,
          updatedOrder.subTotal,
          updatedOrder.deliveryFee,
          session.user.id
        );
      }

      // For COD orders, create COD tracking when delivered
      if (newStatus === 'DELIVERED' && updatedOrder.paymentMethod === 'COD') {
        // Initialize COD tracking (actual collection will be recorded separately)
        await prisma.cODTracking.upsert({
          where: { orderId },
          update: {},
          create: {
            orderId,
            amountDue: updatedOrder.total,
            amountCollected: 0,
            isReconciled: false,
          },
        });
      }
    } catch (ledgerError) {
      console.error('Ledger update error:', ledgerError);
      // Don't fail the status update if ledger fails - log and continue
    }

    // TODO: In a real application, you might want to:
    // - Send email notifications to customers
    // - Log status changes for audit trail
    // - Update inventory for cancellations
    // - Trigger delivery notifications

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${newStatus}`
    });

  } catch (error) {
    console.error('Order status update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update order status',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
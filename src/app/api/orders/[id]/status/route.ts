import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { EmailService } from '@/lib/email/email-service';
import { z } from 'zod';

/**
 * Order Status Update API - Update order status with timeline tracking
 * PATCH /api/orders/[id]/status
 * 
 * Features:
 * - Admin-only access
 * - Status transition validation
 * - Automatic timestamp updates
 * - Status history tracking
 * - Inventory management for cancellations
 */

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED', 
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'PICKED_UP',
    'CANCELLED',
    'REFUNDED'
  ]),
  notes: z.string().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  trackingNumber: z.string().optional()
});

type Params = Promise<{ id: string }>;

export async function PATCH(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'STAFF'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = updateStatusSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Begin transaction for atomic status update
    const result = await prisma.$transaction(async (tx) => {
      // Get current order with customer details
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: true
            }
          },
          deliveryAddress: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Store order items before update for inventory and email
      const orderItems = order.items;

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['PREPARING', 'CANCELLED'],
        'PREPARING': ['READY', 'CANCELLED'],
        'READY': ['OUT_FOR_DELIVERY', 'PICKED_UP', 'CANCELLED'],
        'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
        'DELIVERED': ['REFUNDED'],
        'PICKED_UP': ['REFUNDED'],
        'CANCELLED': ['REFUNDED'],
        'REFUNDED': []
      };

      const allowedNextStates = validTransitions[order.status] || [];
      if (!allowedNextStates.includes(validatedData.status)) {
        throw new Error(`Cannot transition from ${order.status} to ${validatedData.status}`);
      }

      // Prepare update data with timestamps
      const updateData: Prisma.OrderUpdateInput = {
        status: validatedData.status,
        updatedAt: new Date()
      };

      // Set appropriate timestamp based on status
      const now = new Date();
      switch (validatedData.status) {
        case 'CONFIRMED':
          updateData.confirmedAt = now;
          break;
        case 'PREPARING':
          updateData.preparingAt = now;
          break;
        case 'READY':
          updateData.readyAt = now;
          break;
        case 'OUT_FOR_DELIVERY':
          updateData.shippedAt = now;
          break;
        case 'DELIVERED':
          updateData.deliveredAt = now;
          updateData.actualDeliveryTime = now;
          break;
        case 'PICKED_UP':
          updateData.deliveredAt = now;
          updateData.actualDeliveryTime = now;
          break;
        case 'CANCELLED':
          updateData.cancelledAt = now;
          break;
      }

      // Add optional fields
      if (validatedData.estimatedDeliveryTime) {
        updateData.estimatedDeliveryTime = new Date(validatedData.estimatedDeliveryTime);
      }
      
      if (validatedData.trackingNumber) {
        updateData.trackingNumber = validatedData.trackingNumber;
      }

      // Handle inventory restoration for cancellations
      if (validatedData.status === 'CANCELLED' && order.status !== 'CANCELLED') {
        for (const item of orderItems) {
          if (item.product.inventoryTrackingEnabled) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQty: {
                  increment: item.quantity
                }
              }
            });
          }
        }
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData
      });

      // Add status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: validatedData.status,
          changedBy: session.user.id,
          notes: validatedData.notes || `Status changed to ${validatedData.status}`,
          timestamp: now
        }
      });

      return updatedOrder;
    });

    // Send email notification after successful status update
    try {
      // Get fresh order data with includes for email
      const orderForEmail = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  media: true
                }
              }
            }
          },
          deliveryAddress: true
        }
      });

      if (orderForEmail?.customer?.email) {
        // Prepare delivery address string
        let addressString = '';
        if (orderForEmail.deliveryAddressSnapshot) {
          try {
            const addressData = JSON.parse(orderForEmail.deliveryAddressSnapshot);
            addressString = `${addressData.streetAddress}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`;
          } catch (e) {
            // Fallback to deliveryAddress if snapshot parsing fails
            if (orderForEmail.deliveryAddress) {
              const addr = orderForEmail.deliveryAddress;
              addressString = `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}${addr.area ? ', ' + addr.area : ''}`;
            }
          }
        }

        // Calculate estimated time display
        let estimatedTimeDisplay = '';
        if (orderForEmail.estimatedDeliveryTime) {
          estimatedTimeDisplay = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(orderForEmail.estimatedDeliveryTime);
        }

        await EmailService.sendOrderStatusUpdateEmail({
          orderNumber: orderForEmail.orderNumber,
          customerName: orderForEmail.customer?.name || 'Valued Customer',
          items: orderForEmail.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.priceSnapshot
          })),
          total: orderForEmail.total,
          fulfillmentType: orderForEmail.fulfillmentType,
          address: orderForEmail.fulfillmentType === 'DELIVERY' ? addressString : undefined,
          estimatedTime: estimatedTimeDisplay || undefined,
          status: validatedData.status,
          trackingUrl: orderForEmail.trackingNumber 
            ? `${process.env.NEXT_PUBLIC_APP_URL}/track/${orderForEmail.trackingNumber}`
            : undefined
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the status update
      console.error('Failed to send status update email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${validatedData.status}`,
      data: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        updatedAt: result.updatedAt
      }
    });

  } catch (error) {
    console.error('Order status update error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Cannot transition')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
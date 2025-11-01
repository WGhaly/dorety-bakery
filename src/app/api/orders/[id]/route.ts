import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Order Details API - Get specific order with full details
 * GET /api/orders/[id]
 * 
 * Features:
 * - Complete order information
 * - Status history timeline
 * - Address and payment details
 * - Order items with product info
 */

type Params = Promise<{ id: string }>;

export async function GET(
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

    const { id } = await context.params;

    // Get order with full details
    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: session.user.id // Ensure user can only see their own orders
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                media: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        deliveryAddress: true,
        timeline: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse address snapshot if delivery
    let deliveryAddressSnapshot = null;
    if (order.deliveryAddressSnapshot) {
      try {
        deliveryAddressSnapshot = JSON.parse(order.deliveryAddressSnapshot);
      } catch (e) {
        console.error('Failed to parse address snapshot:', e);
      }
    }

    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      fulfillmentType: order.fulfillmentType,
      
      // Timing
      placedAt: order.placedAt,
      confirmedAt: order.confirmedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      requestedDeliveryTime: order.requestedDeliveryTime,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      deliveryWindow: order.deliveryWindow,
      
      // Pricing
      subTotal: order.subTotal,
      deliveryFee: order.deliveryFee,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      total: order.total,
      codAmount: order.codAmount,
      
      // Notes
      notesCustomer: order.notesCustomer,
      notesAdmin: order.notesAdmin,
      specialInstructions: order.specialInstructions,
      
      // Tracking
      trackingNumber: order.trackingNumber,
      priority: order.priority,
      source: order.source,
      
      // Items
      items: order.items.map(item => ({
        id: item.id,
        name: item.nameSnapshot,
        price: item.priceSnapshot,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        product: item.product
      })),
      
      // Address information
      deliveryAddress: order.deliveryAddress,
      deliveryAddressSnapshot,
      
      // Status timeline
      timeline: order.timeline.map(entry => ({
        id: entry.id,
        status: entry.status,
        timestamp: entry.timestamp,
        notes: entry.notes,
        changedBy: entry.changedBy
      })),
      
      // Customer info (for admin views)
      customer: order.customer
    };

    return NextResponse.json({
      success: true,
      data: formattedOrder
    });

  } catch (error) {
    console.error('Order details error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
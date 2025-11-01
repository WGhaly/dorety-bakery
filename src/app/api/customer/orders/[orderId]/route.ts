import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Customer Order Details API
 * 
 * GET /api/customer/orders/[orderId] - Get specific order details for reorder functionality
 * 
 * Features:
 * - Order details with items
 * - Stock availability check
 * - Authentication required
 * - Customer authorization
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderId } = await context.params;

    // Fetch order with items and product details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.priceSnapshot,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.shortDescription || item.product.longDescription || '',
          price: item.product.price,
          image: item.product.media?.[0] || '/placeholder-product.jpg',
          category: {
            name: item.product.category?.name || 'Uncategorized',
          },
          stock: item.product.stockQty || 0,
        },
      })),
    };

    return NextResponse.json(formattedOrder);

  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
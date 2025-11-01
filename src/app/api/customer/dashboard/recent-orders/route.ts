import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Customer Dashboard Recent Orders API - Chunk 8 Implementation
 * 
 * Provides recent orders for customer dashboard:
 * - Last 5 orders with status
 * - Order items preview
 * - Reorder capability status
 * - Order totals and dates
 * 
 * Following Context7 best practices for customer order history
 */

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch recent orders with items
    const orders = await prisma.order.findMany({
      where: {
        customerId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                media: true,
                isActive: true
              }
            }
          },
          take: 1 // Get first item for preview
        }
      }
    });

    // Transform orders for dashboard display
    const transformedOrders = orders.map(order => {
      const firstItem = order.items[0];
      const firstItemImages = firstItem?.product.media ? JSON.parse(firstItem.product.media) : [];
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        itemCount: order.items.length,
        firstItemImage: firstItemImages.length > 0 ? firstItemImages[0] : undefined,
        firstItemName: firstItem?.product.name,
        canReorder: order.status === 'DELIVERED' || order.status === 'PICKED_UP'
      };
    });

    return NextResponse.json({
      orders: transformedOrders
    });

  } catch (error) {
    console.error("Recent orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent orders" },
      { status: 500 }
    );
  }
}
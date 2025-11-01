import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Customer Dashboard Stats API - Chunk 8 Implementation
 * 
 * Provides aggregated statistics for customer dashboard:
 * - Total orders count
 * - Total amount spent
 * - Favorite product category
 * - Average order value
 * - Last order date
 * 
 * Following Context7 best practices for customer analytics
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

    // Get user's order statistics
    const [
      orderStats,
      categoryStats,
      totalSpent
    ] = await Promise.all([
      // Basic order statistics
      prisma.order.aggregate({
        where: {
          customerId: session.user.id,
          status: {
            not: 'CANCELLED'
          }
        },
        _count: {
          id: true
        },
        _avg: {
          total: true
        }
      }),

      // Most frequently ordered category
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            customerId: session.user.id,
            status: {
              not: 'CANCELLED'
            }
          }
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 1
      }),

      // Total amount spent
      prisma.order.aggregate({
        where: {
          customerId: session.user.id,
          status: {
            not: 'CANCELLED'
          }
        },
        _sum: {
          total: true
        }
      })
    ]);

    // Get favorite category name
    let favoriteCategory = 'Pastries';
    if (categoryStats.length > 0) {
      const topProduct = await prisma.product.findUnique({
        where: {
          id: categoryStats[0].productId
        },
        include: {
          category: true
        }
      });
      
      favoriteCategory = topProduct?.category.name || 'Pastries';
    }

    // Get last order date
    const lastOrder = await prisma.order.findFirst({
      where: {
        customerId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true
      }
    });

    const stats = {
      totalOrders: orderStats._count.id || 0,
      totalSpent: totalSpent._sum.total || 0,
      favoriteCategory,
      lastOrderDate: lastOrder?.createdAt?.toISOString() || '',
      loyaltyPoints: Math.floor((totalSpent._sum.total || 0) * 0.1), // 10% of total spent as points
      averageOrderValue: orderStats._avg.total || 0
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
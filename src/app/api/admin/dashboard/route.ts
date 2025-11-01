import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { subDays, subHours, startOfDay, endOfDay } from 'date-fns';

/**
 * Admin Dashboard Metrics API
 * 
 * GET /api/admin/dashboard
 * 
 * Returns comprehensive dashboard metrics for admin users:
 * - Today's orders and revenue
 * - Pending orders requiring attention
 * - Recent sales performance
 * - Inventory alerts
 * - Top products
 * - Customer activity
 * 
 * Following Context7 best practices for admin dashboard data patterns
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

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = subDays(todayStart, 1);
    const yesterdayEnd = endOfDay(yesterdayStart);
    const lastWeekStart = subDays(todayStart, 7);
    const last24Hours = subHours(now, 24);

    // Parallel queries for better performance
    const [
      // Today's metrics
      todayOrders,
      todayRevenue,
      
      // Yesterday's metrics for comparison
      yesterdayOrders,
      yesterdayRevenue,
      
      // Pending orders requiring attention
      pendingOrders,
      
      // Recent orders for activity feed
      recentOrders,
      
      // Inventory alerts
      lowStockProducts,
      
      // Top products in last 7 days
      topProducts,
      
      // Customer activity
      newCustomers,
      totalCustomers,
      
      // Order status distribution
      orderStatusDistribution,
      
      // Revenue trend (last 7 days)
      weeklyRevenue
    ] = await Promise.all([
      // Today's orders count
      prisma.order.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          }
        }
      }),
      
      // Today's revenue
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: {
            notIn: ['CANCELLED']
          }
        }
      }),
      
      // Yesterday's orders for comparison
      prisma.order.count({
        where: {
          createdAt: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          }
        }
      }),
      
      // Yesterday's revenue
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          createdAt: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
          status: {
            notIn: ['CANCELLED']
          }
        }
      }),
      
      // Pending orders needing attention
      prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 10
      }),
      
      // Recent orders for activity feed
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: last24Hours
          }
        },
        include: {
          customer: {
            select: {
              name: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      
      // Low stock products (where stockQty <= 10)
      prisma.product.findMany({
        where: {
          inventoryTrackingEnabled: true,
          stockQty: {
            lte: 10
          },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          stockQty: true,
          price: true,
        },
        orderBy: {
          stockQty: 'asc'
        },
        take: 10
      }),
      
      // Top products in last 7 days by quantity sold
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true
        },
        _count: {
          id: true
        },
        where: {
          order: {
            createdAt: {
              gte: lastWeekStart
            },
            status: {
              notIn: ['CANCELLED']
            }
          }
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),
      
      // New customers in last 24 hours
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: last24Hours
          }
        }
      }),
      
      // Total customers
      prisma.user.count({
        where: {
          role: 'CUSTOMER'
        }
      }),
      
      // Order status distribution
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        where: {
          createdAt: {
            gte: lastWeekStart
          }
        }
      }),
      
      // Weekly revenue trend
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as order_count,
          SUM(total) as revenue
        FROM "Order"
        WHERE "createdAt" >= ${lastWeekStart}
          AND status NOT IN ('CANCELLED')
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 7
      `
    ]);

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            media: true,
          }
        });
        
        return {
          ...product,
          quantitySold: item._sum.quantity || 0,
          orderCount: item._count.id
        };
      })
    );

    // Calculate percentage changes
    const orderChange = yesterdayOrders > 0 
      ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 
      : todayOrders > 0 ? 100 : 0;
      
    const revenueChange = (yesterdayRevenue._sum?.total || 0) > 0
      ? (((todayRevenue._sum?.total || 0) - (yesterdayRevenue._sum?.total || 0)) / (yesterdayRevenue._sum?.total || 0)) * 100
      : (todayRevenue._sum?.total || 0) > 0 ? 100 : 0;

    const dashboardData = {
      // Key metrics
      metrics: {
        todayOrders: {
          value: todayOrders,
          change: orderChange,
          isPositive: orderChange >= 0
        },
        todayRevenue: {
          value: todayRevenue._sum?.total || 0,
          change: revenueChange,
          isPositive: revenueChange >= 0
        },
        pendingOrdersCount: pendingOrders.length,
        newCustomers: newCustomers,
        totalCustomers: totalCustomers,
        lowStockCount: lowStockProducts.length
      },
      
      // Data for dashboard widgets
      pendingOrders: pendingOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        totalAmount: order.total,
        itemCount: order.items.length,
        createdAt: order.createdAt,
        status: order.status,
        fulfillmentType: order.fulfillmentType,
        estimatedDelivery: order.estimatedDeliveryTime,
      })),
      
      recentActivity: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        totalAmount: order.total,
        status: order.status,
        createdAt: order.createdAt,
      })),
      
      lowStockProducts,
      
      topProducts: topProductsWithDetails.filter(Boolean),
      
      orderStatusDistribution: orderStatusDistribution.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      
      weeklyRevenue: weeklyRevenue as { date: Date; order_count: number; revenue: number }[],
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard metrics',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
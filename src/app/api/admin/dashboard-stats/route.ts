import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * Admin Dashboard Stats API - Chunk 9 Implementation
 * 
 * Provides comprehensive analytics and KPIs for the admin dashboard:
 * - Revenue metrics (total, today, monthly trends)
 * - Order statistics (total, today, by status)
 * - Customer analytics (total, new today)
 * - Product insights (total, low stock alerts, top sellers)
 * - Recent activity data
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Date calculations
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Parallel data fetching for performance
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      newCustomersToday,
      lowStockProducts,
      recentOrders,
      topProducts,
      revenueData
    ] = await Promise.all([
      // Basic counts
      prisma.user.count({
        where: { role: "CUSTOMER" }
      }),
      
      prisma.product.count(),
      
      prisma.category.count(),
      
      prisma.order.count(),
      
      // Today's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: todayStart
          }
        }
      }),
      
      // Orders by status
      prisma.order.count({
        where: {
          status: {
            in: ["PENDING", "CONFIRMED"]
          }
        }
      }),
      
      prisma.order.count({
        where: {
          status: "DELIVERED"
        }
      }),
      
      // New customers today
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: {
            gte: todayStart
          }
        }
      }),
      
      // Low stock products (stockQty < 10)
      prisma.product.count({
        where: {
          stockQty: {
            lt: 10
          }
        }
      }),
      
      // Recent orders with customer info
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          customer: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Top selling products
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
          lineTotal: true
        },
        orderBy: {
          _sum: {
            quantity: "desc"
          }
        },
        take: 5
      }),
      
      // Revenue calculations
      prisma.order.aggregate({
        _sum: {
          total: true
        },
        where: {
          status: {
            not: "CANCELLED"
          }
        }
      })
    ])

    // Calculate today's revenue
    const todayRevenueResult = await prisma.order.aggregate({
      _sum: {
        total: true
      },
      where: {
        status: {
          not: "CANCELLED"
        },
        createdAt: {
          gte: todayStart
        }
      }
    })

    // Get product details for top sellers
    const topProductIds = topProducts.map(item => item.productId)
    const productDetails = await prisma.product.findMany({
      where: {
        id: {
          in: topProductIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    // Format top products with details
    const formattedTopProducts = topProducts.map(item => {
      const product = productDetails.find(p => p.id === item.productId)
      return {
        id: item.productId,
        name: product?.name || "Unknown Product",
        soldCount: item._sum?.quantity || 0,
        revenue: item._sum?.lineTotal || 0
      }
    })

    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || "Unknown Customer",
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString()
    }))

    // Get monthly revenue for trends (last 12 months)
    const monthlyRevenuePromises = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      monthlyRevenuePromises.push(
        prisma.order.aggregate({
          _sum: {
            total: true
          },
          where: {
            status: {
              not: "CANCELLED"
            },
            createdAt: {
              gte: monthDate,
              lt: nextMonthDate
            }
          }
        })
      )
    }

    const monthlyRevenueResults = await Promise.all(monthlyRevenuePromises)
    const monthlyRevenue = monthlyRevenueResults.map(result => result._sum.total || 0)

    const stats = {
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: revenueData._sum.total || 0,
      todayRevenue: todayRevenueResult._sum.total || 0,
      lowStockProducts,
      newCustomersToday,
      monthlyRevenue,
      recentOrders: formattedRecentOrders,
      topProducts: formattedTopProducts
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}
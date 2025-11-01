import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ledgerService } from '@/lib/ledger';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const reportSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  type: z.enum(['summary', 'detailed', 'cod-analysis']).optional().default('summary'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const type = searchParams.get('type') || 'summary';

    // Default to current month if no dates provided
    const fromDate = dateFrom 
      ? new Date(dateFrom) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const toDate = dateTo 
      ? new Date(dateTo) 
      : new Date();

    const { type: reportType } = reportSchema.parse({
      dateFrom: fromDate.toISOString(),
      dateTo: toDate.toISOString(),
      type,
    });

    if (reportType === 'summary') {
      // Generate financial summary report
      const financialReport = await ledgerService.generateFinancialReport(fromDate, toDate);
      
      // Get order statistics
      const orderStats = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          total: true,
        },
      });

      // Get payment method breakdown
      const paymentBreakdown = await prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          total: true,
        },
      });

      // Get outstanding COD
      const outstandingCOD = await ledgerService.getOutstandingCOD();

      return NextResponse.json({
        period: {
          from: fromDate,
          to: toDate,
        },
        financial: financialReport,
        orders: {
          count: orderStats._count.id,
          totalValue: orderStats._sum.total || 0,
        },
        paymentMethods: paymentBreakdown,
        outstandingCOD,
      });
    }

    if (reportType === 'detailed') {
      // Get detailed ledger entries
      const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        include: {
          account: true,
          order: {
            select: {
              orderNumber: true,
              customer: {
                select: { name: true }
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({
        period: {
          from: fromDate,
          to: toDate,
        },
        entries: ledgerEntries,
      });
    }

    if (reportType === 'cod-analysis') {
      // COD-specific analysis
      const codOrders = await prisma.order.findMany({
        where: {
          paymentMethod: 'COD',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        include: {
          codTracking: true,
          customer: {
            select: { name: true, phone: true }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const codStats = {
        totalOrders: codOrders.length,
        totalValue: codOrders.reduce((sum, order) => sum + order.total, 0),
        collected: codOrders.filter(order => order.codTracking?.collectedAt).length,
        collectedValue: codOrders
          .filter(order => order.codTracking?.collectedAt)
          .reduce((sum, order) => sum + (order.codTracking?.amountCollected || 0), 0),
        pending: codOrders.filter(order => !order.codTracking?.collectedAt).length,
        pendingValue: codOrders
          .filter(order => !order.codTracking?.collectedAt)
          .reduce((sum, order) => sum + order.total, 0),
        variances: codOrders
          .filter(order => order.codTracking?.variance && order.codTracking.variance !== 0)
          .map(order => ({
            orderId: order.id,
            orderNumber: order.orderNumber,
            expectedAmount: order.total,
            collectedAmount: order.codTracking?.amountCollected || 0,
            variance: order.codTracking?.variance || 0,
          })),
      };

      return NextResponse.json({
        period: {
          from: fromDate,
          to: toDate,
        },
        statistics: codStats,
        orders: codOrders,
      });
    }

    return NextResponse.json(
      { error: 'Invalid report type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating financial report:', error);
    return NextResponse.json(
      { error: 'Failed to generate financial report' },
      { status: 500 }
    );
  }
}
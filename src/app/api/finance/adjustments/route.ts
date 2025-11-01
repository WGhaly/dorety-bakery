import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ledgerService } from '@/lib/ledger';
import { prisma } from '@/lib/db';
import { AdjustmentType } from '@prisma/client';
import { z } from 'zod';

const adjustmentSchema = z.object({
  type: z.nativeEnum(AdjustmentType),
  amount: z.number().positive(),
  reason: z.string().min(10),
  debitAccount: z.string(),
  creditAccount: z.string(),
  description: z.string().optional(),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, amount, reason, debitAccount, creditAccount, description, orderId, customerId } = adjustmentSchema.parse(body);

    // Verify accounts exist
    const [debitAcc, creditAcc] = await Promise.all([
      prisma.chartOfAccount.findUnique({ where: { code: debitAccount } }),
      prisma.chartOfAccount.findUnique({ where: { code: creditAccount } }),
    ]);

    if (!debitAcc || !creditAcc) {
      return NextResponse.json(
        { error: 'Invalid account codes' },
        { status: 400 }
      );
    }

    // Record the adjustment in ledger
    await ledgerService.recordFinancialAdjustment(
      type,
      amount,
      reason,
      debitAccount,
      creditAccount,
      session.user.id
    );

    // Create adjustment record for audit trail
    const adjustment = await prisma.financialAdjustment.create({
      data: {
        type,
        amount,
        reason,
        description,
        orderId,
        customerId,
        requestedBy: session.user.id,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Financial adjustment recorded successfully',
      adjustment,
    });
  } catch (error) {
    console.error('Error creating financial adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to create financial adjustment' },
      { status: 500 }
    );
  }
}

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const typeParam = searchParams.get('type');

    const where = typeParam && Object.values(AdjustmentType).includes(typeParam as AdjustmentType) 
      ? { type: typeParam as AdjustmentType } 
      : {};

    const [adjustments, total] = await Promise.all([
      prisma.financialAdjustment.findMany({
        where,
        include: {
          order: {
            select: { orderNumber: true }
          },
          customer: {
            select: { name: true, email: true }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.financialAdjustment.count({ where }),
    ]);

    return NextResponse.json({
      adjustments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching financial adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial adjustments' },
      { status: 500 }
    );
  }
}
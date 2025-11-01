import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ledgerService } from '@/lib/ledger';
import { z } from 'zod';

const initAccountsSchema = z.object({
  force: z.boolean().optional(),
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
    const { force } = initAccountsSchema.parse(body);

    await ledgerService.initializeChartOfAccounts();

    return NextResponse.json({ 
      success: true,
      message: 'Chart of accounts initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing chart of accounts:', error);
    return NextResponse.json(
      { error: 'Failed to initialize chart of accounts' },
      { status: 500 }
    );
  }
}
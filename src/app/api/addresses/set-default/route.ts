import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { setDefaultAddressSchema } from '@/lib/validation/address';
import { z } from 'zod';

// POST /api/addresses/set-default - Set an address as default
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = setDefaultAddressSchema.parse(body);

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        customerId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found or access denied' },
        { status: 404 }
      );
    }

    // Use database transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Remove default from all other addresses
      await tx.address.updateMany({
        where: {
          customerId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set the selected address as default
      const updatedAddress = await tx.address.update({
        where: { id },
        data: { isDefault: true },
      });

      return updatedAddress;
    });

    return NextResponse.json({ 
      address: result,
      message: 'Default address updated successfully' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error setting default address:', error);
    return NextResponse.json(
      { error: 'Failed to set default address' },
      { status: 500 }
    );
  }
}
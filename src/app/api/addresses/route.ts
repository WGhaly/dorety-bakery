import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { addressSchema, updateAddressSchema, setDefaultAddressSchema, deleteAddressSchema } from '@/lib/validation/address';
import { z } from 'zod';

// GET /api/addresses - Get all addresses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: {
        customerId: session.user.id,
      },
      orderBy: [
        { isDefault: 'desc' }, // Default address first
        { createdAt: 'desc' },  // Then by creation date
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create a new address
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
    const validatedData = addressSchema.parse(body);

    // Use database transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // If this is being set as default, remove default from others
      if (validatedData.isDefault) {
        await tx.address.updateMany({
          where: {
            customerId: session.user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create the new address
      const newAddress = await tx.address.create({
        data: {
          ...validatedData,
          customerId: session.user.id,
        },
      });

      return newAddress;
    });

    return NextResponse.json({ 
      address: result,
      message: 'Address created successfully' 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

// PUT /api/addresses - Update an existing address
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAddressSchema.parse(body);
    const { id, ...updateData } = validatedData;

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

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

    // Use database transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // If setting as default, remove default from others
      if (updateData.isDefault === true) {
        await tx.address.updateMany({
          where: {
            customerId: session.user.id,
            isDefault: true,
            id: { not: id }, // Exclude current address
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Update the address
      const updatedAddress = await tx.address.update({
        where: { id },
        data: updateData,
      });

      return updatedAddress;
    });

    return NextResponse.json({ 
      address: result,
      message: 'Address updated successfully' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses - Delete an address (via request body)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = deleteAddressSchema.parse(body);

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

    // Prevent deletion of default address if it's the only one
    if (existingAddress.isDefault) {
      const addressCount = await prisma.address.count({
        where: {
          customerId: session.user.id,
        },
      });

      if (addressCount === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only address. Add another address first.' },
          { status: 400 }
        );
      }

      // If deleting default address and there are others, set a new default
      await prisma.$transaction(async (tx) => {
        // Delete the current address
        await tx.address.delete({
          where: { id },
        });

        // Set the most recently created address as default
        const nextAddress = await tx.address.findFirst({
          where: {
            customerId: session.user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      });
    } else {
      // Simply delete non-default address
      await prisma.address.delete({
        where: { id },
      });
    }

    return NextResponse.json({ 
      message: 'Address deleted successfully' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
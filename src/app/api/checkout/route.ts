import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ledgerService } from '@/lib/ledger';
import { checkoutSchema } from '@/lib/validations/checkout';
import { EmailService } from '@/lib/email/email-service';
import { ZodError, ZodIssue } from 'zod';

/**
 * Checkout API - Creates order from cart
 * POST /api/checkout
 * 
 * Based on research from Context7:
 * - Atomic transaction handling with rollback capability
 * - Inventory validation before order creation
 * - Address snapshot for order history
 * - Cart clearing after successful order
 * - Comprehensive error handling with detailed messages
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    console.log('Checkout API received body:', JSON.stringify(body, null, 2));
    
    let validatedData;
    try {
      validatedData = checkoutSchema.parse(body);
      console.log('Checkout validation successful:', JSON.stringify(validatedData, null, 2));
    } catch (error) {
      console.error('Checkout validation failed:', error);
      if (error instanceof ZodError) {
        const errorDetails = error.issues.map((e: ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
          received: e.input
        }));
        console.error('Validation error details:', errorDetails);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: errorDetails
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 3. Begin transaction for atomic order creation
    const result = await prisma.$transaction(async (tx) => {
      // Get user's cart with items
      const cart = await tx.cart.findUnique({
        where: { customerId: session.user.id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // 4. Validate inventory for all cart items
      const inventoryErrors = [];
      for (const item of cart.items) {
        if (item.product.inventoryTrackingEnabled) {
          if (!item.product.stockQty || item.product.stockQty < item.quantity) {
            inventoryErrors.push({
              productId: item.product.id,
              productName: item.product.name,
              requested: item.quantity,
              available: item.product.stockQty || 0
            });
          }
        }
      }

      if (inventoryErrors.length > 0) {
        throw new Error(`Insufficient inventory: ${JSON.stringify(inventoryErrors)}`);
      }

      // 5. Generate order number
      const orderCount = await tx.order.count();
      const orderNumber = `DBY-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

      // 6. Get address for delivery orders
      let addressSnapshot = null;
      let deliveryFee = 0;
      
      if (validatedData.fulfillmentType === 'DELIVERY') {
        const address = await tx.address.findUnique({
          where: { id: validatedData.addressId }
        });

        if (!address) {
          throw new Error('Selected address not found');
        }

        if (address.customerId !== session.user.id) {
          throw new Error('Address does not belong to user');
        }

        // Create address snapshot
        addressSnapshot = JSON.stringify({
          label: address.label,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          area: address.area,
          notes: address.notes
        });

        // Calculate delivery fee (basic logic)
        deliveryFee = 25.00; // Fixed delivery fee for now
      }

      // 7. Calculate order totals
      const subTotal = cart.items.reduce((sum, item) => 
        sum + (item.priceSnapshot * item.quantity), 0
      );
      
      const discountAmount = 0; // No discounts for now
      const taxAmount = 0; // No tax for now
      const total = subTotal + deliveryFee + taxAmount - discountAmount;

      // 8. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: session.user.id,
          fulfillmentType: validatedData.fulfillmentType,
          deliveryAddressSnapshot: addressSnapshot,
          deliveryAddressId: validatedData.fulfillmentType === 'DELIVERY' ? validatedData.addressId : null,
          status: 'PENDING',
          paymentMethod: 'COD',
          paymentStatus: 'UNPAID',
          deliveryFee,
          subTotal,
          discountAmount,
          taxAmount,
          total,
          requestedDeliveryTime: validatedData.requestedDeliveryTime,
          notesCustomer: validatedData.notes,
          specialInstructions: validatedData.specialInstructions,
          deliveryWindow: validatedData.deliveryWindow,
          source: 'web',
          priority: 'NORMAL'
        }
      });

      // 9. Create order items and update inventory
      for (const item of cart.items) {
        // Create order item
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            nameSnapshot: item.nameSnapshot,
            priceSnapshot: item.priceSnapshot,
            quantity: item.quantity,
            lineTotal: item.priceSnapshot * item.quantity
          }
        });

        // Update product inventory if tracking enabled
        if (item.product.inventoryTrackingEnabled) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      // 10. Create initial status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          notes: 'Order placed successfully'
        }
      });

      // 11. Clear cart after successful order
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        subTotal,
        deliveryFee
      };
    });

    // 12. Record order in financial ledger (after transaction commits)
    await ledgerService.recordOrderPlacement(
      result.orderId,
      result.subTotal,
      result.deliveryFee,
      session.user.id
    );

    // 13. Send order confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          email: true
        }
      });

      const orderWithDetails = await prisma.order.findUnique({
        where: { id: result.orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  media: true
                }
              }
            }
          }
        }
      });

      if (user?.email && orderWithDetails) {
        // Prepare delivery address string
        let addressString = '';
        if (orderWithDetails.deliveryAddressSnapshot) {
          try {
            const addressData = JSON.parse(orderWithDetails.deliveryAddressSnapshot);
            addressString = `${addressData.line1}${addressData.line2 ? ', ' + addressData.line2 : ''}, ${addressData.city}${addressData.area ? ', ' + addressData.area : ''}`;
          } catch (e) {
            console.error('Failed to parse address snapshot:', e);
          }
        }

        // Calculate estimated delivery time display
        let estimatedTimeDisplay = '';
        if (orderWithDetails.requestedDeliveryTime) {
          estimatedTimeDisplay = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(orderWithDetails.requestedDeliveryTime);
        }

        await EmailService.sendOrderConfirmationEmail({
          orderNumber: orderWithDetails.orderNumber,
          customerName: user.name || 'Valued Customer',
          items: orderWithDetails.items.map(item => ({
            name: item.nameSnapshot,
            quantity: item.quantity,
            price: item.priceSnapshot
          })),
          total: orderWithDetails.total,
          fulfillmentType: orderWithDetails.fulfillmentType,
          address: orderWithDetails.fulfillmentType === 'DELIVERY' ? addressString : undefined,
          estimatedTime: estimatedTimeDisplay || undefined
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the checkout
      console.error('Failed to send order confirmation email:', emailError);
    }

    // 14. Return successful response
    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: result
    });

  } catch (error) {
    console.error('Checkout error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Cart is empty')) {
        return NextResponse.json(
          { success: false, error: 'Cart is empty' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Insufficient inventory')) {
        return NextResponse.json(
          { success: false, error: 'Some items are out of stock', details: error.message },
          { status: 400 }
        );
      }

      if (error.message.includes('Address not found')) {
        return NextResponse.json(
          { success: false, error: 'Selected address not found' },
          { status: 400 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
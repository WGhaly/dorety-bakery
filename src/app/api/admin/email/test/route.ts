import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email/email-service';

/**
 * Email Test API - Admin functionality for testing email templates
 * POST /api/admin/email/test
 * 
 * Features:
 * - Admin-only access
 * - Test different email types
 * - Use real or mock data
 * - Comprehensive error handling
 */

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, email, orderId } = body;

    if (!type || !email) {
      return NextResponse.json(
        { success: false, error: 'Email type and address are required' },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    try {
      switch (type) {
        case 'welcome':
          success = await EmailService.sendWelcomeEmail({
            name: 'Test Customer',
            email: email
          });
          message = success ? 'Welcome email sent successfully' : 'Failed to send welcome email';
          break;

        case 'order-confirmation':
          // Use real order data if orderId provided, otherwise use mock data
          let orderData;
          
          if (orderId) {
            const order = await prisma.order.findUnique({
              where: { orderNumber: orderId },
              include: {
                items: {
                  include: {
                    product: {
                      select: {
                        name: true
                      }
                    }
                  }
                },
                customer: {
                  select: {
                    name: true
                  }
                }
              }
            });

            if (order) {
              // Prepare delivery address string
              let addressString = '';
              if (order.deliveryAddressSnapshot) {
                try {
                  const addressData = JSON.parse(order.deliveryAddressSnapshot);
                  addressString = `${addressData.line1}${addressData.line2 ? ', ' + addressData.line2 : ''}, ${addressData.city}${addressData.area ? ', ' + addressData.area : ''}`;
                } catch (e) {
                  console.error('Failed to parse address snapshot:', e);
                }
              }

              // Calculate estimated delivery time display
              let estimatedTimeDisplay = '';
              if (order.requestedDeliveryTime) {
                estimatedTimeDisplay = new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(order.requestedDeliveryTime);
              }

              orderData = {
                orderNumber: order.orderNumber,
                customerName: order.customer?.name || 'Test Customer',
                items: order.items.map(item => ({
                  name: item.nameSnapshot,
                  quantity: item.quantity,
                  price: item.priceSnapshot
                })),
                total: order.total,
                fulfillmentType: order.fulfillmentType,
                address: order.fulfillmentType === 'DELIVERY' ? addressString : undefined,
                estimatedTime: estimatedTimeDisplay || undefined
              };
            }
          }

          // Use mock data if no real order found
          if (!orderData) {
            orderData = {
              orderNumber: 'DBY-2025-TEST',
              customerName: 'Test Customer',
              items: [
                { name: 'Chocolate Croissant', quantity: 2, price: 4.50 },
                { name: 'Fresh Baguette', quantity: 1, price: 3.00 },
                { name: 'Blueberry Muffin', quantity: 3, price: 2.50 }
              ],
              total: 19.50,
              fulfillmentType: 'DELIVERY' as const,
              address: '123 Test Street, Test City, TC 12345',
              estimatedTime: 'Tomorrow at 2:00 PM'
            };
          }

          success = await EmailService.sendOrderConfirmationEmail(orderData);
          message = success ? 'Order confirmation email sent successfully' : 'Failed to send order confirmation email';
          break;

        case 'status-update':
          // Use real order data if orderId provided, otherwise use mock data
          let statusOrderData;
          
          if (orderId) {
            const order = await prisma.order.findUnique({
              where: { orderNumber: orderId },
              include: {
                items: {
                  include: {
                    product: {
                      select: {
                        name: true
                      }
                    }
                  }
                },
                customer: {
                  select: {
                    name: true
                  }
                }
              }
            });

            if (order) {
              // Prepare delivery address string
              let addressString = '';
              if (order.deliveryAddressSnapshot) {
                try {
                  const addressData = JSON.parse(order.deliveryAddressSnapshot);
                  addressString = `${addressData.line1}${addressData.line2 ? ', ' + addressData.line2 : ''}, ${addressData.city}${addressData.area ? ', ' + addressData.area : ''}`;
                } catch (e) {
                  console.error('Failed to parse address snapshot:', e);
                }
              }

              // Calculate estimated delivery time display
              let estimatedTimeDisplay = '';
              if (order.estimatedDeliveryTime) {
                estimatedTimeDisplay = new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(order.estimatedDeliveryTime);
              }

              statusOrderData = {
                orderNumber: order.orderNumber,
                customerName: order.customer?.name || 'Test Customer',
                items: order.items.map(item => ({
                  name: item.nameSnapshot,
                  quantity: item.quantity,
                  price: item.priceSnapshot
                })),
                total: order.total,
                fulfillmentType: order.fulfillmentType,
                address: order.fulfillmentType === 'DELIVERY' ? addressString : undefined,
                estimatedTime: estimatedTimeDisplay || undefined,
                status: order.status,
                trackingUrl: order.trackingNumber 
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/track/${order.trackingNumber}`
                  : undefined
              };
            }
          }

          // Use mock data if no real order found
          if (!statusOrderData) {
            statusOrderData = {
              orderNumber: 'DBY-2025-TEST',
              customerName: 'Test Customer',
              items: [
                { name: 'Chocolate Croissant', quantity: 2, price: 4.50 },
                { name: 'Fresh Baguette', quantity: 1, price: 3.00 }
              ],
              total: 12.00,
              fulfillmentType: 'DELIVERY' as const,
              address: '123 Test Street, Test City, TC 12345',
              estimatedTime: 'Tomorrow at 2:00 PM',
              status: 'PREPARING',
              trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/TEST123`
            };
          }

          success = await EmailService.sendOrderStatusUpdateEmail(statusOrderData);
          message = success ? 'Status update email sent successfully' : 'Failed to send status update email';
          break;

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid email type' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: success,
        message: message
      });

    } catch (emailError) {
      console.error('Email test error:', emailError);
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email: ' + (emailError instanceof Error ? emailError.message : 'Unknown error')
      });
    }

  } catch (error) {
    console.error('Email test API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
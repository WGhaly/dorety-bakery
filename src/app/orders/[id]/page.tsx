'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Truck, Store, MapPin, Clock, ArrowLeft, Copy } from 'lucide-react';

/**
 * Order Details Page - Shows individual order information
 * 
 * Features:
 * - Order status tracking
 * - Item details with images
 * - Fulfillment information
 * - Payment details
 * - Success celebration for new orders
 * - Mobile-optimized layout
 */

interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    media: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  total: number;
  subTotal: number;
  deliveryFee: number;
  createdAt: string;
  estimatedDelivery?: string;
  notes?: string;
  specialInstructions?: string;
  deliveryWindow?: string;
  items: OrderItem[];
  shippingAddress?: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    area?: string;
  };
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewOrder = searchParams.get('success') === 'true';
  
  // Unwrap async params using React.use()
  const { id } = use(params);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login?redirect=' + encodeURIComponent(`/orders/${id}`));
      return;
    }

    fetchOrder();
  }, [session, id, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error('Failed to load order');
      }
      
      const data = await response.json();
      setOrder(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      // You could add a toast notification here
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (!session || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/orders" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center">
            <Link href="/orders" className="mr-3">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-500">#{order.orderNumber}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Success Message for New Orders */}
          {isNewOrder && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h2 className="text-lg font-semibold text-green-800 mb-1">Order Placed Successfully!</h2>
              <p className="text-sm text-green-700">
                Thank you for your order. We&apos;ll get started on it right away.
              </p>
            </div>
          )}

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Order Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {formatStatus(order.status)}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Order Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">#{order.orderNumber}</span>
                  <button 
                    onClick={copyOrderNumber}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Order Date:</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center justify-between">
                  <span>Estimated {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}:</span>
                  <span>{new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Details */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-semibold mb-3 flex items-center">
              {order.fulfillmentType === 'DELIVERY' ? 
                <Truck className="h-4 w-4 mr-2" /> : 
                <Store className="h-4 w-4 mr-2" />
              }
              {order.fulfillmentType === 'DELIVERY' ? 'Delivery Details' : 'Pickup Details'}
            </h3>
            
            <div className="space-y-3">
              {order.fulfillmentType === 'DELIVERY' ? (
                order.shippingAddress && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{order.shippingAddress.label}</p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.line1}
                        {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.area && `${order.shippingAddress.area}, `}{order.shippingAddress.city}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-start space-x-2">
                  <Store className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Dorety Bakery</p>
                    <p className="text-sm text-gray-600">123 Baker Street, Amman</p>
                    <p className="text-sm text-gray-600">Daily: 8:00 AM - 8:00 PM</p>
                  </div>
                </div>
              )}

              {order.deliveryWindow && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">
                    Preferred window: {order.deliveryWindow.toLowerCase()}
                  </p>
                </div>
              )}

              {order.specialInstructions && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Special Instructions:</p>
                  <p className="text-sm text-gray-600">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-semibold mb-4">Order Items</h3>
            
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                    {item.product.media && item.product.media.length > 0 && (
                      <Image
                        src={item.product.media[0] || '/placeholder.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    ${item.lineTotal.toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="border-t pt-3 mt-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${order.subTotal.toFixed(2)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>${order.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-semibold mb-3">Payment</h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">💵</span>
              </div>
              <div>
                <p className="font-medium text-sm">Cash on Delivery (COD)</p>
                <p className="text-sm text-gray-600">Pay when you receive your order</p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-base font-semibold mb-3">Order Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Reorder Button */}
            <Link 
              href={`/reorder/${order.id}`}
              className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium text-center block hover:bg-amber-700 transition-colors"
            >
              Reorder Items
            </Link>
            
            <Link 
              href="/orders"
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium text-center block hover:bg-gray-50 transition-colors"
            >
              View All Orders
            </Link>
            
            <Link 
              href="/products"
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium text-center block hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
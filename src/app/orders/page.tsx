'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Truck, Store, ArrowRight, Search } from 'lucide-react';

/**
 * Orders List Page - Shows all user orders
 * 
 * Features:
 * - Order list with status indicators
 * - Search and filter functionality
 * - Order preview with items count
 * - Mobile-optimized layout
 * - Quick status overview
 */

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  firstItemImage?: string;
  firstItemName?: string;
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login?redirect=/orders');
      return;
    }

    fetchOrders();
  }, [session, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatStatus(order.status).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!session || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500">Track your order history</p>
          </div>
        </div>

        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
              <button 
                onClick={fetchOrders}
                className="text-red-600 text-sm font-medium mt-2 hover:text-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <Link href={`/orders/${order.id}`}>
                    <div className="hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order #{order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 mb-3">
                        {order.firstItemImage ? (
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={order.firstItemImage}
                              alt={order.firstItemName || 'Order item'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {order.firstItemName || 'Order items'}
                            {order.itemCount > 1 && (
                              <span className="text-gray-500 ml-1">
                                +{order.itemCount - 1} more
                              </span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {order.fulfillmentType === 'DELIVERY' ? (
                              <Truck className="h-3 w-3 text-gray-400" />
                            ) : (
                              <Store className="h-3 w-3 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${order.totalAmount.toFixed(2)}
                          </p>
                          <ArrowRight className="h-4 w-4 text-gray-400 ml-auto mt-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Reorder Button */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Link 
                      href={`/reorder/${order.id}`}
                      className="w-full bg-amber-600 text-white py-2 px-3 rounded-lg text-sm font-medium text-center block hover:bg-amber-700 transition-colors"
                    >
                      Reorder Items
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching orders' : 'No orders yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start shopping to see your orders here'
                }
              </p>
              {!searchTerm && (
                <Link 
                  href="/products"
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  Browse Products
                </Link>
              )}
            </div>
          )}

          {/* Continue Shopping */}
          {filteredOrders.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <Link 
                href="/products"
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium text-center block hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
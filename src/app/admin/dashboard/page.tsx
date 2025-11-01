'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
  ShoppingCart,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardMetrics {
  todayOrders: {
    value: number;
    change: number;
    isPositive: boolean;
  };
  todayRevenue: {
    value: number;
    change: number;
    isPositive: boolean;
  };
  pendingOrdersCount: number;
  newCustomers: number;
  totalCustomers: number;
  lowStockCount: number;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  status: string;
  fulfillmentType: string;
  estimatedDelivery?: string;
}

interface RecentActivity {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockQty: number;
  price: number;
}

interface TopProduct {
  id: string;
  name: string;
  price: number;
  media: string[];
  quantitySold: number;
  orderCount: number;
}

interface OrderStatusItem {
  status: string;
  count: number;
}

interface WeeklyRevenueItem {
  date: string;
  order_count: number;
  revenue: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  pendingOrders: PendingOrder[];
  recentActivity: RecentActivity[];
  lowStockProducts: LowStockProduct[];
  topProducts: TopProduct[];
  orderStatusDistribution: OrderStatusItem[];
  weeklyRevenue: WeeklyRevenueItem[];
}

/**
 * Admin Dashboard Homepage
 * 
 * Comprehensive admin dashboard following Context7 best practices:
 * - Key performance metrics with trend indicators
 * - Pending orders requiring immediate attention
 * - Recent activity feed
 * - Inventory alerts for low stock items
 * - Top-performing products
 * - Order status distribution
 * - Revenue trends visualization
 * 
 * Mobile-responsive design with touch-friendly interactions
 */

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/admin/dashboard');
          
          if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
          }
          
          const result = await response.json();
          setDashboardData(result.data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [status, session]);

  // Check authentication and authorization
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.user.name}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin/orders"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Manage Orders
              </Link>
              <Link
                href="/admin/products"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Manage Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.metrics.todayOrders.value}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {dashboardData.metrics.todayOrders.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${
                dashboardData.metrics.todayOrders.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(dashboardData.metrics.todayOrders.change)}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs yesterday</span>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.metrics.todayRevenue.value)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {dashboardData.metrics.todayRevenue.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${
                dashboardData.metrics.todayRevenue.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(dashboardData.metrics.todayRevenue.change)}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs yesterday</span>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.metrics.pendingOrdersCount}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/admin/orders?status=pending"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                View pending orders →
              </Link>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.metrics.lowStockCount}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/admin/products?filter=low-stock"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Check inventory →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Orders Requiring Attention</h3>
              <p className="text-sm text-gray-500">Pending and confirmed orders that need processing</p>
            </div>
            <div className="p-6">
              {dashboardData.pendingOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.pendingOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {order.itemCount} items • {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="ml-4 text-orange-600 hover:text-orange-700"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                  <Link
                    href="/admin/orders"
                    className="block text-center text-orange-600 hover:text-orange-700 font-medium text-sm pt-4"
                  >
                    View all orders →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500">Latest orders from the past 24 hours</p>
            </div>
            <div className="p-6">
              {dashboardData.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(order.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Low Stock Alert</h3>
              <p className="text-sm text-gray-500">Products running low on inventory</p>
            </div>
            <div className="p-6">
              {dashboardData.lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">All products well stocked</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                        <p className="text-sm text-red-600 font-medium">
                          Only {product.stockQty} left in stock
                        </p>
                      </div>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                  <Link
                    href="/admin/products?filter=low-stock"
                    className="block text-center text-orange-600 hover:text-orange-700 font-medium text-sm pt-4"
                  >
                    Manage inventory →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
              <p className="text-sm text-gray-500">Best selling products this week</p>
            </div>
            <div className="p-6">
              {dashboardData.topProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sales data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                          <p className="text-sm text-gray-500">
                            {product.quantitySold} sold • {product.orderCount} orders
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
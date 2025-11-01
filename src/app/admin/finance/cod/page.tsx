'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BanknoteIcon, 
  CheckCircleIcon, 
  ClockIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  SearchIcon,
  FilterIcon,
  DollarSignIcon
} from 'lucide-react';

interface CODOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
  codTracking?: {
    id: string;
    amountDue: number;
    amountCollected: number;
    collectedAt: string | null;
    variance: number;
    isReconciled: boolean;
  };
}

interface CODCollection {
  orderId: string;
  amountCollected: number;
  notes?: string;
}

export default function CODManagement() {
  const [orders, setOrders] = useState<CODOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collectionModal, setCollectionModal] = useState<{
    open: boolean;
    order: CODOrder | null;
  }>({ open: false, order: null });
  const [collectionForm, setCollectionForm] = useState<CODCollection>({
    orderId: '',
    amountCollected: 0,
    notes: '',
  });

  useEffect(() => {
    fetchCODOrders();
  }, []);

  const fetchCODOrders = async () => {
    try {
      // Fetch COD orders from admin orders API with COD filter
      const response = await fetch('/api/admin/orders?paymentMethod=COD&limit=100');
      if (!response.ok) throw new Error('Failed to fetch COD orders');

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch COD orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectCOD = async () => {
    if (!collectionForm.orderId || collectionForm.amountCollected <= 0) {
      alert('Please enter a valid collection amount');
      return;
    }

    try {
      const response = await fetch('/api/finance/cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record COD collection');
      }

      alert('COD collection recorded successfully!');
      setCollectionModal({ open: false, order: null });
      setCollectionForm({ orderId: '', amountCollected: 0, notes: '' });
      fetchCODOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record COD collection');
    }
  };

  const openCollectionModal = (order: CODOrder) => {
    setCollectionModal({ open: true, order });
    setCollectionForm({
      orderId: order.id,
      amountCollected: order.total,
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'collected' && order.codTracking?.collectedAt) ||
                         (statusFilter === 'pending' && !order.codTracking?.collectedAt) ||
                         (statusFilter === 'delivered' && order.status === 'DELIVERED');

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    collected: orders.filter(o => o.codTracking?.collectedAt).length,
    pending: orders.filter(o => !o.codTracking?.collectedAt).length,
    totalValue: orders.reduce((sum, o) => sum + o.total, 0),
    collectedValue: orders.reduce((sum, o) => sum + (o.codTracking?.amountCollected || 0), 0),
    pendingValue: orders.filter(o => !o.codTracking?.collectedAt).reduce((sum, o) => sum + o.total, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin/finance" className="mr-4">
                <ArrowLeftIcon className="h-6 w-6 text-gray-600 hover:text-gray-800" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">COD Management</h1>
                <p className="text-gray-600 mt-1">Track and collect cash on delivery payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total COD Orders</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <BanknoteIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collected</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.collected}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.collectedValue)}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Collection</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.pendingValue)}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, customers, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <FilterIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">All Orders</option>
                  <option value="delivered">Delivered</option>
                  <option value="pending">Pending Collection</option>
                  <option value="collected">Collected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">COD Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'DELIVERED' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'READY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.codTracking?.collectedAt ? (
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm text-green-600 font-medium">Collected</span>
                          {order.codTracking.variance !== 0 && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded ${
                              order.codTracking.variance > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.codTracking.variance > 0 ? '+' : ''}{formatCurrency(order.codTracking.variance)}
                            </span>
                          )}
                        </div>
                      ) : order.status === 'DELIVERED' ? (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-orange-600 mr-1" />
                          <span className="text-sm text-orange-600 font-medium">Pending Collection</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not Available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {order.status === 'DELIVERED' && !order.codTracking?.collectedAt && (
                        <button
                          onClick={() => openCollectionModal(order)}
                          className="bg-rose-600 text-white px-3 py-1 rounded hover:bg-rose-700 transition-colors"
                        >
                          Collect COD
                        </button>
                      )}
                      {order.codTracking?.collectedAt && (
                        <span className="text-green-600 text-sm">
                          Collected {formatDate(order.codTracking.collectedAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <BanknoteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No COD orders found</p>
                <p className="text-gray-400 text-sm">Orders will appear here when customers place COD orders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COD Collection Modal */}
      {collectionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record COD Collection</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number
                </label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {collectionModal.order?.orderNumber}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <p className="text-sm bg-gray-100 p-2 rounded">
                  {collectionModal.order?.customer.name} - {collectionModal.order?.customer.phone}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Amount
                </label>
                <p className="text-sm bg-gray-100 p-2 rounded">
                  {collectionModal.order ? formatCurrency(collectionModal.order.total) : '—'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Collected *
                </label>
                <div className="relative">
                  <DollarSignIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={collectionForm.amountCollected}
                    onChange={(e) => setCollectionForm(prev => ({ 
                      ...prev, 
                      amountCollected: parseFloat(e.target.value) || 0 
                    }))}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={collectionForm.notes}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Any additional notes about this collection..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setCollectionModal({ open: false, order: null })}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectCOD}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Record Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
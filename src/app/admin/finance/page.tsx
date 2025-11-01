'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  DollarSignIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ClockIcon,
  CreditCardIcon,
  BanknoteIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  FileTextIcon,
  PlusIcon
} from 'lucide-react';

interface FinancialSummary {
  period: {
    from: Date;
    to: Date;
  };
  financial: {
    revenue: number;
    expenses: number;
    netIncome: number;
    assets: number;
    liabilities: number;
    equity: number;
  };
  orders: {
    count: number;
    totalValue: number;
  };
  paymentMethods: Array<{
    paymentMethod: string;
    _count: { id: number };
    _sum: { total: number };
  }>;
  outstandingCOD: {
    total: number;
    count: number;
  };
}

interface CODCollection {
  id: string;
  orderId: string;
  amountDue: number;
  amountCollected: number;
  collectedAt: Date | null;
  variance: number;
  order: {
    orderNumber: string;
    customer: {
      name: string;
      phone: string;
    };
  };
}

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [codData, setCodData] = useState<{ outstanding: { total: number; count: number }; recentCollections: CODCollection[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const fetchFinancialData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        dateFrom: new Date(dateRange.from).toISOString(),
        dateTo: new Date(dateRange.to).toISOString(),
        type: 'summary'
      });

      const response = await fetch(`/api/finance/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch financial data');

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  const fetchCODData = useCallback(async () => {
    try {
      const response = await fetch('/api/finance/cod');
      if (!response.ok) throw new Error('Failed to fetch COD data');

      const data = await response.json();
      setCodData(data);
    } catch (err) {
      console.error('Failed to fetch COD data:', err);
    }
  }, []);

  useEffect(() => {
    fetchFinancialData();
    fetchCODData();
  }, [dateRange, fetchFinancialData, fetchCODData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const initializeAccounts = async () => {
    try {
      const response = await fetch('/api/finance/init-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });

      if (!response.ok) throw new Error('Failed to initialize accounts');
      
      alert('Chart of accounts initialized successfully!');
      fetchFinancialData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to initialize accounts');
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Financial Data</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={initializeAccounts}
                  className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Initialize Chart of Accounts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profitMargin = summary?.financial.revenue ? 
    ((summary.financial.netIncome / summary.financial.revenue) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive financial tracking and reporting</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={initializeAccounts}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Reset Accounts
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {summary ? formatCurrency(summary.financial.revenue) : '—'}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold mt-1 ${
                  summary && summary.financial.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary ? formatCurrency(summary.financial.netIncome) : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                summary && summary.financial.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSignIcon className={`h-6 w-6 ${
                  summary && summary.financial.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding COD</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {codData ? formatCurrency(codData.outstanding.total) : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {codData?.outstanding.count || 0} orders
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders This Period</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {summary?.orders.count || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary ? formatCurrency(summary.orders.totalValue) : '—'} total
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileTextIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {summary?.paymentMethods.map((method) => (
                <div key={method.paymentMethod} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {method.paymentMethod === 'COD' ? (
                      <BanknoteIcon className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <CreditCardIcon className="h-5 w-5 text-blue-600 mr-2" />
                    )}
                    <span className="font-medium">{method.paymentMethod}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(method._sum.total || 0)}</p>
                    <p className="text-sm text-gray-500">{method._count.id} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent COD Collections</h3>
              <Link
                href="/admin/finance/cod"
                className="text-sm text-rose-600 hover:text-rose-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {codData?.recentCollections.slice(0, 5).map((collection) => (
                <div key={collection.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-sm">{collection.order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{collection.order.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(collection.amountCollected)}</p>
                    {collection.variance !== 0 && (
                      <p className={`text-xs ${collection.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {collection.variance > 0 ? '+' : ''}{formatCurrency(collection.variance)} variance
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!codData?.recentCollections || codData.recentCollections.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">No recent collections</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/finance/cod"
              className="flex items-center justify-center bg-orange-50 border-2 border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors"
            >
              <BanknoteIcon className="h-6 w-6 text-orange-600 mr-2" />
              <span className="font-medium text-orange-800">Manage COD</span>
            </Link>

            <Link
              href="/admin/finance/reports"
              className="flex items-center justify-center bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
            >
              <FileTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Financial Reports</span>
            </Link>

            <Link
              href="/admin/finance/adjustments"
              className="flex items-center justify-center bg-purple-50 border-2 border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
            >
              <PlusIcon className="h-6 w-6 text-purple-600 mr-2" />
              <span className="font-medium text-purple-800">Create Adjustment</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
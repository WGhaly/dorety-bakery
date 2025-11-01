'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  DownloadIcon, 
  FileTextIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  BarChart3Icon,
  FilterIcon,
  EyeIcon
} from 'lucide-react';

interface FinancialReport {
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

interface LedgerEntry {
  id: string;
  transactionId: string;
  amount: number;
  direction: 'DEBIT' | 'CREDIT';
  description: string;
  createdAt: string;
  account: {
    code: string;
    name: string;
    type: string;
  };
  order?: {
    orderNumber: string;
    customer: {
      name: string;
    };
  };
}

interface CODAnalysis {
  period: {
    from: Date;
    to: Date;
  };
  statistics: {
    totalOrders: number;
    totalValue: number;
    collected: number;
    collectedValue: number;
    pending: number;
    pendingValue: number;
    variances: Array<{
      orderId: string;
      orderNumber: string;
      expectedAmount: number;
      collectedAmount: number;
      variance: number;
    }>;
  };
  orders: {
    count: number;
    totalValue: number;
  };
}

export default function FinancialReports() {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'cod-analysis'>('summary');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [detailedData, setDetailedData] = useState<{ entries: LedgerEntry[] } | null>(null);
  const [codAnalysis, setCodAnalysis] = useState<CODAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        dateFrom: new Date(dateRange.from).toISOString(),
        dateTo: new Date(dateRange.to).toISOString(),
        type: reportType
      });

      const response = await fetch(`/api/finance/reports?${params}`);
      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();

      if (reportType === 'summary') {
        setReport(data);
        setDetailedData(null);
        setCodAnalysis(null);
      } else if (reportType === 'detailed') {
        setDetailedData(data);
        setReport(null);
        setCodAnalysis(null);
      } else if (reportType === 'cod-analysis') {
        setCodAnalysis(data);
        setReport(null);
        setDetailedData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange.from, dateRange.to]);

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange, generateReport]);

  const exportReport = () => {
    const filename = `financial-report-${reportType}-${dateRange.from}-to-${dateRange.to}.json`;
    const data = report || detailedData || codAnalysis;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <p className="text-gray-600 mt-1">Detailed financial analysis and reporting</p>
              </div>
            </div>
            <button
              onClick={exportReport}
              disabled={!report && !detailedData && !codAnalysis}
              className="flex items-center bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Report Controls */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <FilterIcon className="h-5 w-5 text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'summary' | 'detailed' | 'cod-analysis')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="summary">Financial Summary</option>
                <option value="detailed">Detailed Ledger</option>
                <option value="cod-analysis">COD Analysis</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg p-12 shadow-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent mr-3"></div>
              <span className="text-gray-600">Generating report...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium">Error generating report:</p>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Summary Report */}
        {reportType === 'summary' && report && !loading && (
          <>
            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(report.financial.revenue)}
                    </p>
                  </div>
                  <TrendingUpIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {formatCurrency(report.financial.expenses)}
                    </p>
                  </div>
                  <TrendingDownIcon className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Income</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      report.financial.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(report.financial.netIncome)}
                    </p>
                  </div>
                  <DollarSignIcon className={`h-8 w-8 ${
                    report.financial.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>

            {/* Balance Sheet Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance Sheet</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assets</span>
                    <span className="font-medium">{formatCurrency(report.financial.assets)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Liabilities</span>
                    <span className="font-medium">{formatCurrency(report.financial.liabilities)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-900 font-medium">Equity</span>
                    <span className="font-bold">{formatCurrency(report.financial.equity)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {report.paymentMethods.map((method) => (
                    <div key={method.paymentMethod} className="flex justify-between">
                      <div>
                        <span className="text-gray-900 font-medium">{method.paymentMethod}</span>
                        <p className="text-sm text-gray-500">{method._count.id} orders</p>
                      </div>
                      <span className="font-medium">{formatCurrency(method._sum.total || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{report.orders.count}</p>
                  <p className="text-gray-600 mt-1">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(report.orders.totalValue)}</p>
                  <p className="text-gray-600 mt-1">Order Value</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(report.outstandingCOD.total)}</p>
                  <p className="text-gray-600 mt-1">Outstanding COD</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Detailed Ledger Report */}
        {reportType === 'detailed' && detailedData && !loading && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detailed Ledger Entries</h3>
              <p className="text-sm text-gray-500 mt-1">
                {detailedData.entries.length} entries from {dateRange.from} to {dateRange.to}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailedData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.account.code} - {entry.account.name}
                          </div>
                          <div className="text-sm text-gray-500">{entry.account.type}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{entry.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {entry.direction === 'DEBIT' ? formatCurrency(entry.amount) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {entry.direction === 'CREDIT' ? formatCurrency(entry.amount) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.order ? (
                          <div>
                            <div>{entry.order.orderNumber}</div>
                            <div className="text-xs">{entry.order.customer.name}</div>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detailedData.entries.length === 0 && (
                <div className="text-center py-12">
                  <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No ledger entries found for this period</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COD Analysis Report */}
        {reportType === 'cod-analysis' && codAnalysis && !loading && (
          <>
            {/* COD Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{codAnalysis.statistics.totalOrders}</p>
                  <p className="text-gray-600 mt-1">Total COD Orders</p>
                  <p className="text-sm text-gray-500">{formatCurrency(codAnalysis.statistics.totalValue)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{codAnalysis.statistics.collected}</p>
                  <p className="text-gray-600 mt-1">Collected</p>
                  <p className="text-sm text-gray-500">{formatCurrency(codAnalysis.statistics.collectedValue)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{codAnalysis.statistics.pending}</p>
                  <p className="text-gray-600 mt-1">Pending</p>
                  <p className="text-sm text-gray-500">{formatCurrency(codAnalysis.statistics.pendingValue)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {codAnalysis.statistics.totalOrders > 0 
                      ? ((codAnalysis.statistics.collected / codAnalysis.statistics.totalOrders) * 100).toFixed(1)
                      : 0}%
                  </p>
                  <p className="text-gray-600 mt-1">Collection Rate</p>
                </div>
              </div>
            </div>

            {/* Variances */}
            {codAnalysis.statistics.variances.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Variances</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expected Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collected Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {codAnalysis.statistics.variances.map((variance) => (
                        <tr key={variance.orderId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {variance.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(variance.expectedAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(variance.collectedAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={`${
                              variance.variance > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {variance.variance > 0 ? '+' : ''}{formatCurrency(variance.variance)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
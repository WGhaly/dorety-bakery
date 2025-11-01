'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  SearchIcon,
  FilterIcon
} from 'lucide-react';

interface FinancialAdjustment {
  id: string;
  type: string;
  amount: number;
  reason: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    orderNumber: string;
  };
  customer?: {
    name: string;
    email: string;
  };
}

interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
}

export default function FinancialAdjustments() {
  const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: '',
    amount: 0,
    reason: '',
    description: '',
    debitAccount: '',
    creditAccount: '',
    orderId: '',
    customerId: '',
  });

  const adjustmentTypes = [
    { value: 'COD_SHORTAGE', label: 'COD Shortage' },
    { value: 'COD_OVERAGE', label: 'COD Overage' },
    { value: 'DELIVERY_FEE_WAIVER', label: 'Delivery Fee Waiver' },
    { value: 'PRODUCT_DISCOUNT', label: 'Product Discount' },
    { value: 'REFUND_ADJUSTMENT', label: 'Refund Adjustment' },
    { value: 'INVENTORY_ADJUSTMENT', label: 'Inventory Adjustment' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    fetchAdjustments();
    fetchAccounts();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const response = await fetch('/api/finance/adjustments');
      if (!response.ok) throw new Error('Failed to fetch adjustments');

      const data = await response.json();
      setAdjustments(data.adjustments || []);
    } catch (err) {
      console.error('Failed to fetch adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      // For now, we'll use predefined accounts. In a real app, we'd fetch from /api/finance/accounts
      const predefinedAccounts: ChartOfAccount[] = [
        { id: '1', code: '1000', name: 'Cash', type: 'ASSET', category: 'CASH' },
        { id: '2', code: '1100', name: 'Accounts Receivable', type: 'ASSET', category: 'ACCOUNTS_RECEIVABLE' },
        { id: '3', code: '1200', name: 'COD Receivable', type: 'ASSET', category: 'ACCOUNTS_RECEIVABLE' },
        { id: '4', code: '2000', name: 'Accounts Payable', type: 'LIABILITY', category: 'ACCOUNTS_PAYABLE' },
        { id: '5', code: '4000', name: 'Product Sales', type: 'REVENUE', category: 'PRODUCT_SALES' },
        { id: '6', code: '4100', name: 'Delivery Fee Revenue', type: 'REVENUE', category: 'DELIVERY_FEES' },
        { id: '7', code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'COST_OF_GOODS_SOLD' },
        { id: '8', code: '5200', name: 'Operating Expenses', type: 'EXPENSE', category: 'OPERATING_EXPENSES' },
      ];
      setAccounts(predefinedAccounts);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const handleCreateAdjustment = async () => {
    if (!createForm.type || !createForm.amount || !createForm.reason || !createForm.debitAccount || !createForm.creditAccount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/finance/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create adjustment');
      }

      alert('Financial adjustment created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        type: '',
        amount: 0,
        reason: '',
        description: '',
        debitAccount: '',
        creditAccount: '',
        orderId: '',
        customerId: '',
      });
      fetchAdjustments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create adjustment');
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = adjustment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.order?.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || adjustment.status === statusFilter;
    const matchesType = typeFilter === 'all' || adjustment.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: adjustments.length,
    pending: adjustments.filter(a => a.status === 'PENDING').length,
    approved: adjustments.filter(a => a.status === 'APPROVED').length,
    rejected: adjustments.filter(a => a.status === 'REJECTED').length,
    totalAmount: adjustments.reduce((sum, a) => sum + (a.status === 'APPROVED' ? a.amount : 0), 0),
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
                <h1 className="text-2xl font-bold text-gray-900">Financial Adjustments</h1>
                <p className="text-gray-600 mt-1">Manage financial adjustments and corrections</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Adjustment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Adjustments</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
              </div>
              <FileTextIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Impact</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search adjustments..."
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
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {adjustmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Adjustments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Financial Adjustments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(adjustment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {adjustmentTypes.find(t => t.value === adjustment.type)?.label || adjustment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(adjustment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{adjustment.reason}</div>
                      {adjustment.description && (
                        <div className="text-sm text-gray-500">{adjustment.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(adjustment.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(adjustment.status)}`}>
                          {adjustment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adjustment.order ? (
                        <div>Order: {adjustment.order.orderNumber}</div>
                      ) : adjustment.customer ? (
                        <div>Customer: {adjustment.customer.name}</div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAdjustments.length === 0 && (
              <div className="text-center py-12">
                <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No adjustments found</p>
                <p className="text-gray-400 text-sm">Create your first financial adjustment to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Adjustment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Create Financial Adjustment</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    {adjustmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <div className="relative">
                    <DollarSignIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Debit Account *
                  </label>
                  <select
                    value={createForm.debitAccount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, debitAccount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Select debit account...</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Account *
                  </label>
                  <select
                    value={createForm.creditAccount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, creditAccount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Select credit account...</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  value={createForm.reason}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Brief reason for this adjustment..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Additional details about this adjustment..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={createForm.orderId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, orderId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Related order ID..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={createForm.customerId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Related customer ID..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdjustment}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Create Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
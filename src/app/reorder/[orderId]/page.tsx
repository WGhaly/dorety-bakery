'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

/**
 * Enhanced Reorder Page - Chunk 8 Implementation
 * 
 * Features:
 * - View previous order details
 * - Modify quantities before reordering
 * - Add/remove items from reorder
 * - Bulk reorder with cart integration
 * - Order history context
 * 
 * Following Context7 best practices for e-commerce reorder functionality
 */

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: {
      name: string;
    };
    stock: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface ReorderItem extends OrderItem {
  newQuantity: number;
  isSelected: boolean;
  maxQuantity: number;
}

export default function ReorderPage({ params }: { params: { orderId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCart();
  
  // State management
  const [order, setOrder] = useState<Order | null>(null);
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load order data
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const fetchOrder = async () => {
        try {
          const response = await fetch(`/api/customer/orders/${params.orderId}`);
          if (!response.ok) {
            throw new Error('Order not found');
          }
          
          const orderData = await response.json();
          setOrder(orderData);
          
          // Initialize reorder items with current stock check
          const itemsWithStock = orderData.items.map((item: OrderItem) => ({
            ...item,
            newQuantity: Math.min(item.quantity, item.product.stock),
            isSelected: item.product.stock > 0,
            maxQuantity: item.product.stock,
          }));
          
          setReorderItems(itemsWithStock);
          
        } catch (error) {
          console.error('Error fetching order:', error);
          setError('Failed to load order details');
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [params.orderId, status, session]);

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    redirect('/login?redirect=/orders');
  }

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    setReorderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          newQuantity: Math.max(0, Math.min(newQuantity, item.maxQuantity)),
          isSelected: newQuantity > 0,
        };
      }
      return item;
    }));
  };

  // Toggle item selection
  const toggleSelection = (itemId: string) => {
    setReorderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newSelected = !item.isSelected;
        return {
          ...item,
          isSelected: newSelected,
          newQuantity: newSelected ? Math.min(item.quantity, item.maxQuantity) : 0,
        };
      }
      return item;
    }));
  };

  // Calculate totals
  const selectedItems = reorderItems.filter(item => item.isSelected && item.newQuantity > 0);
  const reorderTotal = selectedItems.reduce((sum, item) => sum + (item.product.price * item.newQuantity), 0);

  // Handle reorder
  const handleReorder = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to reorder');
      return;
    }

    try {
      setSubmitting(true);

      // Add selected items to cart
      for (const item of selectedItems) {
        await addItem(item.productId, item.newQuantity);
      }

      // Redirect to cart
      router.push('/cart');

    } catch (error) {
      console.error('Reorder error:', error);
      alert('Failed to add items to cart. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The order you requested could not be found.'}</p>
          <Link 
            href="/orders"
            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/orders"
            className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Reorder #{order.orderNumber}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    {order.items.length} items
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    ${order.total.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'delivered' 
                    ? 'bg-green-100 text-green-800' 
                    : order.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reorder Items */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Select Items to Reorder</h2>
            <p className="text-gray-600 mt-1">
              Modify quantities or remove items before adding to cart
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {reorderItems.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={() => toggleSelection(item.id)}
                      disabled={item.maxQuantity === 0}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>

                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.product.category.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Original quantity: {item.quantity}
                        </p>
                        {item.maxQuantity === 0 && (
                          <p className="text-sm text-red-600 mt-1 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Out of stock
                          </p>
                        )}
                        {item.maxQuantity > 0 && item.maxQuantity < item.quantity && (
                          <p className="text-sm text-orange-600 mt-1">
                            Only {item.maxQuantity} available (was {item.quantity})
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${item.product.price.toFixed(2)}
                        </p>
                        {item.isSelected && (
                          <p className="text-sm text-gray-600 mt-1">
                            Total: ${(item.product.price * item.newQuantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    {item.maxQuantity > 0 && (
                      <div className="flex items-center space-x-3 mt-4">
                        <span className="text-sm text-gray-700">Quantity:</span>
                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item.id, item.newQuantity - 1)}
                            disabled={item.newQuantity <= 0 || !item.isSelected}
                            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="mx-3 min-w-[2rem] text-center text-sm font-medium">
                            {item.newQuantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.newQuantity + 1)}
                            disabled={item.newQuantity >= item.maxQuantity || !item.isSelected}
                            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-500">
                          Max: {item.maxQuantity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reorder Summary */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reorder Summary</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {selectedItems.length} of {reorderItems.length} items selected
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ${reorderTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleReorder}
                disabled={selectedItems.length === 0 || submitting}
                className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add Selected Items to Cart
                  </>
                )}
              </button>
              
              <Link
                href="/orders"
                className="sm:w-auto bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
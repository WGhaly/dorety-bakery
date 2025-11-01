'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart, CartItem } from '@/hooks/use-cart';
import { useAddresses, Address } from '@/hooks/use-addresses';
import { useCheckout } from '@/hooks/useCheckout';
import { Truck, Store, Plus, MapPin, Clock, CreditCard, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { formatCurrency } from '@/lib/formatCurrency';

/**
 * Checkout Page - Mobile-optimized checkout flow
 * 
 * Features based on Context7 research:
 * - Step-by-step checkout process
 * - Address selection for delivery
 * - Fulfillment options (delivery/pickup)
 * - Order summary with totals
 * - COD payment confirmation
 * - Mobile-first responsive design
 * - Real-time cart updates
 */

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { cart, loading: cartLoading } = useCart();
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const { 
    checkoutData, 
    updateCheckoutData, 
    processCheckout, 
    isProcessing 
  } = useCheckout();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [deliveryWindow, setDeliveryWindow] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('AFTERNOON');
  const [notes, setNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!session) {
      router.push('/login?redirect=/checkout');
    }
  }, [session, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  // Initialize checkout data with default fulfillment type
  useEffect(() => {
    updateCheckoutData({ fulfillmentType });
  }, [fulfillmentType, updateCheckoutData]);

  // Calculate totals
  const subTotal = cart?.items.reduce((sum: number, item: CartItem) => 
    sum + (item.price * item.quantity), 0
  ) || 0;
  
  const deliveryFee = fulfillmentType === 'DELIVERY' ? 25.00 : 0;
  const total = subTotal + deliveryFee;

  // Handle checkout submission
  const handleCheckout = async () => {
    const checkoutPayload = {
      fulfillmentType,
      addressId: fulfillmentType === 'DELIVERY' ? selectedAddressId : undefined,
      deliveryWindow: fulfillmentType === 'DELIVERY' ? deliveryWindow : undefined,
      notes: notes.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    updateCheckoutData(checkoutPayload);
    
    const result = await processCheckout();
    
    if (result.success) {
      router.push(`/orders/${result.orderId}?success=true`);
    } else {
      alert(result.error || 'Failed to place order');
    }
  };

  // Loading states
  if (!session || cartLoading || addressesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Step 1: Fulfillment Type Selection
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="px-4 py-3">
              <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-600">Step 1 of 3: Choose fulfillment</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Fulfillment Options */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-base font-semibold mb-4">How would you like to receive your order?</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="fulfillment"
                    value="DELIVERY"
                    checked={fulfillmentType === 'DELIVERY'}
                    onChange={(e) => setFulfillmentType(e.target.value as 'DELIVERY' | 'PICKUP')}
                    className="text-amber-600"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <Truck className="h-5 w-5 text-amber-600" />
                    <div>
                      <div className="font-medium">Delivery</div>
                      <div className="text-sm text-gray-700">Delivered to your address</div>
                    </div>
                  </div>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">+$25.00</span>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="fulfillment"
                    value="PICKUP"
                    checked={fulfillmentType === 'PICKUP'}
                    onChange={(e) => setFulfillmentType(e.target.value as 'DELIVERY' | 'PICKUP')}
                    className="text-amber-600"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <Store className="h-5 w-5 text-amber-600" />
                    <div>
                      <div className="font-medium">Pickup</div>
                      <div className="text-sm text-gray-700">Collect from bakery</div>
                    </div>
                  </div>
                  <span className="border border-gray-300 text-gray-800 px-2 py-1 rounded text-sm">Free</span>
                </label>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-base font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                {cart?.items.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                      {item.product.media && item.product.media.length > 0 && (
                        <OptimizedImage
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
                      <p className="text-sm text-gray-700">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-3 mt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subTotal)}</span>
                    </div>
                    {fulfillmentType === 'DELIVERY' && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>{formatCurrency(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button 
              className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors"
              onClick={() => {
                // Save fulfillment type to checkout data
                updateCheckoutData({ fulfillmentType });
                setCurrentStep(2);
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Address Selection (for delivery) or Pickup Details
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="px-4 py-3">
              <h1 className="text-lg font-semibold text-gray-900">
                {fulfillmentType === 'DELIVERY' ? 'Delivery Address' : 'Pickup Details'}
              </h1>
              <p className="text-sm text-gray-600">Step 2 of 3</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {fulfillmentType === 'DELIVERY' ? (
              <>
                {/* Address Selection */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold">Select Delivery Address</h3>
                    <Link href="/addresses">
                      <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">
                        <Plus className="h-4 w-4 inline mr-1" />
                        Add
                      </button>
                    </Link>
                  </div>
                  
                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((address: Address) => (
                        <label key={address.id} className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            className="text-amber-600 mt-1"
                          />
                          <div className="flex items-start space-x-2 flex-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">{address.label}</div>
                              <div className="text-sm text-gray-800">
                                {address.line1}
                                {address.line2 && `, ${address.line2}`}
                              </div>
                              <div className="text-sm text-gray-800">
                                {address.area && `${address.area}, `}{address.city}
                              </div>
                              {address.isDefault && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs mt-1 inline-block">Default</span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-700 mb-3">No addresses found</p>
                      <Link href="/addresses">
                        <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">
                          Add Address
                        </button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Delivery Window */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-base font-semibold mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Preferred Delivery Time
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="deliveryWindow"
                        value="MORNING"
                        checked={deliveryWindow === 'MORNING'}
                        onChange={(e) => setDeliveryWindow(e.target.value as 'MORNING' | 'AFTERNOON' | 'EVENING')}
                        className="text-amber-600"
                      />
                      <span>Morning (9 AM - 12 PM)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="deliveryWindow"
                        value="AFTERNOON"
                        checked={deliveryWindow === 'AFTERNOON'}
                        onChange={(e) => setDeliveryWindow(e.target.value as 'MORNING' | 'AFTERNOON' | 'EVENING')}
                        className="text-amber-600"
                      />
                      <span>Afternoon (12 PM - 5 PM)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="deliveryWindow"
                        value="EVENING"
                        checked={deliveryWindow === 'EVENING'}
                        onChange={(e) => setDeliveryWindow(e.target.value as 'MORNING' | 'AFTERNOON' | 'EVENING')}
                        className="text-amber-600"
                      />
                      <span>Evening (5 PM - 8 PM)</span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              /* Pickup Information */
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-base font-semibold mb-4 flex items-center">
                  <Store className="h-4 w-4 mr-2" />
                  Pickup Location
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Dorety Bakery</h4>
                    <p className="text-sm text-gray-700">123 Baker Street</p>
                    <p className="text-sm text-gray-700">Amman, Jordan</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">Pickup Hours:</h5>
                    <p className="text-sm text-gray-700">Daily: 8:00 AM - 8:00 PM</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      📞 We&apos;ll call you when your order is ready for pickup
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-base font-semibold mb-4">Special Instructions</h3>
              <textarea
                placeholder={fulfillmentType === 'DELIVERY' 
                  ? "Any special delivery instructions..."
                  : "Any special pickup instructions..."
                }
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Navigation */}
            <div className="flex space-x-3">
              <button
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </button>
              <button
                className="flex-1 bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  // Save address and delivery window data
                  updateCheckoutData({
                    fulfillmentType,
                    addressId: fulfillmentType === 'DELIVERY' ? selectedAddressId : undefined,
                    deliveryWindow: fulfillmentType === 'DELIVERY' ? deliveryWindow : undefined,
                  });
                  setCurrentStep(3);
                }}
                disabled={fulfillmentType === 'DELIVERY' && !selectedAddressId}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Order Review & Payment
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">Review Order</h1>
              <p className="text-sm text-gray-600">Step 3 of 3: Confirm & pay</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-semibold mb-4">Order Details</h3>
            
            <div className="space-y-4">
              {/* Items */}
              {cart?.items.map((item: CartItem) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                    {item.product.media && item.product.media.length > 0 && (
                      <OptimizedImage
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
                    <p className="text-sm text-gray-700">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}

              <div className="border-t pt-3">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subTotal)}</span>
                  </div>
                  {fulfillmentType === 'DELIVERY' && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment Details */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-semibold mb-4">
              {fulfillmentType === 'DELIVERY' ? 'Delivery Details' : 'Pickup Details'}
            </h3>
            
            <div className="space-y-3">
              {fulfillmentType === 'DELIVERY' ? (
                <>
                  {addresses && (
                    <div>
                      {(() => {
                        const selectedAddress = addresses.find((a: Address) => a.id === selectedAddressId);
                        return selectedAddress ? (
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{selectedAddress.label}</p>
                              <p className="text-sm text-gray-800">
                                {selectedAddress.line1}
                                {selectedAddress.line2 && `, ${selectedAddress.line2}`}
                              </p>
                              <p className="text-sm text-gray-800">
                                {selectedAddress.area && `${selectedAddress.area}, `}{selectedAddress.city}
                              </p>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">
                      Delivery window: {deliveryWindow.toLowerCase()} 
                      {deliveryWindow === 'MORNING' && ' (9 AM - 12 PM)'}
                      {deliveryWindow === 'AFTERNOON' && ' (12 PM - 5 PM)'}
                      {deliveryWindow === 'EVENING' && ' (5 PM - 8 PM)'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-start space-x-2">
                  <Store className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Dorety Bakery</p>
                    <p className="text-sm text-gray-800">123 Baker Street, Amman</p>
                    <p className="text-sm text-gray-800">Ready for pickup within 2 hours</p>
                  </div>
                </div>
              )}

              {specialInstructions && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Special Instructions:</p>
                  <p className="text-sm text-gray-800">{specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-semibold mb-4 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Method
            </h3>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Cash on Delivery (COD)</p>
                <p className="text-sm text-gray-800">Pay when you receive your order</p>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-semibold mb-4">Order Notes (Optional)</h3>
            <textarea
              placeholder="Any additional notes for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Navigation & Place Order */}
          <div className="space-y-3">
            <button
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              onClick={() => setCurrentStep(2)}
              disabled={isProcessing}
            >
              Back to {fulfillmentType === 'DELIVERY' ? 'Address' : 'Pickup Details'}
            </button>
            
            <button
              className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Order...
                </div>
              ) : (
                `Place Order - ${formatCurrency(total)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
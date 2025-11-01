'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckoutData } from '@/lib/validations/checkout';

interface CheckoutContextType {
  // Checkout state
  checkoutData: Partial<CheckoutData>;
  updateCheckoutData: (data: Partial<CheckoutData>) => void;
  
  // Process checkout
  processCheckout: () => Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }>;
  
  // Loading states
  isProcessing: boolean;
  
  // Reset checkout
  resetCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [checkoutData, setCheckoutData] = useState<Partial<CheckoutData>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const updateCheckoutData = useCallback((data: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...data }));
  }, []);

  const processCheckout = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      console.log('Processing checkout with data:', checkoutData);
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      console.log('Checkout response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to process checkout';
        try {
          const errorData = await response.json();
          console.log('Checkout error data:', errorData);
          errorMessage = errorData.error || errorMessage;
          
          // If validation error, include details
          if (errorData.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
            errorMessage = `${errorMessage} - ${fieldErrors}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status})`;
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const result = await response.json();
      console.log('Checkout success result:', result);

      if (result.success) {
        // Reset checkout data after successful order
        setCheckoutData({});
        return {
          success: true,
          orderId: result.data.orderId,
          orderNumber: result.data.orderNumber
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to process checkout'
        };
      }
    } catch (error) {
      console.error('Checkout network error:', error);
      return {
        success: false,
        error: 'Network error occurred'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [checkoutData]);

  const resetCheckout = useCallback(() => {
    setCheckoutData({});
  }, []);

  const value = {
    checkoutData,
    updateCheckoutData,
    processCheckout,
    isProcessing,
    resetCheckout
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/hooks/use-cart';
import { AddressProvider } from '@/hooks/use-addresses';
import { CheckoutProvider } from '@/hooks/useCheckout';
import { ToastProvider } from '@/components/ui/ToastProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AddressProvider>
          <CartProvider>
            <CheckoutProvider>
              {children}
            </CheckoutProvider>
          </CartProvider>
        </AddressProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
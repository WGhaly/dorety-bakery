'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Address types
export interface Address {
  id: string;
  customerId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  area?: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  area?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput extends Partial<AddressInput> {
  id: string;
}

// Context state interface
interface AddressContextState {
  addresses: Address[];
  defaultAddress: Address | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAddresses: () => Promise<void>;
  addAddress: (address: AddressInput) => Promise<Address>;
  updateAddress: (address: UpdateAddressInput) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<Address>;
  clearError: () => void;
}

// Create context
const AddressContext = createContext<AddressContextState | undefined>(undefined);

// Provider component
export function AddressProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get default address
  const defaultAddress = addresses.find(addr => addr.isDefault) || null;

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch addresses from API
  const fetchAddresses = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/addresses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }

      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch addresses';
      setError(errorMessage);
      console.error('Error fetching addresses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  // Add new address
  const addAddress = useCallback(async (addressData: AddressInput): Promise<Address> => {
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }

      const data = await response.json();
      const newAddress = data.address;

      // Update local state
      setAddresses(prev => {
        // If this is set as default, remove default from others
        if (newAddress.isDefault) {
          const updatedAddresses = prev.map(addr => ({
            ...addr,
            isDefault: false,
          }));
          return [newAddress, ...updatedAddresses];
        }
        return [newAddress, ...prev];
      });

      return newAddress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Update existing address
  const updateAddress = useCallback(async (addressData: UpdateAddressInput): Promise<Address> => {
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update address');
      }

      const data = await response.json();
      const updatedAddress = data.address;

      // Update local state
      setAddresses(prev => {
        return prev.map(addr => {
          if (addr.id === updatedAddress.id) {
            return updatedAddress;
          }
          // If updated address is set as default, remove default from others
          if (updatedAddress.isDefault && addr.id !== updatedAddress.id) {
            return { ...addr, isDefault: false };
          }
          return addr;
        });
      });

      return updatedAddress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Delete address
  const deleteAddress = useCallback(async (id: string) => {
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/addresses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }

      // Update local state
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Set default address
  const setDefaultAddress = useCallback(async (id: string): Promise<Address> => {
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/addresses/set-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }

      const data = await response.json();
      const updatedAddress = data.address;

      // Update local state
      setAddresses(prev => {
        return prev.map(addr => ({
          ...addr,
          isDefault: addr.id === id,
        }));
      });

      return updatedAddress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Load addresses when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchAddresses();
    } else if (status === 'unauthenticated') {
      setAddresses([]);
    }
  }, [status, session?.user?.id, fetchAddresses]);

  const value: AddressContextState = {
    addresses,
    defaultAddress,
    isLoading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearError,
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
}

// Hook to use address context
export function useAddresses() {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddresses must be used within an AddressProvider');
  }
  return context;
}

// Utility functions for address formatting
export function formatAddress(address: Address): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.area,
  ].filter(Boolean);
  
  return parts.join(', ');
}

export function formatAddressForDisplay(address: Address): string {
  return `${address.label}: ${formatAddress(address)}`;
}

export function getDefaultAddress(addresses: Address[]): Address | null {
  return addresses.find(addr => addr.isDefault) || null;
}
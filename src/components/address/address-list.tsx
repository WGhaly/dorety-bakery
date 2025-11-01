'use client';

import { useState } from 'react';
import { useAddresses, type Address, formatAddress } from '@/hooks/use-addresses';

interface AddressListProps {
  onEdit?: (address: Address) => void;
  onSelect?: (address: Address) => void;
  selectedAddressId?: string;
  showActions?: boolean;
  maxHeight?: string;
}

export default function AddressList({ 
  onEdit, 
  onSelect, 
  selectedAddressId, 
  showActions = true,
  maxHeight = 'max-h-96'
}: AddressListProps) {
  const { addresses, defaultAddress, deleteAddress, setDefaultAddress, isLoading } = useAddresses();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteAddress(id);
    } catch (error) {
      console.error('Failed to delete address:', error);
      // Error handling is managed by the context
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefaultAddress(id);
    } catch (error) {
      console.error('Failed to set default address:', error);
      // Error handling is managed by the context
    } finally {
      setSettingDefaultId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Addresses</h3>
        <p className="text-gray-600">Add your first delivery address to get started.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 overflow-y-auto ${maxHeight}`}>
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`p-4 border rounded-lg transition-all duration-200 ${
            selectedAddressId === address.id 
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
          } ${onSelect ? 'cursor-pointer' : ''}`}
          onClick={() => onSelect?.(address)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-gray-900">{address.label}</h3>
                {address.isDefault && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                {formatAddress(address)}
              </p>
              
              {address.notes && (
                <p className="text-xs text-gray-500 italic">
                  Note: {address.notes}
                </p>
              )}
            </div>

            {showActions && (
              <div className="flex items-center gap-2 ml-4">
                {!address.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(address.id);
                    }}
                    disabled={settingDefaultId === address.id}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    {settingDefaultId === address.id ? 'Setting...' : 'Set Default'}
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(address);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Edit
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(address.id);
                  }}
                  disabled={deletingId === address.id || addresses.length === 1}
                  className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title={addresses.length === 1 ? 'Cannot delete the only address' : ''}
                >
                  {deletingId === address.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {/* Selected indicator */}
          {onSelect && selectedAddressId === address.id && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center text-blue-600">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Selected for delivery</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
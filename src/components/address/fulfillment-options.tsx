'use client';

import { useState } from 'react';
import { useAddresses, type Address } from '@/hooks/use-addresses';
import AddressList from './address-list';
import AddressForm from './address-form';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

interface FulfillmentOptionsProps {
  selectedType: FulfillmentType;
  selectedAddress?: Address | null;
  onTypeChange: (type: FulfillmentType) => void;
  onAddressChange: (address: Address | null) => void;
}

// Store information (this could come from settings/config)
const STORE_INFO = {
  name: "Dorety Bakery",
  address: "123 Main Street, Cairo, Egypt",
  phone: "+20 123 456 7890",
  hours: {
    "Monday": "9:00 AM - 9:00 PM",
    "Tuesday": "9:00 AM - 9:00 PM", 
    "Wednesday": "9:00 AM - 9:00 PM",
    "Thursday": "9:00 AM - 9:00 PM",
    "Friday": "9:00 AM - 10:00 PM",
    "Saturday": "9:00 AM - 10:00 PM",
    "Sunday": "10:00 AM - 8:00 PM",
  }
};

export default function FulfillmentOptions({
  selectedType,
  selectedAddress,
  onTypeChange,
  onAddressChange,
}: FulfillmentOptionsProps) {
  const { addresses, defaultAddress } = useAddresses();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Get current day for store hours
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = STORE_INFO.hours[currentDay as keyof typeof STORE_INFO.hours];

  const handleTypeChange = (type: FulfillmentType) => {
    onTypeChange(type);
    
    if (type === 'DELIVERY') {
      // Auto-select default address if available
      if (defaultAddress) {
        onAddressChange(defaultAddress);
      } else if (addresses.length === 1) {
        onAddressChange(addresses[0]);
      } else {
        onAddressChange(null);
      }
    } else {
      // Clear address selection for pickup
      onAddressChange(null);
    }
  };

  const handleAddressSelect = (address: Address) => {
    onAddressChange(address);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleAddressFormSuccess = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleAddressFormCancel = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  return (
    <div className="space-y-6">
      {/* Fulfillment Type Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fulfillment Method</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Delivery Option */}
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedType === 'DELIVERY'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTypeChange('DELIVERY')}
          >
            <div className="flex items-center mb-3">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedType === 'DELIVERY'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedType === 'DELIVERY' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V8M5 8v10a2 2 0 002 2h9a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="font-medium text-gray-900">Delivery</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              We&apos;ll deliver your order to your address
            </p>
            <p className="text-xs text-gray-500 ml-7 mt-1">
              Delivery fee may apply based on location
            </p>
          </div>

          {/* Pickup Option */}
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedType === 'PICKUP'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTypeChange('PICKUP')}
          >
            <div className="flex items-center mb-3">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedType === 'PICKUP'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedType === 'PICKUP' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-medium text-gray-900">Pickup</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              Pick up your order from our store
            </p>
            <p className="text-xs text-gray-500 ml-7 mt-1">
              No delivery fees
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Address Selection */}
      {selectedType === 'DELIVERY' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
            <button
              onClick={handleAddNewAddress}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Add New Address
            </button>
          </div>

          {!showAddressForm ? (
            <div>
              {addresses.length > 0 ? (
                <AddressList
                  onEdit={handleEditAddress}
                  onSelect={handleAddressSelect}
                  selectedAddressId={selectedAddress?.id}
                  showActions={true}
                  maxHeight="max-h-64"
                />
              ) : (
                <div className="text-center py-6 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 mb-3">No delivery addresses saved</p>
                  <button
                    onClick={handleAddNewAddress}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Your First Address
                  </button>
                </div>
              )}
            </div>
          ) : (
            <AddressForm
              address={editingAddress || undefined}
              onSuccess={handleAddressFormSuccess}
              onCancel={handleAddressFormCancel}
              isModal={false}
            />
          )}
        </div>
      )}

      {/* Pickup Location Information */}
      {selectedType === 'PICKUP' && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pickup Location</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{STORE_INFO.name}</h4>
              <p className="text-gray-600">{STORE_INFO.address}</p>
              <p className="text-gray-600">{STORE_INFO.phone}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Store Hours</h4>
              <div className="space-y-1">
                {Object.entries(STORE_INFO.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className={`${day === currentDay ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                      {day}
                    </span>
                    <span className={`${day === currentDay ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
              {todayHours && (
                <p className="text-xs text-blue-600 mt-2">
                  Today: {todayHours}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                📍 We&apos;ll notify you when your order is ready for pickup.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
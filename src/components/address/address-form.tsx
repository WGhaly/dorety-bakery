'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAddresses, type AddressInput, type UpdateAddressInput } from '@/hooks/use-addresses';
import { addressSchema } from '@/lib/validation/address';

interface AddressFormProps {
  address?: UpdateAddressInput;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function AddressForm({ address, onSuccess, onCancel, isModal = false }: AddressFormProps) {
  const { addAddress, updateAddress } = useAddresses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!address?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? {
      label: address.label || '',
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      area: address.area || '',
      notes: address.notes || '',
      isDefault: address.isDefault || false,
    } : {
      label: '',
      line1: '',
      line2: '',
      city: '',
      area: '',
      notes: '',
      isDefault: false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: AddressInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing && address?.id) {
        await updateAddress({
          ...data,
          id: address.id,
        });
      } else {
        await addAddress(data);
      }

      reset();
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save address';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSubmitError(null);
    onCancel?.();
  };

  return (
    <div className={`bg-white ${isModal ? 'p-6 rounded-lg shadow-lg' : 'p-4'}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEditing ? 'Update your delivery address details' : 'Enter your delivery address details'}
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Address Label */}
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
            Address Label *
          </label>
          <input
            {...register('label')}
            type="text"
            id="label"
            placeholder="e.g., Home, Office, Work"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          {errors.label && (
            <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>
          )}
        </div>

        {/* Address Line 1 */}
        <div>
          <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 1 *
          </label>
          <input
            {...register('line1')}
            type="text"
            id="line1"
            placeholder="Street address, apartment, suite, etc."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          {errors.line1 && (
            <p className="mt-1 text-sm text-red-600">{errors.line1.message}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div>
          <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 2
          </label>
          <input
            {...register('line2')}
            type="text"
            id="line2"
            placeholder="Building, floor, unit (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          {errors.line2 && (
            <p className="mt-1 text-sm text-red-600">{errors.line2.message}</p>
          )}
        </div>

        {/* City and Area Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              {...register('city')}
              type="text"
              id="city"
              placeholder="City name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
              Area/District
            </label>
            <input
              {...register('area')}
              type="text"
              id="area"
              placeholder="Area or district"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            {errors.area && (
              <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Notes
          </label>
          <textarea
            {...register('notes')}
            id="notes"
            rows={3}
            placeholder="Special delivery instructions (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Set as Default */}
        <div className="flex items-center space-x-3">
          <input
            {...register('isDefault')}
            type="checkbox"
            id="isDefault"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
            Set as default delivery address
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Adding...'}
              </span>
            ) : (
              isEditing ? 'Update Address' : 'Add Address'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-initial bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-base"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
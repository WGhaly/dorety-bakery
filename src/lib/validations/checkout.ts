import { z } from 'zod';

export const checkoutSchema = z.object({
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP'], {
    message: 'Please select delivery or pickup'
  }),
  
  addressId: z.string().optional(),
  
  requestedDeliveryTime: z.coerce.date().optional(),
  
  deliveryWindow: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).optional(),
  
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  
  specialInstructions: z.string().max(300, 'Special instructions cannot exceed 300 characters').optional(),
}).refine((data) => {
  // If delivery is selected, addressId is required
  if (data.fulfillmentType === 'DELIVERY' && !data.addressId) {
    return false;
  }
  return true;
}, {
  message: 'Address is required for delivery orders',
  path: ['addressId']
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
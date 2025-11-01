import { z } from 'zod';

// Address validation schema following best practices for address forms
export const addressSchema = z.object({
  label: z.string()
    .min(1, 'Address label is required')
    .max(50, 'Address label must be less than 50 characters')
    .refine(label => label.trim().length > 0, 'Address label cannot be empty'),
  
  line1: z.string()
    .min(1, 'Address line 1 is required')
    .max(100, 'Address line 1 must be less than 100 characters')
    .refine(line => line.trim().length > 0, 'Address line 1 cannot be empty'),
  
  line2: z.string()
    .max(100, 'Address line 2 must be less than 100 characters')
    .optional(),
  
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters')
    .refine(city => city.trim().length > 0, 'City cannot be empty'),
  
  area: z.string()
    .max(50, 'Area must be less than 50 characters')
    .optional(),
  
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  
  isDefault: z.boolean().default(false),
});

// Schema for updating an address
export const updateAddressSchema = addressSchema.partial().extend({
  id: z.string().cuid('Invalid address ID'),
});

// Schema for setting default address
export const setDefaultAddressSchema = z.object({
  id: z.string().cuid('Invalid address ID'),
});

// Schema for deleting an address
export const deleteAddressSchema = z.object({
  id: z.string().cuid('Invalid address ID'),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type SetDefaultAddressInput = z.infer<typeof setDefaultAddressSchema>;
export type DeleteAddressInput = z.infer<typeof deleteAddressSchema>;

// Common validation for Egyptian addresses (can be extended for international support)
export const egyptianAddressSchema = addressSchema.extend({
  // Optional: Add Egypt-specific validation
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters')
    .refine(city => city.trim().length > 0, 'City cannot be empty'),
  
  area: z.string()
    .min(1, 'Area/District is required for delivery')
    .max(50, 'Area must be less than 50 characters')
    .refine(area => area && area.trim().length > 0, 'Area cannot be empty'),
});

export type EgyptianAddressInput = z.infer<typeof egyptianAddressSchema>;
'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSession, signOut } from 'next-auth/react';

// Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    media: string[];
    isActive: boolean;
    inventoryTrackingEnabled: boolean;
    stockQty?: number;
    inStock: boolean;
  };
}

interface CartTotals {
  subTotal: number;
  totalItems: number;
  totalUniqueItems: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  totals: CartTotals;
  updatedAt: string;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  
  // Cart actions
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateItemQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  
  // Cart utilities
  isEmpty: boolean;
  totalItems: number;
  totalUniqueItems: number;
  subTotal: number;
  inCart: (productId: string) => boolean;
  getItem: (productId: string) => CartItem | undefined;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Default empty cart
const emptyCart: Cart = {
  id: '',
  items: [],
  totals: {
    subTotal: 0,
    totalItems: 0,
    totalUniqueItems: 0,
  },
  updatedAt: new Date().toISOString(),
};

// Guest cart interface for localStorage
interface GuestCartItem {
  productId: string;
  quantity: number;
}

// Guest cart utilities
const GUEST_CART_KEY = 'dorety-guest-cart';

const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading guest cart from localStorage:', error);
    return [];
  }
};

const saveGuestCart = (items: GuestCartItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving guest cart to localStorage:', error);
  }
};

const clearGuestCart = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart from localStorage:', error);
  }
};

// Cart Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cart when user session is available or load guest cart
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      refreshCart();
      // Merge guest cart on login
      mergeGuestCartOnLogin();
    } else if (status === 'unauthenticated') {
      // Load guest cart from localStorage
      loadGuestCart();
    }
  }, [status, session]);

  const loadGuestCart = useCallback(async () => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) {
      setCart(emptyCart);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch product details for guest cart items
      const productIds = guestItems.map(item => item.productId);
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to load product details');
      }

      const data = await response.json();
      const products = data.products || [];

      // Build cart items from guest cart and product data
      const cartItems: CartItem[] = guestItems
        .map((guestItem) => {
          const product = products.find((p: any) => p.id === guestItem.productId);
          if (!product) return null;

          return {
            id: `guest-${guestItem.productId}`,
            productId: guestItem.productId,
            name: product.name,
            price: product.price,
            quantity: guestItem.quantity,
            lineTotal: product.price * guestItem.quantity,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              media: product.media || [],
              isActive: product.isActive,
              inventoryTrackingEnabled: product.inventoryTrackingEnabled,
              stockQty: product.stockQty,
              inStock: product.inStock,
            },
          };
        })
        .filter(Boolean) as CartItem[];

      // Calculate totals
      const subTotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalUniqueItems = cartItems.length;

      const guestCart: Cart = {
        id: 'guest-cart',
        items: cartItems,
        totals: {
          subTotal,
          totalItems,
          totalUniqueItems,
        },
        updatedAt: new Date().toISOString(),
      };

      setCart(guestCart);
    } catch (err) {
      console.error('Error loading guest cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load guest cart');
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, []);

  const mergeGuestCartOnLogin = useCallback(async () => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;

    try {
      // Add guest items to server cart
      for (const item of guestItems) {
        await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            productId: item.productId, 
            quantity: item.quantity 
          }),
        });
      }

      // Clear guest cart after successful merge
      clearGuestCart();
    } catch (err) {
      console.error('Error merging guest cart:', err);
      // Don't clear guest cart on error - user can try again
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/cart');
      
      if (response.status === 404) {
        // User session exists but user not found in database - trigger logout
        console.log('User not found in database, logging out...');
        await signOut({ callbackUrl: '/login?message=session-expired' });
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load cart');
      }
      
      const data = await response.json();
      setCart(data.cart || emptyCart);
    } catch (err) {
      console.error('Cart refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart');
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const addItem = useCallback(async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // If user is authenticated, try server cart first
      if (session?.user) {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, quantity }),
        });

        if (response.status === 404) {
          // User session exists but user not found in database - trigger logout
          console.log('User not found in database, logging out...');
          await signOut({ callbackUrl: '/login?message=session-expired' });
          return false;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add item to cart');
        }

        // Refresh cart to get updated data
        await refreshCart();
        return true;
      } else {
        // Guest user - use localStorage
        const guestItems = getGuestCart();
        const existingIndex = guestItems.findIndex(item => item.productId === productId);

        if (existingIndex >= 0) {
          // Update existing item quantity
          guestItems[existingIndex].quantity += quantity;
        } else {
          // Add new item
          guestItems.push({ productId, quantity });
        }

        saveGuestCart(guestItems);
        // Reload guest cart to update UI
        await loadGuestCart();
        return true;
      }
    } catch (err) {
      console.error('Add item error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, refreshCart, loadGuestCart]);

  const updateItemQuantity = useCallback(async (cartItemId: string, quantity: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // If user is authenticated, try server cart first
      if (session?.user) {
        const response = await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cartItemId, quantity }),
        });

        if (response.status === 404) {
          // User session exists but user not found in database - trigger logout
          console.log('User not found in database, logging out...');
          await signOut({ callbackUrl: '/login?message=session-expired' });
          return false;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update cart item');
        }

        // Refresh cart to get updated data
        await refreshCart();
        return true;
      } else {
        // Guest user - extract productId from cartItemId
        const productId = cartItemId.replace('guest-', '');
        const guestItems = getGuestCart();
        const itemIndex = guestItems.findIndex(item => item.productId === productId);

        if (itemIndex >= 0) {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            guestItems.splice(itemIndex, 1);
          } else {
            guestItems[itemIndex].quantity = quantity;
          }
          saveGuestCart(guestItems);
          await loadGuestCart();
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error('Update item error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cart item');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, refreshCart, loadGuestCart]);

  const removeItem = useCallback(async (cartItemId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // If user is authenticated, use server cart
      if (session?.user) {
        const response = await fetch(`/api/cart/items/${cartItemId}`, {
          method: 'DELETE',
        });

        if (response.status === 404) {
          // User session exists but user not found in database - trigger logout
          console.log('User not found in database, logging out...');
          await signOut({ callbackUrl: '/login?message=session-expired' });
          return false;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove cart item');
        }

        // Refresh cart to get updated data
        await refreshCart();
        return true;
      } else {
        // Guest user - extract productId from cartItemId
        const productId = cartItemId.replace('guest-', '');
        const guestItems = getGuestCart();
        const filteredItems = guestItems.filter(item => item.productId !== productId);
        
        saveGuestCart(filteredItems);
        await loadGuestCart();
        return true;
      }
    } catch (err) {
      console.error('Remove item error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove cart item');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, refreshCart, loadGuestCart]);

  const clearCart = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // If user is authenticated, use server cart
      if (session?.user) {
        const response = await fetch('/api/cart', {
          method: 'DELETE',
        });

        if (response.status === 404) {
          // User session exists but user not found in database - trigger logout
          console.log('User not found in database, logging out...');
          await signOut({ callbackUrl: '/login?message=session-expired' });
          return false;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to clear cart');
        }

        // Set empty cart
        setCart(emptyCart);
        return true;
      } else {
        // Guest user - clear localStorage
        clearGuestCart();
        setCart(emptyCart);
        return true;
      }
    } catch (err) {
      console.error('Clear cart error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Computed values
  const isEmpty = !cart || cart.items.length === 0;
  const totalItems = cart?.totals.totalItems || 0;
  const totalUniqueItems = cart?.totals.totalUniqueItems || 0;
  const subTotal = cart?.totals.subTotal || 0;

  // Utility functions
  const inCart = useCallback((productId: string): boolean => {
    return cart?.items.some(item => item.productId === productId) || false;
  }, [cart]);

  const getItem = useCallback((productId: string): CartItem | undefined => {
    return cart?.items.find(item => item.productId === productId);
  }, [cart]);

  const contextValue: CartContextType = {
    cart,
    loading,
    error,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    refreshCart,
    isEmpty,
    totalItems,
    totalUniqueItems,
    subTotal,
    inCart,
    getItem,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Export the context for advanced usage
export { CartContext };
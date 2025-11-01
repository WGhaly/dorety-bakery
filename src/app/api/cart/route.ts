import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
});

const updateItemSchema = z.object({
  cartItemId: z.string(),
  quantity: z.number().int().min(0), // 0 to remove item
});

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { customerId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                media: true,
                isActive: true,
                inventoryTrackingEnabled: true,
                stockQty: true,
              }
            }
          }
        }
      }
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          customerId: session.user.id,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  media: true,
                  isActive: true,
                  inventoryTrackingEnabled: true,
                  stockQty: true,
                }
              }
            }
          }
        }
      });
    }    // Calculate totals
    const subTotal = cart.items.reduce((sum, item) => {
      return sum + (item.priceSnapshot * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalUniqueItems = cart.items.length;

    // Format response
    const formattedCart = {
      id: cart.id,
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.nameSnapshot,
        price: item.priceSnapshot,
        quantity: item.quantity,
        lineTotal: item.priceSnapshot * item.quantity,
        product: {
          ...item.product,
          media: item.product.media ? JSON.parse(item.product.media) : [],
          inStock: !item.product.inventoryTrackingEnabled || (item.product.stockQty && item.product.stockQty > 0),
        }
      })),
      totals: {
        subTotal,
        totalItems,
        totalUniqueItems,
      },
      updatedAt: cart.updatedAt,
    };

    return NextResponse.json({ cart: formattedCart });

  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json();
    const { productId, quantity } = addItemSchema.parse(body);

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: true,
      }
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // Check stock availability
    if (product.inventoryTrackingEnabled && product.stockQty !== null) {
      if (product.stockQty < quantity) {
        return NextResponse.json(
          { error: `Only ${product.stockQty} items available in stock` },
          { status: 400 }
        );
      }
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { customerId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId: session.user.id },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;
      
      // Check stock for new total quantity
      if (product.inventoryTrackingEnabled && product.stockQty !== null) {
        if (product.stockQty < newQuantity) {
          return NextResponse.json(
            { error: `Only ${product.stockQty} items available in stock` },
            { status: 400 }
          );
        }
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          priceSnapshot: product.price, // Update price snapshot
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              media: true,
              isActive: true,
            }
          }
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          nameSnapshot: product.name,
          priceSnapshot: product.price,
          quantity: quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              media: true,
              isActive: true,
            }
          }
        }
      });
    }

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    // Format response
    const formattedItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: cartItem.nameSnapshot,
      price: cartItem.priceSnapshot,
      quantity: cartItem.quantity,
      lineTotal: cartItem.priceSnapshot * cartItem.quantity,
      product: {
        ...cartItem.product,
        media: cartItem.product.media ? JSON.parse(cartItem.product.media) : [],
      }
    };

    return NextResponse.json({ 
      message: 'Item added to cart successfully',
      item: formattedItem 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Cart POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { cartItemId, quantity } = updateItemSchema.parse(body);

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: {
          customerId: session.user.id,
        },
      },
      include: {
        product: {
          select: {
            inventoryTrackingEnabled: true,
            stockQty: true,
          }
        }
      }
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      // Update cart timestamp
      await prisma.cart.update({
        where: { id: cartItem.cartId },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({ 
        message: 'Item removed from cart successfully' 
      });
    }

    // Check stock availability for new quantity
    if (cartItem.product.inventoryTrackingEnabled && cartItem.product.stockQty !== null) {
      if (cartItem.product.stockQty < quantity) {
        return NextResponse.json(
          { error: `Only ${cartItem.product.stockQty} items available in stock` },
          { status: 400 }
        );
      }
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            media: true,
            isActive: true,
          }
        }
      }
    });

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { updatedAt: new Date() },
    });

    // Format response
    const formattedItem = {
      id: updatedItem.id,
      productId: updatedItem.productId,
      name: updatedItem.nameSnapshot,
      price: updatedItem.priceSnapshot,
      quantity: updatedItem.quantity,
      lineTotal: updatedItem.priceSnapshot * updatedItem.quantity,
      product: {
        ...updatedItem.product,
        media: updatedItem.product.media ? JSON.parse(updatedItem.product.media) : [],
      }
    };

    return NextResponse.json({ 
      message: 'Cart item updated successfully',
      item: formattedItem 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Cart PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Clear all items from user's cart
    const cart = await prisma.cart.findUnique({
      where: { customerId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({ 
        message: 'Cart already empty' 
      });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ 
      message: 'Cart cleared successfully' 
    });

  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
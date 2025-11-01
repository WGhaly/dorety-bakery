import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import slug from 'slug';

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255).optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  cost: z.number().min(0).optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  media: z.array(z.string()).optional(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
  inventoryTrackingEnabled: z.boolean().optional(),
  stockQty: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    sugar: z.number().optional(),
  }).optional(),
  allergens: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
});

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            cartItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    let media = [];
    let allergens = [];
    let badges = [];
    let nutrition = null;

    try {
      media = product.media ? JSON.parse(product.media) : [];
    } catch (e) {
      media = [];
    }

    try {
      allergens = product.allergens ? JSON.parse(product.allergens) : [];
    } catch (e) {
      allergens = [];
    }

    try {
      badges = product.badges ? JSON.parse(product.badges) : [];
    } catch (e) {
      badges = [];
    }

    try {
      nutrition = product.nutrition ? JSON.parse(product.nutrition) : null;
    } catch (e) {
      nutrition = null;
    }

    const productWithParsedData = {
      ...product,
      media,
      allergens,
      badges,
      nutrition,
      salesCount: product._count.orderItems,
      cartCount: product._count.cartItems,
    };

    return NextResponse.json(productWithParsedData);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if SKU is being updated and ensure it's unique
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Verify category exists if being updated
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        );
      }
    }

    // Generate new slug if name is being updated
    let newSlug = existingProduct.slug;
    if (validatedData.name && validatedData.name !== existingProduct.name) {
      const productSlug = slug(validatedData.name);
      let finalSlug = productSlug;
      let counter = 1;

      // Ensure slug is unique (excluding current product)
      while (true) {
        const slugExists = await prisma.product.findUnique({
          where: { slug: finalSlug },
        });
        
        if (!slugExists || slugExists.id === id) {
          break;
        }
        
        finalSlug = `${productSlug}-${counter}`;
        counter++;
      }
      
      newSlug = finalSlug;
    }

    // Prepare update data by excluding array/object fields first
    const { media, allergens, badges, nutrition, ...basicData } = validatedData;
    
    const updateData: Prisma.ProductUpdateInput = {
      ...basicData,
      slug: newSlug,
    };

    // Convert arrays and objects to JSON strings
    if (media) {
      updateData.media = JSON.stringify(media);
    }
    if (allergens) {
      updateData.allergens = JSON.stringify(allergens);
    }
    if (badges) {
      updateData.badges = JSON.stringify(badges);
    }
    if (nutrition) {
      updateData.nutrition = JSON.stringify(nutrition);
    }
    if (validatedData.nutrition) {
      updateData.nutrition = JSON.stringify(validatedData.nutrition);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Parse JSON fields for response
    const productResponse = {
      ...updatedProduct,
      media: updatedProduct.media ? JSON.parse(updatedProduct.media) : [],
      allergens: updatedProduct.allergens ? JSON.parse(updatedProduct.allergens) : [],
      badges: updatedProduct.badges ? JSON.parse(updatedProduct.badges) : [],
      nutrition: updatedProduct.nutrition ? JSON.parse(updatedProduct.nutrition) : null,
    };

    return NextResponse.json(productResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has any orders
    const hasOrders = await prisma.orderItem.findFirst({
      where: { productId: id },
    });

    if (hasOrders) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders. Consider deactivating instead.' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
import { PrismaClient } from '@prisma/client';
import slug from 'slug';

const prisma = new PrismaClient();

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...');

    const categories = [
      {
        name: 'Breads',
        description: 'Fresh baked breads, rolls, and baguettes',
        displayOrder: 1,
      },
      {
        name: 'Pastries',
        description: 'Delicious pastries, croissants, and sweet treats',
        displayOrder: 2,
      },
      {
        name: 'Cakes',
        description: 'Custom cakes, layer cakes, and celebration cakes',
        displayOrder: 3,
      },
      {
        name: 'Cookies',
        description: 'Homemade cookies and biscuits',
        displayOrder: 4,
      },
      {
        name: 'Seasonal',
        description: 'Seasonal specialties and holiday items',
        displayOrder: 5,
      },
    ];

    for (const categoryData of categories) {
      const categorySlug = slug(categoryData.name);
      
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: {
            ...categoryData,
            slug: categorySlug,
          },
        });
        console.log(`✅ Created category: ${categoryData.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${categoryData.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  }
}

async function seedProducts() {
  try {
    console.log('🌱 Seeding products...');

    // Get categories
    const breads = await prisma.category.findUnique({ where: { slug: 'breads' } });
    const pastries = await prisma.category.findUnique({ where: { slug: 'pastries' } });
    const cakes = await prisma.category.findUnique({ where: { slug: 'cakes' } });

    if (!breads || !pastries || !cakes) {
      console.log('❌ Categories not found. Please seed categories first.');
      return;
    }

    const products = [
      {
        name: 'Sourdough Bread',
        shortDescription: 'Traditional artisan sourdough with crispy crust',
        longDescription: 'Our signature sourdough bread made with a 48-hour fermentation process. Features a perfectly crispy crust and soft, tangy interior.',
        price: 8.50,
        cost: 3.25,
        categoryId: breads.id,
        media: [
          'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500',
        ],
        sku: 'BREAD-SOUR-001',
        stockQty: 25,
        lowStockThreshold: 5,
        allergens: ['Gluten', 'Wheat'],
        badges: ['Artisan', 'Popular'],
        nutrition: {
          calories: 180,
          protein: 6,
          carbs: 35,
          fat: 1.5,
          fiber: 3,
          sugar: 2,
        },
      },
      {
        name: 'Chocolate Croissant',
        shortDescription: 'Buttery croissant filled with premium dark chocolate',
        longDescription: 'Classic French pain au chocolat made with layers of buttery pastry and filled with premium Belgian dark chocolate.',
        price: 4.25,
        cost: 1.80,
        categoryId: pastries.id,
        media: [
          'https://images.unsplash.com/photo-1555507036-ab794f0a6068?w=500',
        ],
        sku: 'PAST-CHOC-001',
        stockQty: 40,
        lowStockThreshold: 8,
        allergens: ['Gluten', 'Wheat', 'Dairy', 'Eggs'],
        badges: ['Bestseller'],
        nutrition: {
          calories: 280,
          protein: 5,
          carbs: 32,
          fat: 15,
          fiber: 2,
          sugar: 12,
        },
      },
      {
        name: 'Vanilla Birthday Cake',
        shortDescription: 'Classic vanilla layer cake perfect for celebrations',
        longDescription: 'Three-layer vanilla sponge cake with vanilla buttercream frosting. Can be customized with your choice of decoration and message.',
        price: 35.00,
        cost: 12.50,
        categoryId: cakes.id,
        media: [
          'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=500',
        ],
        sku: 'CAKE-VAN-001',
        stockQty: 5,
        lowStockThreshold: 2,
        allergens: ['Gluten', 'Wheat', 'Dairy', 'Eggs'],
        badges: ['Custom Available'],
        nutrition: {
          calories: 450,
          protein: 6,
          carbs: 65,
          fat: 18,
          fiber: 1,
          sugar: 45,
        },
      },
    ];

    for (const productData of products) {
      const productSlug = slug(productData.name);
      
      const existingProduct = await prisma.product.findUnique({
        where: { slug: productSlug },
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            ...productData,
            slug: productSlug,
            media: JSON.stringify(productData.media),
            allergens: JSON.stringify(productData.allergens),
            badges: JSON.stringify(productData.badges),
            nutrition: JSON.stringify(productData.nutrition),
          },
        });
        console.log(`✅ Created product: ${productData.name}`);
      } else {
        console.log(`⏭️  Product already exists: ${productData.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
}

async function main() {
  console.log('🚀 Starting catalog seed...');
  
  await seedCategories();
  await seedProducts();
  
  console.log('🎉 Catalog seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
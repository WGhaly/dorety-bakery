import { PrismaClient, ConfigCategory, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed initial site configuration settings
    console.log('🔧 Creating site configuration settings...');
    
    const defaultSettings = [
      // Business Information
      { key: 'site_name', value: "Fadi's Bakery", category: 'GENERAL' as ConfigCategory, isPublic: true },
      { key: 'site_tagline', value: 'Fresh baked goods daily', category: 'GENERAL' as ConfigCategory, isPublic: true },
      { key: 'contact_email', value: 'info@fadisbakery.com', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      { key: 'contact_phone', value: '+20123456789', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      { key: 'business_hours_weekday', value: '7:00 AM - 8:00 PM', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      { key: 'business_hours_weekend', value: '8:00 AM - 6:00 PM', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      { key: 'pickup_address', value: '123 Main Street, Cairo, Egypt', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      
      // Technical Settings
      { key: 'currency', value: 'EGP', category: 'GENERAL' as ConfigCategory, isPublic: true },
      { key: 'default_language', value: 'en', category: 'GENERAL' as ConfigCategory, isPublic: true },
      { key: 'timezone', value: 'Africa/Cairo', category: 'GENERAL' as ConfigCategory, isPublic: true },
      { key: 'theme', value: 'light', category: 'APPEARANCE' as ConfigCategory, isPublic: true },
      
      // E-commerce Settings
      { key: 'delivery_fee', value: '25', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      { key: 'free_delivery_threshold', value: '200', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      { key: 'tax_rate', value: '0.14', category: 'BUSINESS' as ConfigCategory, isPublic: false },
      { key: 'minimum_order_amount', value: '50', category: 'BUSINESS' as ConfigCategory, isPublic: true },
      
      // Feature Flags
      { key: 'online_ordering', value: 'true', category: 'FEATURES' as ConfigCategory, isPublic: true },
      { key: 'delivery', value: 'true', category: 'FEATURES' as ConfigCategory, isPublic: true },
      { key: 'pickup', value: 'true', category: 'FEATURES' as ConfigCategory, isPublic: true },
      { key: 'loyalty_program', value: 'true', category: 'FEATURES' as ConfigCategory, isPublic: true },
      { key: 'pre_orders', value: 'true', category: 'FEATURES' as ConfigCategory, isPublic: true },
      { key: 'gift_cards', value: 'false', category: 'FEATURES' as ConfigCategory, isPublic: true },
      { key: 'maintenance_mode', value: 'false', category: 'FEATURES' as ConfigCategory, isPublic: true },
      
      // Admin Settings
      { key: 'admin_email', value: 'admin@fadisbakery.com', category: 'GENERAL' as ConfigCategory, isPublic: false },
      { key: 'order_notification_email', value: 'orders@fadisbakery.com', category: 'GENERAL' as ConfigCategory, isPublic: false },
      { key: 'low_stock_threshold', value: '10', category: 'GENERAL' as ConfigCategory, isPublic: false },
      { key: 'auto_accept_orders', value: 'false', category: 'GENERAL' as ConfigCategory, isPublic: false },
    ];

    // Create settings
    for (const setting of defaultSettings) {
      await prisma.siteConfiguration.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting,
      });
    }

    console.log(`✅ Created ${defaultSettings.length} site configuration settings`);

    // Seed categories
    console.log('🏷️  Creating product categories...');
    
    const categories = [
      {
        name: 'Bread & Rolls',
        slug: 'bread-rolls',
        description: 'Fresh baked bread and rolls daily',
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Pastries',
        slug: 'pastries',
        description: 'Delicious pastries and sweet treats',
        displayOrder: 2,
        isActive: true,
      },
      {
        name: 'Cakes',
        slug: 'cakes',
        description: 'Custom cakes for all occasions',
        displayOrder: 3,
        isActive: true,
      },
      {
        name: 'Cookies',
        slug: 'cookies',
        description: 'Freshly baked cookies',
        displayOrder: 4,
        isActive: true,
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        description: 'Hot and cold beverages',
        displayOrder: 5,
        isActive: true,
      },
    ];

    const createdCategories = [];
    for (const category of categories) {
      const createdCategory = await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      });
      createdCategories.push(createdCategory);
    }
    
    console.log(`✅ Created ${createdCategories.length} product categories`);

    // Seed products using actual schema fields
    console.log('🍞 Creating sample products...');
    
    const products = [
      // Breads
      {
        name: 'White Bread',
        slug: 'white-bread',
        shortDescription: 'Fresh baked white bread loaf',
        longDescription: 'Our classic white bread, baked fresh daily with premium flour and traditional methods. Perfect for sandwiches or toast.',
        price: 15.00,
        cost: 8.00,
        sku: 'BREAD-001',
        categoryId: createdCategories[0].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: 50,
        lowStockThreshold: 10,
        nutrition: JSON.stringify({ calories: 80, protein: 3, carbs: 15, fat: 1 }),
        allergens: 'Gluten, may contain traces of nuts',
      },
      {
        name: 'Whole Wheat Bread',
        slug: 'whole-wheat-bread',
        shortDescription: 'Healthy whole wheat bread loaf',
        longDescription: 'Nutritious whole wheat bread packed with fiber and nutrients. Made with 100% whole grain flour.',
        price: 18.00,
        cost: 10.00,
        sku: 'BREAD-002',
        categoryId: createdCategories[0].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: 30,
        lowStockThreshold: 8,
        nutrition: JSON.stringify({ calories: 85, protein: 4, carbs: 16, fat: 1.5, fiber: 3 }),
        allergens: 'Gluten',
      },
      
      // Pastries
      {
        name: 'Chocolate Croissant',
        slug: 'chocolate-croissant',
        shortDescription: 'Buttery croissant filled with dark chocolate',
        longDescription: 'Flaky, buttery croissant filled with premium dark chocolate. A perfect breakfast treat or afternoon snack.',
        price: 25.00,
        cost: 12.00,
        sku: 'PASTRY-001',
        categoryId: createdCategories[1].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1555507036-ab794f73d3ca?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: 40,
        lowStockThreshold: 10,
        nutrition: JSON.stringify({ calories: 280, protein: 6, carbs: 30, fat: 16 }),
        allergens: 'Gluten, dairy, may contain nuts',
      },
      {
        name: 'Plain Croissant',
        slug: 'plain-croissant',
        shortDescription: 'Classic buttery croissant',
        longDescription: 'Traditional French croissant with layers of buttery pastry. Light, flaky, and perfect with coffee.',
        price: 20.00,
        cost: 10.00,
        sku: 'PASTRY-002',
        categoryId: createdCategories[1].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: 35,
        lowStockThreshold: 8,
        nutrition: JSON.stringify({ calories: 230, protein: 5, carbs: 26, fat: 12 }),
        allergens: 'Gluten, dairy',
      },
      
      // Cakes
      {
        name: 'Chocolate Cake',
        slug: 'chocolate-cake',
        shortDescription: 'Rich chocolate layer cake',
        longDescription: 'Decadent chocolate layer cake with rich chocolate frosting. Perfect for celebrations or special occasions.',
        price: 150.00,
        cost: 60.00,
        sku: 'CAKE-001',
        categoryId: createdCategories[2].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: 10,
        lowStockThreshold: 3,
        nutrition: JSON.stringify({ calories: 350, protein: 6, carbs: 45, fat: 18 }),
        allergens: 'Gluten, dairy, eggs',
      },
      {
        name: 'Red Velvet Cake',
        slug: 'red-velvet-cake',
        shortDescription: 'Classic red velvet cake',
        longDescription: 'Our signature red velvet cake with cream cheese frosting. Moist, flavorful, and beautifully presented.',
        price: 175.00,
        cost: 70.00,
        sku: 'CAKE-002',
        categoryId: createdCategories[2].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: 8,
        lowStockThreshold: 2,
        nutrition: JSON.stringify({ calories: 380, protein: 5, carbs: 50, fat: 19 }),
        allergens: 'Gluten, dairy, eggs',
      },
      
      // Cookies
      {
        name: 'Chocolate Chip Cookies',
        slug: 'chocolate-chip-cookies',
        shortDescription: 'Classic chocolate chip cookies (pack of 6)',
        longDescription: 'Fresh baked chocolate chip cookies made with premium chocolate chips. Soft, chewy, and irresistible.',
        price: 30.00,
        cost: 12.00,
        sku: 'COOKIE-001',
        categoryId: createdCategories[3].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: true,
        stockQty: 60,
        lowStockThreshold: 15,
        nutrition: JSON.stringify({ calories: 150, protein: 2, carbs: 22, fat: 7 }),
        allergens: 'Gluten, dairy, may contain nuts',
      },
      
      // Beverages
      {
        name: 'Espresso Coffee',
        slug: 'espresso-coffee',
        shortDescription: 'Strong Italian espresso',
        longDescription: 'Rich, bold espresso made from premium coffee beans. The perfect pick-me-up any time of day.',
        price: 12.00,
        cost: 3.00,
        sku: 'BEV-001',
        categoryId: createdCategories[4].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: false,
        nutrition: JSON.stringify({ calories: 5, caffeine: 64 }),
        allergens: 'None',
      },
      {
        name: 'Cappuccino',
        slug: 'cappuccino',
        shortDescription: 'Espresso with steamed milk and foam',
        longDescription: 'Classic cappuccino with equal parts espresso, steamed milk, and milk foam. Smooth and satisfying.',
        price: 18.00,
        cost: 5.00,
        sku: 'BEV-002',
        categoryId: createdCategories[4].id,
        media: JSON.stringify(['https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop']),
        isActive: true,
        inventoryTrackingEnabled: false,
        nutrition: JSON.stringify({ calories: 120, protein: 6, carbs: 12, fat: 4, caffeine: 64 }),
        allergens: 'Dairy',
      },
    ];
    
    const createdProducts = [];
    for (const product of products) {
      const createdProduct = await prisma.product.upsert({
        where: { slug: product.slug },
        update: product,
        create: product,
      });
      createdProducts.push(createdProduct);
    }
    
    console.log(`✅ Created ${createdProducts.length} sample products`);
    
    // Create test users
    console.log('👥 Creating test users...');
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@fadisbakery.com',
        password: '$2b$10$Uea3KHKlE/F2PxvUwP7X0OymwZe0COIGKOJX1TR/9dsvuYd0V006K', // password: admin123
        phone: '+20123456789',
        role: 'ADMIN' as Role,
        emailVerified: new Date(),
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2b$10$1GB7oWolRpDtaVi9X0mwGu4S.GcNfaTbndVvE.6c0LC8h8mt.dMiu', // password: customer123
        phone: '+20123456790',
        role: 'CUSTOMER' as Role,
        emailVerified: new Date(),
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: '$2b$10$1GB7oWolRpDtaVi9X0mwGu4S.GcNfaTbndVvE.6c0LC8h8mt.dMiu', // password: customer123
        phone: '+20123456791',
        role: 'CUSTOMER' as Role,
        emailVerified: new Date(),
      },
    ];
    
    const createdUsers = [];
    for (const user of users) {
      const createdUser = await prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user,
      });
      createdUsers.push(createdUser);
    }
    
    console.log(`✅ Created ${createdUsers.length} test users`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Seeded data summary:');
    console.log(`   ⚙️  ${defaultSettings.length} configuration settings`);
    console.log(`   🏷️  ${createdCategories.length} product categories`);
    console.log(`   🍞 ${createdProducts.length} sample products`);
    console.log(`   👥 ${createdUsers.length} test users`);
    console.log('\n💡 Test credentials:');
    console.log('   Admin: admin@fadisbakery.com / admin123');
    console.log('   Customer: john@example.com / customer123');
    console.log('   Customer: jane@example.com / customer123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient, TargetUserType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBanners() {
  console.log('🎨 Seeding banner data...');

  try {
    const banners = [
      {
        title: "Fresh Baked Daily",
        subtitle: "Experience the finest quality",
        content: "Try our signature breads and pastries made with premium ingredients",
        imageUrl: "/images/banners/hero-banner1.jpg",
        buttonText: "Shop Now",
        buttonUrl: "/products",
        targetUserType: "ALL" as TargetUserType,
        targetPages: JSON.stringify(["home"]),
        isActive: true,
        priority: 1,
      },
      {
        title: "Special Offers",
        subtitle: "Limited Time",
        content: "Get 20% off on all cakes this week",
        imageUrl: "/images/banners/sidebar-banner2.jpg", 
        buttonText: "View Cakes",
        buttonUrl: "/products/category/cakes",
        targetUserType: "ALL" as TargetUserType,
        targetPages: JSON.stringify(["home", "products"]),
        isActive: true,
        priority: 2,
      },
      {
        title: "New Arrivals",
        subtitle: "Try our latest",
        content: "Introducing artisanal sourdough bread",
        imageUrl: null,
        buttonText: "Learn More",
        buttonUrl: "/products",
        targetUserType: "ALL" as TargetUserType,
        targetPages: JSON.stringify(["home"]),
        isActive: true,
        priority: 3,
      }
    ];

    let createdCount = 0;
    for (const banner of banners) {
      try {
        await prisma.banner.create({
          data: banner,
        });
        createdCount++;
        console.log(`✅ Created banner: ${banner.title}`);
      } catch (error) {
        console.error(`❌ Failed to create banner ${banner.title}:`, error);
      }
    }

    console.log(`🎉 Successfully created ${createdCount} banners!`);
  } catch (error) {
    console.error('❌ Error seeding banners:', error);
    throw error;
  }
}

seedBanners()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
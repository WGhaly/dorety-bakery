import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductImages() {
  console.log('🖼️ Updating product images with local files...');

  try {
    // Update products with local image paths
    const imageUpdates = [
      { slug: 'white-bread', images: ['/images/products/bread1.jpg'] },
      { slug: 'whole-wheat-bread', images: ['/images/products/bagel1.jpg'] },
      { slug: 'chocolate-croissant', images: ['/images/products/croissant1.jpg'] },
      { slug: 'plain-croissant', images: ['/images/products/croissant1.jpg'] },
      { slug: 'chocolate-cake', images: ['/images/products/cake1.jpg'] },
      { slug: 'red-velvet-cake', images: ['/images/products/cake1.jpg'] },
      { slug: 'chocolate-chip-cookies', images: ['/images/products/cookie1.jpg'] },
      { slug: 'espresso-coffee', images: ['/images/products/muffin1.jpg'] },
      { slug: 'cappuccino', images: ['/images/products/donut1.jpg'] },
    ];

    let updatedCount = 0;
    for (const update of imageUpdates) {
      try {
        await prisma.product.update({
          where: { slug: update.slug },
          data: {
            media: JSON.stringify(update.images),
          },
        });
        updatedCount++;
        console.log(`✅ Updated ${update.slug} with local images`);
      } catch (error) {
        console.error(`❌ Failed to update ${update.slug}:`, error);
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} products with local images!`);
  } catch (error) {
    console.error('❌ Error updating product images:', error);
    throw error;
  }
}

updateProductImages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // Create admin user
  const adminEmail = "admin@fadisbakery.com"
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12)
    
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN"
      }
    })
    
    console.log("✅ Admin user created:", admin.email)
  } else {
    console.log("📧 Admin user already exists:", existingAdmin.email)
  }

  // Create test customer
  const customerEmail = "customer@test.com"
  const existingCustomer = await prisma.user.findUnique({
    where: { email: customerEmail }
  })

  if (!existingCustomer) {
    const hashedPassword = await bcrypt.hash("customer123", 12)
    
    const customer = await prisma.user.create({
      data: {
        name: "Test Customer",
        email: customerEmail,
        password: hashedPassword,
        role: "CUSTOMER"
      }
    })
    
    console.log("✅ Test customer created:", customer.email)
  } else {
    console.log("📧 Test customer already exists:", existingCustomer.email)
  }

  // Create sample categories
  const categories = [
    { name: "Bread", slug: "bread", description: "Fresh baked breads" },
    { name: "Pastries", slug: "pastries", description: "Sweet and savory pastries" },
    { name: "Cakes", slug: "cakes", description: "Custom and ready-made cakes" },
    { name: "Cookies", slug: "cookies", description: "Homemade cookies" }
  ]

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name }
    })
    
    if (!existing) {
      await prisma.category.create({ data: category })
      console.log(`✅ Category created: ${category.name}`)
    } else {
      console.log(`📁 Category already exists: ${category.name}`)
    }
  }

  console.log("🎉 Seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
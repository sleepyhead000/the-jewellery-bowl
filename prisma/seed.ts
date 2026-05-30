import "dotenv/config";
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("password", 12);
  const admin = await db.user.upsert({
    where: { email: "sleepy@gmail.com" },
    update: {},
    create: {
      name: "Admin",
      phone: "01700000000",
      email: "sleepy@gmail.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  const googleAdmin = await db.user.upsert({
    where: { email: "khanchowdhuryn@gmail.com" },
    update: {
      role: "ADMIN",
      emailVerified: new Date(),
    },
    create: {
      name: "Khan Chowdhury",
      email: "khanchowdhuryn@gmail.com",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Google admin user: ${googleAdmin.email}`);

  // Create categories
  const categories = [
    { name: "Phone Case", slug: "phone-case", sortOrder: 1 },
    { name: "Eyeglasses", slug: "eyeglasses", sortOrder: 2 },
    { name: "Bag", slug: "bag", sortOrder: 3 },
    { name: "Accessories", slug: "accessories", sortOrder: 4 },
    { name: "Watch", slug: "watch", sortOrder: 5 },
    { name: "Jewellery", slug: "jewellery", sortOrder: 6 },
  ];

  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✓ ${categories.length} categories created`);

  // Create sample products with variants
  const phoneCaseCat = await db.category.findUnique({ where: { slug: "phone-case" } });
  const eyeglassesCat = await db.category.findUnique({ where: { slug: "eyeglasses" } });
  const bagCat = await db.category.findUnique({ where: { slug: "bag" } });
  const watchCat = await db.category.findUnique({ where: { slug: "watch" } });
  const jewCat = await db.category.findUnique({ where: { slug: "jewellery" } });

  const products = [
    {
      name: "iPhone 15 Pro Max Leather Case",
      slug: "iphone-15-pro-max-leather-case",
      description: "Premium genuine leather case for iPhone 15 Pro Max. Offers superior protection with a slim profile.",
      basePrice: 250000, // 2500 BDT in paisa
      status: "ACTIVE" as const,
      categoryId: phoneCaseCat!.id,
      isFeatured: true,
      tags: ["iphone", "leather", "premium"],
      variants: [
        { sku: "CASE-IP15PM-BLK", price: 250000, salePrice: 150000, stock: 50, attributes: { color: "Black" } },
        { sku: "CASE-IP15PM-BRN", price: 250000, salePrice: 150000, stock: 30, attributes: { color: "Brown" } },
        { sku: "CASE-IP15PM-TAN", price: 250000, salePrice: null, stock: 20, attributes: { color: "Tan" } },
      ],
    },
    {
      name: "Premium Sunglasses UV400",
      slug: "premium-sunglasses-uv400",
      description: "Stylish UV400 protection sunglasses with polarized lenses and lightweight frame.",
      basePrice: 350000,
      status: "ACTIVE" as const,
      categoryId: eyeglassesCat!.id,
      isFeatured: true,
      tags: ["sunglasses", "uv400", "polarized"],
      variants: [
        { sku: "SG-UV400-BLK", price: 350000, salePrice: 280000, stock: 40, attributes: { color: "Black" } },
        { sku: "SG-UV400-GLD", price: 350000, salePrice: 280000, stock: 25, attributes: { color: "Gold" } },
      ],
    },
    {
      name: "Luxury Crossbody Bag",
      slug: "luxury-crossbody-bag",
      description: "Elegant crossbody bag crafted from premium materials. Perfect for everyday luxury.",
      basePrice: 850000,
      status: "ACTIVE" as const,
      categoryId: bagCat!.id,
      isFeatured: true,
      tags: ["bag", "crossbody", "luxury"],
      variants: [
        { sku: "BAG-CB-BLK", price: 850000, salePrice: 750000, stock: 15, attributes: { color: "Black" } },
        { sku: "BAG-CB-WHT", price: 850000, salePrice: null, stock: 10, attributes: { color: "White" } },
      ],
    },
    {
      name: "Smart Watch Series 9",
      slug: "smart-watch-series-9",
      description: "Advanced smartwatch with health monitoring, GPS, and AMOLED display.",
      basePrice: 1200000,
      status: "ACTIVE" as const,
      categoryId: watchCat!.id,
      isFeatured: true,
      tags: ["watch", "smart", "fitness"],
      variants: [
        { sku: "SW-S9-BLK-45", price: 1200000, salePrice: 1050000, stock: 20, attributes: { color: "Black", size: "45mm" } },
        { sku: "SW-S9-SLV-41", price: 1100000, salePrice: 950000, stock: 15, attributes: { color: "Silver", size: "41mm" } },
      ],
    },
    {
      name: "Gold Plated Bracelet",
      slug: "gold-plated-bracelet",
      description: "18K gold plated bracelet with adjustable clasp. Tarnish-resistant finish.",
      basePrice: 450000,
      status: "ACTIVE" as const,
      categoryId: jewCat!.id,
      isFeatured: false,
      tags: ["bracelet", "gold", "jewellery"],
      variants: [
        { sku: "JW-BRC-GLD-S", price: 450000, salePrice: null, stock: 30, attributes: { size: "Small" } },
        { sku: "JW-BRC-GLD-M", price: 450000, salePrice: null, stock: 25, attributes: { size: "Medium" } },
        { sku: "JW-BRC-GLD-L", price: 450000, salePrice: null, stock: 20, attributes: { size: "Large" } },
      ],
    },
  ];

  for (const { variants, ...productData } of products) {
    const product = await db.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData,
    });

    for (const variant of variants) {
      await db.productVariant.upsert({
        where: { sku: variant.sku },
        update: {},
        create: {
          ...variant,
          productId: product.id,
        },
      });
    }
  }
  console.log(`  ✓ ${products.length} products with variants created`);

  // Create shipping zones
  const zones = [
    { name: "Inside Dhaka", divisions: ["Dhaka"], flatRate: 8000 }, // 80 BDT
    { name: "Outside Dhaka", divisions: ["Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"], flatRate: 15000 }, // 150 BDT
  ];

  // Delete existing then create (ShippingZone has no unique field for upsert)
  await db.shippingZone.deleteMany();
  for (const zone of zones) {
    await db.shippingZone.create({ data: zone });
  }
  console.log(`  ✓ ${zones.length} shipping zones created`);

  // Create payment accounts
  await db.paymentAccount.deleteMany();
  await db.paymentAccount.create({
    data: {
      method: "BKASH",
      accountNumber: "01XXXXXXXXX",
      accountName: "The Jewellery Bowl",
      isActive: true,
    },
  });
  await db.paymentAccount.create({
    data: {
      method: "NAGAD",
      accountNumber: "01XXXXXXXXX",
      accountName: "The Jewellery Bowl",
      isActive: true,
    },
  });
  console.log("  ✓ Payment accounts created (update numbers in admin settings)");

  // Create default settings
  const defaultSettings = [
    { key: "store_name", value: JSON.stringify("The Jewellery Bowl") },
    { key: "store_tagline", value: JSON.stringify("The Art of Elegance") },
    { key: "store_phone", value: JSON.stringify("01XXXXXXXXX") },
    { key: "store_email", value: JSON.stringify("info@tnluxury.com") },
    { key: "announcement", value: JSON.stringify("Up to 10K BDT 10% Off | Up to 5K BDT Free Delivery") },
    { key: "free_shipping_threshold", value: JSON.stringify(500000) }, // 5000 BDT in paisa
  ];

  for (const setting of defaultSettings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("  ✓ Default settings created");

  console.log("\n✅ Seed complete!");
  console.log("   Admin login: sleepy@gmail.com / password");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

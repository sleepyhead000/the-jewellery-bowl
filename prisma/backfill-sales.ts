import { db } from "../src/lib/db";

async function main(): Promise<void> {
  const variants = await db.productVariant.findMany({
    where: {
      salePrice: { not: null },
      saleEnabled: false,
    },
    select: {
      id: true,
      price: true,
      salePrice: true,
    },
  });

  let updatedCount = 0;

  for (const variant of variants) {
    if (variant.salePrice === null) {
      throw new Error(`Variant ${variant.id} has sale enabled without salePrice`);
    }
    if (variant.salePrice >= variant.price) {
      continue;
    }

    await db.productVariant.update({
      where: { id: variant.id },
      data: {
        saleEnabled: true,
        saleDiscountType: "PRICE",
        saleDiscountValue: variant.salePrice,
      },
    });
    updatedCount += 1;
  }

  console.log(`Backfilled ${updatedCount} variants with explicit sale toggles.`);
}

main()
  .finally(async () => {
    await db.$disconnect();
  });

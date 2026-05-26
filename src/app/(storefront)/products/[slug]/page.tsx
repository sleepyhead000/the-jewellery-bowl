import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import ProductDetailInteractive from "./_components/ProductDetailInteractive";

interface Props {
  params: Promise<{ slug: string }>;
}

const getVariantDisplayName = (attributes: unknown, index: number): string => {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return `Variant ${index + 1}`;
  }
  const record = attributes as Record<string, unknown>;
  const displayName = record.displayName;
  return typeof displayName === "string" && displayName.trim().length > 0
    ? displayName.trim()
    : `Variant ${index + 1}`;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await db.product.findFirst({ where: { slug, status: "ACTIVE" } });
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} - The Jewellery Bowl`,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: true,
      variants: { where: { isActive: true } },
      images: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) notFound();

  const tags: string[] = product.tags;

  const relatedProducts = await db.product.findMany({
    where: {
      status: "ACTIVE",
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    include: { variants: { take: 1 }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <nav className="text-xs text-gray-400 mb-8 space-x-2">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-black transition-colors">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-black transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductDetailInteractive
          productId={product.id}
          productName={product.name}
          categoryName={product.category?.name ?? null}
          description={product.description ?? null}
          basePrice={product.basePrice}
          tags={tags}
          variants={product.variants.map((v, index) => ({
            id: v.id,
            name: getVariantDisplayName(v.attributes, index),
            sku: v.sku,
            price: v.price,
            salePrice: v.salePrice,
            stock: v.stock,
          }))}
          images={product.images.map((img) => ({ url: img.url, variantId: img.variantId ?? null }))}
        />
      </div>

      {product.reviews.length > 0 && (
        <section className="mt-20">
          <h2 className="text-lg font-bold uppercase tracking-tight mb-8">
            Reviews ({product.reviews.length})
          </h2>
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`text-sm ${star <= review.rating ? "text-amber-400" : "text-gray-200"}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.user.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="text-lg font-bold uppercase tracking-tight mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={p.name}
                image={p.images[0]?.url || "/placeholder.svg"}
                price={p.basePrice / 100}
                salePrice={p.variants[0]?.salePrice ? p.variants[0].salePrice / 100 : undefined}
                variantId={p.variants[0]?.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

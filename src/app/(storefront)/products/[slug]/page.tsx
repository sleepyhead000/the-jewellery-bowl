import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import ProductCard from "@/components/storefront/ProductCard";
import ProductImages from "./_components/ProductImages";
import ProductActions from "./_components/ProductActions";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await db.product.findFirst({ where: { slug, status: "ACTIVE" } });
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} — The Jewellery Bowl`,
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

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

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
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-8 space-x-2">
        <a href="/" className="hover:text-black transition-colors">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-black transition-colors">Products</a>
        {product.category && (
          <>
            <span>/</span>
            <a href={`/products?category=${product.category.slug}`} className="hover:text-black transition-colors">
              {product.category.name}
            </a>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <ProductImages images={product.images.map((img) => img.url)} name={product.name} />

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">{product.name}</h1>
            {product.category && (
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">{product.category.name}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold">
              {formatPrice(product.basePrice)}
            </span>
          </div>

          {/* Rating */}
          {product.reviews.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(avgRating) ? "text-amber-400" : "text-gray-200"}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-500">({product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Variant selection + Add to cart */}
          <ProductActions
            productId={product.id}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.sku,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
            }))}
            basePrice={product.basePrice}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {tags.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 px-2 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
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

      {/* Related Products */}
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
                image={p.images[0]?.url || "/placeholder.jpg"}
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

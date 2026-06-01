import { db } from "@/lib/db";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import MobileFilterSortDrawer from "@/components/storefront/MobileFilterSortDrawer";
import { getProductDisplayVariant } from "@/lib/sales";

interface Props {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (params.category) {
    where.category = { slug: params.category };
  }

  const orderBy = (() => {
    switch (params.sort) {
      case "price-asc": return { basePrice: "asc" as const };
      case "price-desc": return { basePrice: "desc" as const };
      case "newest": return { createdAt: "desc" as const };
      default: return { createdAt: "desc" as const };
    }
  })();

  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { variants: { where: { isActive: true }, orderBy: { price: "asc" } }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12 pb-28 md:pb-12 text-[var(--color-text-primary)]">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">All Products</h1>
        <p className="text-sm mt-1 text-[var(--color-text-secondary)]">
          {total} product{total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3">Categories</h3>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/products"
                  className={`text-sm transition-colors ${!params.category ? "font-bold" : ""}`}
                  style={{ color: !params.category ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                >
                  All
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={`text-sm transition-colors ${params.category === cat.slug ? "font-bold" : ""}`}
                    style={{ color: params.category === cat.slug ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                  >
                    {cat.name}
                    <span className="ml-1 text-[var(--color-text-muted)]">
                      ({cat._count.products})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3">Sort By</h3>
            <ul className="space-y-1.5">
              {[
                { value: "newest", label: "Newest" },
                { value: "price-asc", label: "Price: Low to High" },
                { value: "price-desc", label: "Price: High to Low" },
              ].map((option) => (
                <li key={option.value}>
                  <Link
                    href={`/products?${new URLSearchParams({ ...params, sort: option.value, page: "1" }).toString()}`}
                    className={`text-sm transition-colors ${(params.sort || "newest") === option.value ? "font-bold" : ""}`}
                    style={{ color: (params.sort || "newest") === option.value ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                  >
                    {option.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-20 text-[var(--color-text-muted)]">
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-6">
              {products.map((product) => {
                const variant = getProductDisplayVariant(product.variants, new Date());
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    image={product.images[0]?.url || "/placeholder.svg"}
                    price={(variant?.price ?? product.basePrice) / 100}
                    salePrice={variant?.activeSalePrice ? variant.activeSalePrice / 100 : undefined}
                    variantId={variant?.id}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/products?${new URLSearchParams({ ...params, page: p.toString() }).toString()}`}
                  className={`w-10 h-10 flex items-center justify-center text-sm border transition-colors ${
                    p === page
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-product-card-border)]"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileFilterSortDrawer
        categories={categories.map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug }))}
      />
    </div>
  );
}


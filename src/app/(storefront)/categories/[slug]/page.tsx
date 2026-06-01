import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import { getProductDisplayVariant } from "@/lib/sales";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await db.category.findFirst({ where: { slug } });
  if (!category) return { title: "Category Not Found" };
  return { title: `${category.name} — The Jewellery Bowl` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const limit = 20;

  const category = await db.category.findFirst({
    where: { slug },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
      parent: true,
    },
  });

  if (!category) notFound();

  // Include products from this category and its children
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const orderBy = (() => {
    switch (sp.sort) {
      case "price-asc": return { basePrice: "asc" as const };
      case "price-desc": return { basePrice: "desc" as const };
      case "newest": return { createdAt: "desc" as const };
      default: return { createdAt: "desc" as const };
    }
  })();

  const where = { status: "ACTIVE" as const, categoryId: { in: categoryIds } };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { variants: { where: { isActive: true }, orderBy: { price: "asc" } }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12 pb-28 md:pb-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-[var(--color-text-muted)] mb-6 sm:mb-8 flex flex-wrap gap-x-2 gap-y-1">
        <Link href="/" className="hover:text-[var(--color-text-primary)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[var(--color-text-primary)] transition-colors">Products</Link>
        {category.parent && (
          <>
            <span>/</span>
            <Link href={`/categories/${category.parent.slug}`} className="hover:text-[var(--color-text-primary)] transition-colors">
              {category.parent.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[var(--color-text-secondary)]">{category.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">{category.name}</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">{total} product{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="text-sm border border-[var(--color-border)] px-4 py-2 hover:border-[var(--color-product-card-border)] transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center justify-start sm:justify-end mb-6 overflow-x-auto pb-1">
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <span className="text-[var(--color-text-muted)]">Sort:</span>
          {[
            { value: "newest", label: "Newest" },
            { value: "price-asc", label: "Price ↑" },
            { value: "price-desc", label: "Price ↓" },
          ].map((option) => (
            <Link
              key={option.value}
              href={`/categories/${slug}?sort=${option.value}`}
              className={`px-3 py-1 border transition-colors ${
                (sp.sort || "newest") === option.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-product-card-border)]"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          <p className="text-sm">No products in this category yet</p>
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
              href={`/categories/${slug}?${new URLSearchParams({ ...(sp.sort ? { sort: sp.sort } : {}), page: p.toString() }).toString()}`}
              className={`w-10 h-10 flex items-center justify-center text-sm border transition-colors ${
                p === page ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]" : "border-[var(--color-border)] hover:border-[var(--color-product-card-border)]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


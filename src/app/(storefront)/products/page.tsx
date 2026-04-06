import { db } from "@/lib/db";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";

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
      include: { variants: { take: 1 }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">All Products</h1>
        <p className="text-gray-500 text-sm mt-1">{total} product{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3">Categories</h3>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/products"
                  className={`text-sm hover:text-black transition-colors ${!params.category ? "font-bold text-black" : "text-gray-500"}`}
                >
                  All
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={`text-sm hover:text-black transition-colors ${params.category === cat.slug ? "font-bold text-black" : "text-gray-500"}`}
                  >
                    {cat.name}
                    <span className="text-gray-300 ml-1">({cat._count.products})</span>
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
                    className={`text-sm hover:text-black transition-colors ${(params.sort || "newest") === option.value ? "font-bold text-black" : "text-gray-500"}`}
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
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  image={product.images[0]?.url || "/placeholder.jpg"}
                  price={product.basePrice / 100}
                  salePrice={product.variants[0]?.salePrice ? product.variants[0].salePrice / 100 : undefined}
                  variantId={product.variants[0]?.id}
                />
              ))}
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
                      ? "bg-black text-white border-black"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

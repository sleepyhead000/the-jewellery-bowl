import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";

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
      include: { variants: { take: 1 }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-8 space-x-2">
        <a href="/" className="hover:text-black transition-colors">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-black transition-colors">Products</a>
        {category.parent && (
          <>
            <span>/</span>
            <a href={`/categories/${category.parent.slug}`} className="hover:text-black transition-colors">
              {category.parent.name}
            </a>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600">{category.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">{category.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{total} product{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="text-sm border border-gray-300 px-4 py-2 hover:border-black transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Sort:</span>
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
                  ? "border-black bg-black text-white"
                  : "border-gray-300 hover:border-black"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">No products in this category yet</p>
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
              href={`/categories/${slug}?${new URLSearchParams({ ...(sp.sort ? { sort: sp.sort } : {}), page: p.toString() }).toString()}`}
              className={`w-10 h-10 flex items-center justify-center text-sm border transition-colors ${
                p === page ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"
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

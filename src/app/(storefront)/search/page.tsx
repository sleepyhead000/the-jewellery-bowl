import { db } from "@/lib/db";
import ProductCard from "@/components/storefront/ProductCard";
import type { Prisma } from "@/generated/prisma/client";
import { canSearchQuery, normalizeSearchQuery } from "@/lib/search";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawQuery = params.q?.trim() ?? "";
  const query = normalizeSearchQuery(rawQuery);
  const page = parseInt(params.page || "1");
  const limit = 20;

  type SearchProduct = Prisma.ProductGetPayload<{
    include: {
      variants: { take: 1 };
      images: { orderBy: { sortOrder: "asc" }; take: 1 };
    };
  }>;

  let products: SearchProduct[] = [];
  let total = 0;

  if (canSearchQuery(query)) {
    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE" as const,
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    };

    [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { variants: { take: 1 }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      }),
      db.product.count({ where }),
    ]);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">Search</h1>
        {query ? (
          <p className="text-gray-500 text-sm mt-1">
            {total} result{total !== 1 ? "s" : ""} for &ldquo;{rawQuery}&rdquo;
          </p>
        ) : (
          <p className="text-gray-500 text-sm mt-1">Enter a search term above</p>
        )}
      </div>

      {/* Search form */}
      <form action="/search" method="GET" className="mb-10">
        <div className="flex max-w-xl">
          <input
            type="text"
            name="q"
            defaultValue={rawQuery}
            placeholder="Search products..."
            className="flex-1 border border-gray-300 border-r-0 px-4 py-3 text-sm outline-none focus:border-black"
            autoFocus
          />
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {query && products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">No products found for &ldquo;{rawQuery}&rdquo;</p>
          <p className="text-xs mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              image={product.images[0]?.url || "/placeholder.svg"}
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
            <a
              key={p}
              href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
              className={`w-10 h-10 flex items-center justify-center text-sm border transition-colors ${
                p === page ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}


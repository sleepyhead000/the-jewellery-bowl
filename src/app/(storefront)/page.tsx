import Hero from "@/components/storefront/Hero";
import ProductCard from "@/components/storefront/ProductCard";
import SocialProof from "@/components/storefront/SocialProof";
import { db } from "@/lib/db";

export default async function Home() {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return (
    <div className="flex flex-col gap-16 pb-16">
      <Hero />

      {/* Featured Section */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs tracking-[0.3em] text-accent uppercase font-body">Curated for you</p>
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight font-display">New Arrivals</h2>
          <p className="text-gray-400 text-sm tracking-wide font-body max-w-md mx-auto">
            Discover our latest collection of premium accessories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
          {products.map((product) => {
            const variant = product.variants[0];
            const image = product.images[0];
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                image={image?.url || "https://placehold.co/600x600/f5f5f5/999?text=No+Image"}
                price={variant ? variant.price / 100 : product.basePrice / 100}
                salePrice={variant?.salePrice ? variant.salePrice / 100 : undefined}
                variantId={variant?.id}
                isNew={new Date(product.createdAt) > thirtyDaysAgo}
              />
            );
          })}
        </div>
      </section>

      {/* Info Section */}
      <section className="border-y border-gray-100 py-16">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="text-accent text-2xl mb-2">✦</div>
            <h3 className="text-base font-bold uppercase tracking-wide font-display">Free Shipping</h3>
            <p className="text-gray-400 text-sm px-8 font-body">On all orders over ৳5,000 within Bangladesh.</p>
          </div>
          <div className="space-y-3">
            <div className="text-accent text-2xl mb-2">✦</div>
            <h3 className="text-base font-bold uppercase tracking-wide font-display">Premium Quality</h3>
            <p className="text-gray-400 text-sm px-8 font-body">Guaranteed authentic and high-quality materials.</p>
          </div>
          <div className="space-y-3">
            <div className="text-accent text-2xl mb-2">✦</div>
            <h3 className="text-base font-bold uppercase tracking-wide font-display">24/7 Support</h3>
            <p className="text-gray-400 text-sm px-8 font-body">Dedicated customer support for our valued clients.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof />
    </div>
  );
}

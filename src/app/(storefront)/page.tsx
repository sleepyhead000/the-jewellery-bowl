import Hero from "@/components/storefront/Hero";
import ProductCard from "@/components/storefront/ProductCard";
import SocialProof from "@/components/storefront/SocialProof";
import { db } from "@/lib/db";

export default async function Home() {
    const [homepageSetting, newArrivals] = await Promise.all([
        db.setting.findUnique({ where: { key: "homepage_products" } }),
        db.product.findMany({
            where: { status: "ACTIVE" },
            include: {
                variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
    ]);

    const parsed = (typeof homepageSetting?.value === "object" && homepageSetting.value
        ? homepageSetting.value
        : {}) as { featuredIds?: unknown; popularIds?: unknown };

    const featuredIds = Array.isArray(parsed.featuredIds)
        ? parsed.featuredIds.filter((id): id is string => typeof id === "string")
        : [];
    const popularIds = Array.isArray(parsed.popularIds)
        ? parsed.popularIds.filter((id): id is string => typeof id === "string")
        : [];

    const [featuredRaw, popularRaw] = await Promise.all([
        featuredIds.length
            ? db.product.findMany({
                  where: { id: { in: featuredIds }, status: "ACTIVE" },
                  include: {
                      variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
                      images: { orderBy: { sortOrder: "asc" }, take: 1 },
                  },
              })
            : [],
        popularIds.length
            ? db.product.findMany({
                  where: { id: { in: popularIds }, status: "ACTIVE" },
                  include: {
                      variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
                      images: { orderBy: { sortOrder: "asc" }, take: 1 },
                  },
              })
            : [],
    ]);

    const orderByIds = <T extends { id: string }>(items: T[], ids: string[]) =>
        ids.map((id) => items.find((x) => x.id === id)).filter((x): x is T => Boolean(x));

    const featuredProducts = orderByIds(featuredRaw, featuredIds);
    const popularProducts = orderByIds(popularRaw, popularIds);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return (
        <div className="flex flex-col gap-16 pb-16" style={{ background: "#0d0d0d" }}>
            <Hero />

            {/* Featured Products */}
            <section className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-12 space-y-3">
                    <p
                        className="text-[10px] tracking-[0.35em] uppercase font-body"
                        style={{ color: "#C9A84C" }}
                    >
                        Handpicked highlights
                    </p>
                    <h2
                        className="text-3xl md:text-4xl font-bold uppercase tracking-tight font-display"
                        style={{ color: "#E8D9B0" }}
                    >
                        Featured Products
                    </h2>
                    <p
                        className="text-sm tracking-wide font-body max-w-md mx-auto"
                        style={{ color: "#7a6e58" }}
                    >
                        Signature pieces selected from our best collections
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {featuredProducts.map((product) => {
                        const variant = product.variants[0];
                        const image = product.images[0];
                        return (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                slug={product.slug}
                                name={product.name}
                                image={
                                    image?.url ||
                                    "https://placehold.co/600x600/1a1010/7a6e58?text=No+Image"
                                }
                                price={variant ? variant.price / 100 : product.basePrice / 100}
                                salePrice={
                                    variant?.salePrice ? variant.salePrice / 100 : undefined
                                }
                                variantId={variant?.id}
                                isNew={new Date(product.createdAt) > thirtyDaysAgo}
                            />
                        );
                    })}
                </div>
            </section>

            {/* New Arrivals */}
            <section className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-12 space-y-3">
                    <p
                        className="text-[10px] tracking-[0.35em] uppercase font-body"
                        style={{ color: "#C9A84C" }}
                    >
                        Curated for you
                    </p>
                    <h2
                        className="text-3xl md:text-4xl font-bold uppercase tracking-tight font-display"
                        style={{ color: "#E8D9B0" }}
                    >
                        New Arrivals
                    </h2>
                    <p
                        className="text-sm tracking-wide font-body max-w-md mx-auto"
                        style={{ color: "#7a6e58" }}
                    >
                        Discover our latest collection of traditional accessories
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {newArrivals.map((product) => {
                        const variant = product.variants[0];
                        const image = product.images[0];
                        return (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                slug={product.slug}
                                name={product.name}
                                image={
                                    image?.url ||
                                    "https://placehold.co/600x600/1a1010/7a6e58?text=No+Image"
                                }
                                price={variant ? variant.price / 100 : product.basePrice / 100}
                                salePrice={
                                    variant?.salePrice ? variant.salePrice / 100 : undefined
                                }
                                variantId={variant?.id}
                                isNew={new Date(product.createdAt) > thirtyDaysAgo}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Popular Products */}
            <section className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-12 space-y-3">
                    <p
                        className="text-[10px] tracking-[0.35em] uppercase font-body"
                        style={{ color: "#C9A84C" }}
                    >
                        Loved by customers
                    </p>
                    <h2
                        className="text-3xl md:text-4xl font-bold uppercase tracking-tight font-display"
                        style={{ color: "#E8D9B0" }}
                    >
                        Popular Products
                    </h2>
                    <p
                        className="text-sm tracking-wide font-body max-w-md mx-auto"
                        style={{ color: "#7a6e58" }}
                    >
                        Top-rated picks based on customer interest and reviews
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                    {popularProducts.map((product) => {
                        const variant = product.variants[0];
                        const image = product.images[0];
                        return (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                slug={product.slug}
                                name={product.name}
                                image={
                                    image?.url ||
                                    "https://placehold.co/600x600/1a1010/7a6e58?text=No+Image"
                                }
                                price={variant ? variant.price / 100 : product.basePrice / 100}
                                salePrice={
                                    variant?.salePrice ? variant.salePrice / 100 : undefined
                                }
                                variantId={variant?.id}
                                isNew={new Date(product.createdAt) > thirtyDaysAgo}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Features strip */}
            <section
                className="py-14 border-y"
                style={{
                    background: "#1a1010",
                    borderColor: "rgba(201,168,76,0.18)",
                }}
            >
                <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {[
                        {
                            title: "Free Shipping",
                            body: "On all orders over ৳5,000 within Bangladesh.",
                        },
                        {
                            title: "Premium Quality",
                            body: "Guaranteed authentic and high-quality materials.",
                        },
                        {
                            title: "24/7 Support",
                            body: "Dedicated customer support for our valued clients.",
                        },
                    ].map((f) => (
                        <div key={f.title} className="space-y-3">
                            <div className="text-2xl mb-2" style={{ color: "#C9A84C" }}>
                                ✦
                            </div>
                            <h3
                                className="text-sm font-bold uppercase tracking-widest font-display"
                                style={{ color: "#E8D9B0" }}
                            >
                                {f.title}
                            </h3>
                            <p className="text-sm px-8 font-body" style={{ color: "#7a6e58" }}>
                                {f.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Social Proof */}
            <SocialProof />
        </div>
    );
}

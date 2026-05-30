import HomepageDesign from "@/components/storefront/HomepageDesign";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
    defaultHomepageDiscountMerch,
    defaultHomepageHeroSlides,
    defaultHomepageLayoutConfig,
    defaultHomepageTranslations,
    type HomepageSectionConfig,
    normalizeHomepageDiscountMerch,
    normalizeHomepageHeroSlidesConfig,
    normalizeHomepageLayoutConfig,
    normalizeHomepageTranslations,
} from "@/lib/homepage-config";

export const revalidate = 120;

const isMissingTableError = (error: unknown): boolean => {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
};

type HomepageProduct = {
    id: string;
    slug: string;
    name: string;
    image: string;
    price: number;
    salePrice?: number;
    variantId?: string;
};

function mapProduct(product: {
    id: string;
    slug: string;
    name: string;
    basePrice: number;
    variants: Array<{ id: string; price: number; salePrice: number | null }>;
    images: Array<{ url: string }>;
}): HomepageProduct {
    const variant = product.variants[0];
    const image = product.images[0];
    return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: image?.url ?? "https://placehold.co/600x800/e6e0e0/8b7b7b?text=No+Image",
        price: (variant?.price ?? product.basePrice) / 100,
        salePrice: variant?.salePrice ? variant.salePrice / 100 : undefined,
        variantId: variant?.id,
    };
}

async function resolveProductsForSection(
    section: HomepageSectionConfig,
    pinnedDiscountProductIds: string[]
): Promise<HomepageProduct[]> {
    const include = {
        variants: { where: { isActive: true }, orderBy: { price: "asc" as const }, take: 1 },
        images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
    };

    if (section.productSource === "manual" && section.manualProductIds.length > 0) {
        const products = await db.product.findMany({
            where: { id: { in: section.manualProductIds }, status: "ACTIVE" },
            include,
        });
        const ordered = section.manualProductIds
            .map((id) => products.find((product) => product.id === id))
            .filter((product): product is (typeof products)[number] => Boolean(product));
        return ordered.slice(0, section.limit).map(mapProduct);
    }

    if (section.productSource === "category" && section.categorySlug) {
        const products = await db.product.findMany({
            where: { status: "ACTIVE", category: { slug: section.categorySlug } },
            include,
            take: section.limit,
            orderBy: { createdAt: "desc" },
        });
        return products.map(mapProduct);
    }

    if (section.productSource === "discounted") {
        const pinnedProducts = pinnedDiscountProductIds.length
            ? await db.product.findMany({
                  where: {
                      id: { in: pinnedDiscountProductIds },
                      status: "ACTIVE",
                      variants: { some: { isActive: true, salePrice: { not: null } } },
                  },
                  include,
              })
            : [];

        const orderedPinned = pinnedDiscountProductIds
            .map((id) => pinnedProducts.find((product) => product.id === id))
            .filter((product): product is (typeof pinnedProducts)[number] => Boolean(product));

        const remainingLimit = Math.max(section.limit - orderedPinned.length, 0);
        const autoProducts =
            remainingLimit > 0
                ? await db.product.findMany({
                      where: {
                          status: "ACTIVE",
                          variants: { some: { isActive: true, salePrice: { not: null } } },
                          id: { notIn: orderedPinned.map((product) => product.id) },
                      },
                      include,
                      take: remainingLimit,
                      orderBy: { createdAt: "desc" },
                  })
                : [];

        return [...orderedPinned, ...autoProducts].slice(0, section.limit).map(mapProduct);
    }

    if (section.productSource === "popular") {
        const products = await db.product.findMany({
            where: { status: "ACTIVE" },
            include,
            take: section.limit,
            orderBy: [{ reviewCount: "desc" }, { createdAt: "desc" }],
        });
        return products.map(mapProduct);
    }

    const products = await db.product.findMany({
        where: { status: "ACTIVE" },
        include,
        take: section.limit,
        orderBy: { createdAt: "desc" },
    });
    return products.map(mapProduct);
}

export default async function Home() {
    try {
        const [layoutSetting, slidesSetting, translationsSetting, discountMerchSetting] = await Promise.all([
            db.setting.findUnique({ where: { key: "homepage_layout_v1" } }),
            db.setting.findUnique({ where: { key: "homepage_hero_slides" } }),
            db.setting.findUnique({ where: { key: "homepage_translations" } }),
            db.setting.findUnique({ where: { key: "homepage_discount_merch" } }),
        ]);

        const layoutConfig = normalizeHomepageLayoutConfig(layoutSetting?.value ?? defaultHomepageLayoutConfig);
        const heroConfig = normalizeHomepageHeroSlidesConfig(slidesSetting?.value ?? defaultHomepageHeroSlides);
        const translations = normalizeHomepageTranslations(translationsSetting?.value ?? defaultHomepageTranslations);
        const discountMerch = normalizeHomepageDiscountMerch(discountMerchSetting?.value ?? defaultHomepageDiscountMerch);

        const enabledSections = layoutConfig.sections.filter((section) => section.enabled);
        const productsBySectionEntries = await Promise.all(
            enabledSections.map(
                async (section) =>
                    [section.id, await resolveProductsForSection(section, discountMerch.pinnedProductIds)] as const
            )
        );
        const productsBySection = Object.fromEntries(productsBySectionEntries);
        const sectionHasProducts = (sectionId: string) => (productsBySection[sectionId] ?? []).length > 0;
        const cleanedLayoutConfig = {
            ...layoutConfig,
            sections: layoutConfig.sections.map((section) => {
                if (!section.enabled) return section;
                if (["featured", "new_arrivals", "popular", "offers", "category_highlights"].includes(section.type)) {
                    if (!sectionHasProducts(section.id)) return { ...section, enabled: false };
                }
                if (section.type === "promo_spotlight") {
                    const hasCoreContent =
                        section.imageUrl.trim().length > 0 &&
                        section.title.en.trim().length > 0 &&
                        section.title.bn.trim().length > 0 &&
                        section.subtitle.en.trim().length > 0 &&
                        section.subtitle.bn.trim().length > 0;
                    if (!hasCoreContent) return { ...section, enabled: false };
                }
                return section;
            }),
        };

        return (
            <HomepageDesign
                heroConfig={heroConfig}
                layoutConfig={cleanedLayoutConfig}
                translations={translations}
                productsBySection={productsBySection}
            />
        );
    } catch (error) {
        if (!isMissingTableError(error)) {
            throw error;
        }

        const fallbackLayout = normalizeHomepageLayoutConfig(defaultHomepageLayoutConfig);
        const fallbackTranslations = normalizeHomepageTranslations(defaultHomepageTranslations);
        const fallbackHero = normalizeHomepageHeroSlidesConfig(defaultHomepageHeroSlides);
        const disabledLayout = {
            ...fallbackLayout,
            sections: fallbackLayout.sections.map((section) => ({ ...section, enabled: false })),
        };

        return (
            <HomepageDesign
                heroConfig={fallbackHero}
                layoutConfig={disabledLayout}
                translations={fallbackTranslations}
                productsBySection={{}}
            />
        );
    }
}

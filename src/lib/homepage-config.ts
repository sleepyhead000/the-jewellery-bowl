export type LocaleCode = "en" | "bn";

export type LocalizedText = {
    en: string;
    bn: string;
};

export type ProductSourceMode = "manual" | "newest" | "popular" | "discounted" | "category";

export type HomepageSectionType =
    | "offers"
    | "promo_spotlight"
    | "featured"
    | "new_arrivals"
    | "popular"
    | "category_highlights"
    | "trust_strip"
    | "testimonials";

export type HomepageSectionConfig = {
    id: string;
    type: HomepageSectionType;
    enabled: boolean;
    title: LocalizedText;
    subtitle: LocalizedText;
    ctaLabel: LocalizedText;
    ctaHref: string;
    productSource: ProductSourceMode;
    manualProductIds: string[];
    categorySlug: string;
    imageUrl: string;
    imageAlign: "left" | "right" | "center";
    limit: number;
};

export type HomepageLayoutConfig = {
    sectionOrder: string[];
    sections: HomepageSectionConfig[];
};

export type HeroSlide = {
    id: string;
    kicker: LocalizedText;
    headingPrefix: LocalizedText;
    headingAccent: LocalizedText;
    description: LocalizedText;
    ctaLabel: LocalizedText;
    ctaHref: string;
    imageUrl: string;
};

export type HomepageHeroSlidesConfig = {
    autoplayMs: number;
    slides: HeroSlide[];
};

export type HomepageTranslationsConfig = {
    tagline: LocalizedText;
    navHome: LocalizedText;
    navProducts: LocalizedText;
    navAbout: LocalizedText;
    navContact: LocalizedText;
    navHowToBuy: LocalizedText;
    offersLabel: LocalizedText;
    offersTitle: LocalizedText;
    promoTitle: LocalizedText;
    promoBody: LocalizedText;
};

export type HomepageTopbarModeConfig = {
    enabled: boolean;
    mode: "announcements" | "static";
    staticText: LocalizedText;
};

export type HomepageDiscountMerchConfig = {
    pinnedProductIds: string[];
};

const makeText = (en: string, bn: string): LocalizedText => ({ en, bn });

const defaultSections: HomepageSectionConfig[] = [
    {
        id: "offers",
        type: "offers",
        enabled: true,
        title: makeText("Discount", "ডিসকাউন্ট"),
        subtitle: makeText("Limited Time Offers", "সীমিত সময়ের অফার"),
        ctaLabel: makeText("", ""),
        ctaHref: "",
        productSource: "discounted",
        manualProductIds: [],
        categorySlug: "",
        imageUrl: "",
        imageAlign: "center",
        limit: 4,
    },
    {
        id: "promo",
        type: "promo_spotlight",
        enabled: true,
        title: makeText("Buy any 4 rings to get 20% off", "যে কোনো ৪টি রিং কিনলে ২০% ছাড়"),
        subtitle: makeText(
            "Add a touch of timeless elegance to your hands.",
            "আপনার হাতে দিন কালজয়ী সৌন্দর্যের ছোঁয়া।"
        ),
        ctaLabel: makeText("Shop Rings", "রিং দেখুন"),
        ctaHref: "/products",
        productSource: "manual",
        manualProductIds: [],
        categorySlug: "",
        imageUrl: "https://placehold.co/1200x1200/4a3638/e7dcd3?text=Promo+Image",
        imageAlign: "left",
        limit: 1,
    },
    {
        id: "featured",
        type: "featured",
        enabled: true,
        title: makeText("Featured", "ফিচার্ড"),
        subtitle: makeText("Handpicked Essentials", "নির্বাচিত কালেকশন"),
        ctaLabel: makeText("View All", "সব দেখুন"),
        ctaHref: "/products",
        productSource: "manual",
        manualProductIds: [],
        categorySlug: "",
        imageUrl: "",
        imageAlign: "center",
        limit: 5,
    },
    {
        id: "new-arrivals",
        type: "new_arrivals",
        enabled: true,
        title: makeText("New Arrivals", "নতুন এসেছে"),
        subtitle: makeText("Freshly Added Pieces", "সদ্য যুক্ত পণ্য"),
        ctaLabel: makeText("Browse", "ব্রাউজ করুন"),
        ctaHref: "/products?sort=newest",
        productSource: "newest",
        manualProductIds: [],
        categorySlug: "",
        imageUrl: "",
        imageAlign: "center",
        limit: 5,
    },
    {
        id: "popular",
        type: "popular",
        enabled: true,
        title: makeText("Popular", "জনপ্রিয়"),
        subtitle: makeText("Most Loved Picks", "সবচেয়ে পছন্দের"),
        ctaLabel: makeText("Shop Now", "এখনই কিনুন"),
        ctaHref: "/products",
        productSource: "popular",
        manualProductIds: [],
        categorySlug: "",
        imageUrl: "",
        imageAlign: "center",
        limit: 5,
    },
];

export const defaultHomepageLayoutConfig: HomepageLayoutConfig = {
    sectionOrder: defaultSections.map((section) => section.id),
    sections: defaultSections,
};

export const defaultHomepageHeroSlides: HomepageHeroSlidesConfig = {
    autoplayMs: 4500,
    slides: [
        {
            id: "hero-1",
            kicker: makeText("Elegance Collection", "এলিগ্যান্স কালেকশন"),
            headingPrefix: makeText("Earrings that call", "কানের দুল যা বলে"),
            headingAccent: makeText("YOUR NAME", "আপনার নাম"),
            description: makeText(
                "Add a touch of effortless elegance to any outfit.",
                "যেকোনো পোশাকে যুক্ত করুন সহজাত নান্দনিকতার ছোঁয়া।"
            ),
            ctaLabel: makeText("Buy Now", "এখনই কিনুন"),
            ctaHref: "/products",
            imageUrl: "https://placehold.co/1200x1200/4a3638/e7dcd3?text=Hero+Image",
        },
    ],
};

export const defaultHomepageTranslations: HomepageTranslationsConfig = {
    tagline: makeText("Online one-stop-shop for premium jewelries", "প্রিমিয়াম জুয়েলারির অনলাইন ওয়ান-স্টপ-শপ"),
    navHome: makeText("Home", "হোম"),
    navProducts: makeText("Products", "প্রোডাক্টস"),
    navAbout: makeText("About Us", "আমাদের সম্পর্কে"),
    navContact: makeText("Contact", "যোগাযোগ"),
    navHowToBuy: makeText("How To Buy", "কিভাবে কিনবেন"),
    offersLabel: makeText("Discount", "ডিসকাউন্ট"),
    offersTitle: makeText("Limited Time Offers", "সীমিত সময়ের অফার"),
    promoTitle: makeText("Buy any 4 rings to get 20% off", "যে কোনো ৪টি রিং কিনলে ২০% ছাড়"),
    promoBody: makeText(
        "This classic ring blends effortless sophistication with daily comfort.",
        "এই ক্লাসিক রিং দৈনন্দিন আরাম আর পরিশীলিত স্টাইল একসাথে দেয়।"
    ),
};

export const defaultHomepageTopbarMode: HomepageTopbarModeConfig = {
    enabled: true,
    mode: "static",
    staticText: makeText(
        "Online one-stop-shop for premium jewelries",
        "প্রিমিয়াম জুয়েলারির অনলাইন ওয়ান-স্টপ-শপ"
    ),
};

export const defaultHomepageDiscountMerch: HomepageDiscountMerchConfig = {
    pinnedProductIds: [],
};

const ensureText = (value: unknown, fallback: LocalizedText): LocalizedText => {
    const obj = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
    return {
        en: typeof obj.en === "string" && obj.en.trim() ? obj.en.trim() : fallback.en,
        bn: typeof obj.bn === "string" && obj.bn.trim() ? obj.bn.trim() : fallback.bn,
    };
};

const ensureStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
};

const validSourceModes: ProductSourceMode[] = ["manual", "newest", "popular", "discounted", "category"];
const validAlignments: Array<"left" | "right" | "center"> = ["left", "right", "center"];

export function normalizeHomepageLayoutConfig(input: unknown): HomepageLayoutConfig {
    const obj = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    const sectionsRaw = Array.isArray(obj.sections) ? obj.sections : [];

    const sections = defaultHomepageLayoutConfig.sections.map((base) => {
        const matched = sectionsRaw.find((section) => {
            if (!section || typeof section !== "object") return false;
            const entry = section as Record<string, unknown>;
            return entry.id === base.id;
        }) as Record<string, unknown> | undefined;

        const productSource =
            typeof matched?.productSource === "string" && validSourceModes.includes(matched.productSource as ProductSourceMode)
                ? (matched.productSource as ProductSourceMode)
                : base.productSource;

        const imageAlign =
            typeof matched?.imageAlign === "string" && validAlignments.includes(matched.imageAlign as "left" | "right" | "center")
                ? (matched.imageAlign as "left" | "right" | "center")
                : base.imageAlign;

        return {
            ...base,
            enabled: typeof matched?.enabled === "boolean" ? matched.enabled : base.enabled,
            title: ensureText(matched?.title, base.title),
            subtitle: ensureText(matched?.subtitle, base.subtitle),
            ctaLabel: ensureText(matched?.ctaLabel, base.ctaLabel),
            ctaHref: typeof matched?.ctaHref === "string" ? matched.ctaHref.trim() : base.ctaHref,
            productSource,
            manualProductIds: ensureStringArray(matched?.manualProductIds),
            categorySlug: typeof matched?.categorySlug === "string" ? matched.categorySlug.trim() : base.categorySlug,
            imageUrl: typeof matched?.imageUrl === "string" ? matched.imageUrl.trim() : base.imageUrl,
            imageAlign,
            limit:
                typeof matched?.limit === "number" && Number.isFinite(matched.limit)
                    ? Math.max(1, Math.min(12, Math.round(matched.limit)))
                    : base.limit,
        };
    });

    const sectionOrderRaw = ensureStringArray(obj.sectionOrder);
    const normalizedOrder = sectionOrderRaw.filter((id) => sections.some((section) => section.id === id));
    const fallbackIds = sections.map((section) => section.id).filter((id) => !normalizedOrder.includes(id));

    return {
        sections,
        sectionOrder: [...normalizedOrder, ...fallbackIds],
    };
}

export function normalizeHomepageHeroSlidesConfig(input: unknown): HomepageHeroSlidesConfig {
    const obj = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    const slidesRaw = Array.isArray(obj.slides) ? obj.slides : [];
    const slides = slidesRaw
        .map((slide) => {
            if (!slide || typeof slide !== "object") return null;
            const entry = slide as Record<string, unknown>;
            const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : crypto.randomUUID();
            const fallback = defaultHomepageHeroSlides.slides[0];

            return {
                id,
                kicker: ensureText(entry.kicker, fallback.kicker),
                headingPrefix: ensureText(entry.headingPrefix, fallback.headingPrefix),
                headingAccent: ensureText(entry.headingAccent, fallback.headingAccent),
                description: ensureText(entry.description, fallback.description),
                ctaLabel: ensureText(entry.ctaLabel, fallback.ctaLabel),
                ctaHref: typeof entry.ctaHref === "string" && entry.ctaHref.trim() ? entry.ctaHref.trim() : fallback.ctaHref,
                imageUrl:
                    typeof entry.imageUrl === "string" && entry.imageUrl.trim() ? entry.imageUrl.trim() : fallback.imageUrl,
            };
        })
        .filter((slide): slide is HeroSlide => Boolean(slide));

    return {
        autoplayMs:
            typeof obj.autoplayMs === "number" && Number.isFinite(obj.autoplayMs)
                ? Math.max(2500, Math.min(12000, Math.round(obj.autoplayMs)))
                : defaultHomepageHeroSlides.autoplayMs,
        slides: slides.length > 0 ? slides : defaultHomepageHeroSlides.slides,
    };
}

export function normalizeHomepageTranslations(input: unknown): HomepageTranslationsConfig {
    const obj = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    return {
        tagline: ensureText(obj.tagline, defaultHomepageTranslations.tagline),
        navHome: ensureText(obj.navHome, defaultHomepageTranslations.navHome),
        navProducts: ensureText(obj.navProducts, defaultHomepageTranslations.navProducts),
        navAbout: ensureText(obj.navAbout, defaultHomepageTranslations.navAbout),
        navContact: ensureText(obj.navContact, defaultHomepageTranslations.navContact),
        navHowToBuy: ensureText(obj.navHowToBuy, defaultHomepageTranslations.navHowToBuy),
        offersLabel: ensureText(obj.offersLabel, defaultHomepageTranslations.offersLabel),
        offersTitle: ensureText(obj.offersTitle, defaultHomepageTranslations.offersTitle),
        promoTitle: ensureText(obj.promoTitle, defaultHomepageTranslations.promoTitle),
        promoBody: ensureText(obj.promoBody, defaultHomepageTranslations.promoBody),
    };
}

export function normalizeHomepageTopbarMode(input: unknown): HomepageTopbarModeConfig {
    const obj = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    const modeRaw = obj.mode;
    const mode = modeRaw === "announcements" || modeRaw === "static" ? modeRaw : "static";
    return {
        enabled: typeof obj.enabled === "boolean" ? obj.enabled : defaultHomepageTopbarMode.enabled,
        mode,
        staticText: ensureText(obj.staticText, defaultHomepageTopbarMode.staticText),
    };
}

export function normalizeHomepageDiscountMerch(input: unknown): HomepageDiscountMerchConfig {
    const obj = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    return {
        pinnedProductIds: ensureStringArray(obj.pinnedProductIds),
    };
}

export function pickLocalizedText(text: LocalizedText, locale: LocaleCode): string {
    return locale === "bn" ? text.bn : text.en;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HomepageHeroSlidesConfig, HomepageLayoutConfig, HomepageSectionConfig, HomepageTranslationsConfig, LocaleCode } from "@/lib/homepage-config";
import { pickLocalizedText } from "@/lib/homepage-config";
import { useStorefrontLanguage } from "@/components/storefront/StorefrontLanguageProvider";
import HomepageProductCard from "@/components/storefront/HomepageProductCard";

type HomepageProduct = {
    id: string;
    slug: string;
    name: string;
    image: string;
    price: number;
    salePrice?: number;
    variantId?: string;
};

type HomepageProductsBySection = Record<string, HomepageProduct[]>;

type HomepageDesignProps = {
    heroConfig: HomepageHeroSlidesConfig;
    layoutConfig: HomepageLayoutConfig;
    translations: HomepageTranslationsConfig;
    productsBySection: HomepageProductsBySection;
};

const getText = (locale: LocaleCode, value: { en: string; bn: string }) => pickLocalizedText(value, locale);

function SectionProducts({ section, locale, products }: { section: HomepageSectionConfig; locale: LocaleCode; products: HomepageProduct[] }) {
    if (products.length === 0) return null;
    return (
        <section className="container mx-auto px-4 md:px-6 py-12">
            <div className="mb-6">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">{getText(locale, section.title)}</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">{getText(locale, section.subtitle)}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                    <HomepageProductCard key={product.id} {...product} />
                ))}
            </div>
        </section>
    );
}

export default function HomepageDesign(props: HomepageDesignProps) {
    const { heroConfig, layoutConfig, translations, productsBySection } = props;
    const { locale } = useStorefrontLanguage();
    const [heroIndex, setHeroIndex] = useState<number>(0);
    const slides = heroConfig.slides;
    const activeSlide = slides[heroIndex] ?? slides[0];

    useEffect(() => {
        const timer = window.setInterval(() => {
            setHeroIndex((current) => (current + 1) % slides.length);
        }, heroConfig.autoplayMs);
        return () => window.clearInterval(timer);
    }, [heroConfig.autoplayMs, slides.length]);

    const orderedSections = useMemo(() => {
        const sections: HomepageSectionConfig[] = [];
        for (const sectionId of layoutConfig.sectionOrder) {
            const section = layoutConfig.sections.find((entry) => entry.id === sectionId);
            if (section && section.enabled) {
                sections.push(section);
            }
        }
        return sections;
    }, [layoutConfig]);

    const offersSection = orderedSections.find((section) => section.type === "offers");
    const promoSection = orderedSections.find((section) => section.type === "promo_spotlight");
    const productSections = orderedSections.filter((section) => ["featured", "new_arrivals", "popular", "category_highlights"].includes(section.type));

    // Helper to highlight specific words in the promo title based on the design
    const renderPromoTitle = (rawTitle: string) => {
        if (!rawTitle) return null;
        // Splitting by known highlight phrases to inject colors, falling back to raw text if not found
        const parts = rawTitle.split(/(4 rings|20%)/i);
        return parts.map((part, i) => 
            /^(4 rings|20%)$/i.test(part) ? (
                <span key={i} className="text-[#b49586]">{part}</span>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };

    return (
        <div style={{ background: "var(--color-bg)" }}>
            
            {/* HERO SECTION */}
            <section className="py-0 overflow-hidden" style={{ background: "#352828" }}>
                <div className="mx-auto max-w-[1600px] grid grid-cols-2 md:grid-cols-[1.2fr_324px_0.75fr] min-h-[220px] md:min-h-[400px]">
                    <div className="flex flex-col items-center justify-center text-center px-3 py-5 md:px-7 md:py-11 !text-white">
                        <h1 className="text-[15px] md:text-[34px] font-light mb-2 md:mb-3.5 leading-tight" style={{ fontFamily: "var(--font-roboto-condensed), sans-serif" }}>
                            {getText(locale, activeSlide.headingPrefix)}{" "}
                            <span className="text-[#b49586]">{getText(locale, activeSlide.headingAccent)}</span>
                        </h1>
                        <p className="text-[10px] md:text-[12px] max-w-[150px] md:max-w-[294px] mb-3 md:mb-7 leading-[1.45] md:leading-[1.6] !text-white">
                            {getText(locale, activeSlide.description)}
                        </p>
                        <Link href={activeSlide.ctaHref} className="rounded-full px-4 md:px-7 py-1 text-[8px] md:text-[11px] font-medium leading-none transition-colors hover:bg-[#635351] bg-[#786664] text-[#f7f0ea]">
                            {getText(locale, activeSlide.ctaLabel)}
                        </Link>
                        
                        <div className="mt-3 md:mt-8 flex gap-2">
                            {slides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    onClick={() => setHeroIndex(index)}
                                    className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full transition-colors ${index === heroIndex ? "bg-white" : "bg-white/40"}`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="relative min-h-[220px] md:min-h-[400px] border border-[#5c4b4a]">
                        <Image src={activeSlide.imageUrl} alt="Hero visual" fill className="object-cover" sizes="(max-width: 768px) 50vw, 324px" priority />
                    </div>
                    <div className="hidden md:block" />
                </div>
            </section>

            {/* LIMITED TIME OFFERS */}
            {offersSection && (
                <section className="container mx-auto px-4 md:px-6 py-12">
                    <div className="mb-8">
                        <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                            {getText(locale, translations.offersLabel)}
                        </p>
                        <h2 className="text-2xl md:text-3xl text-[var(--color-text-primary)] font-bold border-b-[3px] border-[#b49586] inline-block pb-1.5">
                            {getText(locale, translations.offersTitle)}
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {(productsBySection[offersSection.id] ?? []).map((product) => (
                            <HomepageProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </section>
            )}

            {/* PROMO SPOTLIGHT */}
            {promoSection && (
                <section className="py-11 md:py-17 mt-6" style={{ background: "#352828" }}>
                    <div className="container mx-auto max-w-[700px] px-3 md:px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-7 md:gap-11">
                        
                        <div className="relative aspect-square w-full max-w-[280px] mx-auto md:ml-auto">
                            <Image src={promoSection.imageUrl} alt="Promo visual" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                        </div>
                        
                        <div className="!text-white text-center md:text-left">
                            <h3 className="text-xl md:text-[22px] font-light mb-3 leading-snug !text-white">
                                {renderPromoTitle(getText(locale, promoSection.title))}
                            </h3>
                            <p className="text-sm md:text-[12px] !text-white leading-relaxed whitespace-pre-line">
                                {getText(locale, promoSection.subtitle)}
                            </p>
                        </div>
                        
                    </div>
                </section>
            )}

            {/* STANDARD PRODUCT SECTIONS */}
            {productSections.map((section) => (
                <SectionProducts key={section.id} section={section} locale={locale} products={productsBySection[section.id] ?? []} />
            ))}
            
        </div>
    );
}

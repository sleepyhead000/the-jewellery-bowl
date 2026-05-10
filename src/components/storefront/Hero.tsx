import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

const defaultHeroContent = {
    label: "The Art of Traditional Elegance",
    titleLine1: "The",
    titleAccent: "Jewellery",
    titleLine2: "Bowl",
    subtitle:
        "Handcrafted churis, necklaces & traditional Bengali accessories for those who carry culture in every movement.",
    primaryCtaText: "Shop Collection",
    primaryCtaHref: "/products",
    secondaryCtaText: "View Jewellery",
    secondaryCtaHref: "/categories/jewellery",
    trustItems: ["Premium Quality", "Free Shipping over BDT 5,000", "Authentic Craftsmanship"],
};

function parseHeroContent(value: unknown) {
    const obj = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
    const trustItemsRaw = Array.isArray(obj.trustItems) ? obj.trustItems : [];
    const trustItems = trustItemsRaw
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 3);

    return {
        label: typeof obj.label === "string" ? obj.label.trim() : defaultHeroContent.label,
        titleLine1:
            typeof obj.titleLine1 === "string" ? obj.titleLine1.trim() : defaultHeroContent.titleLine1,
        titleAccent:
            typeof obj.titleAccent === "string" ? obj.titleAccent.trim() : defaultHeroContent.titleAccent,
        titleLine2:
            typeof obj.titleLine2 === "string" ? obj.titleLine2.trim() : defaultHeroContent.titleLine2,
        subtitle: typeof obj.subtitle === "string" ? obj.subtitle.trim() : defaultHeroContent.subtitle,
        primaryCtaText:
            typeof obj.primaryCtaText === "string"
                ? obj.primaryCtaText.trim()
                : defaultHeroContent.primaryCtaText,
        primaryCtaHref:
            typeof obj.primaryCtaHref === "string"
                ? obj.primaryCtaHref.trim()
                : defaultHeroContent.primaryCtaHref,
        secondaryCtaText:
            typeof obj.secondaryCtaText === "string"
                ? obj.secondaryCtaText.trim()
                : defaultHeroContent.secondaryCtaText,
        secondaryCtaHref:
            typeof obj.secondaryCtaHref === "string"
                ? obj.secondaryCtaHref.trim()
                : defaultHeroContent.secondaryCtaHref,
        trustItems: trustItems.length === 3 ? trustItems : defaultHeroContent.trustItems,
    };
}

export default async function Hero() {
    const setting = await db.setting.findUnique({ where: { key: "hero_content" } });
    const hero = parseHeroContent(setting?.value);

    return (
        <section className="relative w-full min-h-[78svh] md:min-h-[86vh] overflow-hidden flex flex-col items-center justify-center text-center px-4 sm:px-6">
            {/* Background image */}
            <Image
                src="https://placehold.co/1920x1080/0a0a0a/0a0a0a?text=+"
                alt="The Jewellery Bowl"
                fill
                priority
                className="object-cover"
            />

            {/* Overlays */}
            <div className="absolute inset-0 bg-black/65 z-[1]" />
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,26,26,0.2) 0%, transparent 70%)",
                }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl pt-20 pb-12 md:pt-16 md:pb-10">
                {/* Label */}
                <p
                    className="text-[10px] sm:text-xs tracking-[0.35em] sm:tracking-[0.45em] uppercase mb-4 sm:mb-5"
                    style={{
                        fontFamily: "var(--font-cormorant), 'Palatino Linotype', serif",
                        color: "#C9A84C",
                    }}
                >
                    {hero.label}
                </p>

                {/* Title */}
                <h1
                    className="uppercase leading-[0.9] mb-5 sm:mb-6"
                    style={{
                        fontFamily: "var(--font-cormorant), 'Palatino Linotype', serif",
                        fontWeight: 600,
                        color: "#E8D9B0",
                        letterSpacing: "0.04em",
                        fontSize: "clamp(3rem, 13vw, 7.5rem)",
                    }}
                >
                    {hero.titleLine1}{" "}
                    <em
                        className="not-italic"
                        style={{ color: "#C9A84C", fontStyle: "italic", fontWeight: 400 }}
                    >
                        {hero.titleAccent}
                    </em>
                    <br />
                    {hero.titleLine2}
                </h1>

                {/* Ornamental divider */}
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                    <span
                        className="block h-px w-14 md:w-20"
                        style={{ background: "rgba(201,168,76,0.4)" }}
                    />
                    <span style={{ color: "#C9A84C", fontSize: "0.8rem" }}>*</span>
                    <span
                        className="block h-px w-14 md:w-20"
                        style={{ background: "rgba(201,168,76,0.4)" }}
                    />
                </div>

                {/* Subtitle */}
                <p
                    className="text-sm sm:text-base md:text-lg max-w-xs sm:max-w-md md:max-w-xl mx-auto mb-8 md:mb-9 leading-relaxed px-2 sm:px-0"
                    style={{
                        fontFamily: "var(--font-cormorant), 'Palatino Linotype', serif",
                        fontStyle: "italic",
                        color: "rgba(232,217,176,0.65)",
                    }}
                >
                    {hero.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex items-center gap-3 flex-wrap justify-center w-full px-2 sm:px-0">
                    <Link
                        href={hero.primaryCtaHref}
                        className="text-[10px] md:text-xs uppercase tracking-[0.22em] px-6 sm:px-9 py-3.5 sm:py-4 transition-all duration-300 hover:opacity-90 w-full sm:w-auto"
                        style={{
                            fontFamily: "var(--font-cormorant), serif",
                            fontWeight: 600,
                            background: "#8B1A1A",
                            color: "#E8D9B0",
                            border: "1px solid #8B1A1A",
                        }}
                    >
                        {hero.primaryCtaText}
                    </Link>
                    <Link
                        href={hero.secondaryCtaHref}
                        className="text-[10px] md:text-xs uppercase tracking-[0.22em] px-6 sm:px-9 py-3.5 sm:py-4 transition-all duration-300 hover:bg-white/5 w-full sm:w-auto"
                        style={{
                            fontFamily: "var(--font-cormorant), serif",
                            fontWeight: 600,
                            color: "#C9A84C",
                            border: "1px solid rgba(201,168,76,0.4)",
                        }}
                    >
                        {hero.secondaryCtaText}
                    </Link>
                </div>

                {/* Trust strip */}
                <div
                    className="flex items-center gap-4 sm:gap-6 mt-8 sm:mt-10 flex-wrap justify-center"
                    style={{ color: "rgba(201,168,76,0.5)" }}
                >
                    {hero.trustItems.map((t, i) => (
                        <span
                            key={t}
                            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.15em]"
                            style={{
                                fontFamily: "var(--font-cormorant), serif",
                            }}
                        >
                            {i > 0 && (
                                <span
                                    className="w-1 h-1 rounded-full"
                                    style={{ background: "rgba(201,168,76,0.35)" }}
                                />
                            )}
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Bottom fade */}
            <div
                className="absolute bottom-0 w-full h-28 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to top, #0d0d0d, transparent)" }}
            />
        </section>
    );
}

"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HomepageTranslationsConfig, LocaleCode } from "@/lib/homepage-config";
import { pickLocalizedText } from "@/lib/homepage-config";
import { useStorefrontLanguage } from "@/components/storefront/StorefrontLanguageProvider";
import HeaderLanguageToggle from "@/components/storefront/HeaderLanguageToggle";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useSearchOverlay } from "@/components/storefront/SearchOverlayProvider";
import NotificationBell from "@/components/notifications/NotificationBell";
import type { FooterLinkConfig } from "@/lib/footer-config";

const getHeaderLinkLabel = (
    link: FooterLinkConfig,
    translations: HomepageTranslationsConfig,
    locale: LocaleCode
): string => {
    if (link.href === "/about") return pickLocalizedText(translations.navAbout, locale);
    if (link.href === "/contact") return pickLocalizedText(translations.navContact, locale);
    if (link.href === "/how-to-buy") return pickLocalizedText(translations.navHowToBuy, locale);
    return link.label;
};

type HeaderBodyProps = {
    translations: HomepageTranslationsConfig;
    topbarAnnouncementText: string;
    topbarStaticText: { en: string; bn: string };
    topbarMode: "announcements" | "static";
    topbarEnabled: boolean;
    headerLinks: FooterLinkConfig[];
};

export default function HeaderBody({
    translations,
    topbarAnnouncementText,
    topbarStaticText,
    topbarMode,
    topbarEnabled,
    headerLinks,
}: HeaderBodyProps) {
    const { locale } = useStorefrontLanguage();
    const { open } = useSearchOverlay();
    const [isHidden, setIsHidden] = useState<boolean>(false);
    const lastScrollYRef = useRef<number>(0);
    const tickingRef = useRef<boolean>(false);

    useEffect(() => {
        lastScrollYRef.current = window.scrollY;

        const onScroll = () => {
            if (tickingRef.current) return;
            tickingRef.current = true;

            window.requestAnimationFrame(() => {
                const currentY = window.scrollY;
                const delta = currentY - lastScrollYRef.current;
                const downThreshold = 8;
                const upThreshold = -6;

                if (currentY <= 10) {
                    setIsHidden(false);
                } else if (delta > downThreshold) {
                    setIsHidden(true);
                } else if (delta < upThreshold) {
                    setIsHidden(false);
                }

                lastScrollYRef.current = currentY;
                tickingRef.current = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const resolvedTopbarText =
        topbarMode === "announcements" && topbarAnnouncementText.trim().length > 0
            ? topbarAnnouncementText
            : pickLocalizedText(topbarStaticText, locale) || pickLocalizedText(translations.tagline, locale);

    return (
        <header
            className={`sticky top-0 z-50 w-full shadow-sm transition-transform duration-400 ease-out ${
                isHidden ? "-translate-y-full" : "translate-y-0"
            }`}
        >
            {topbarEnabled && (
                <div
                    className="hidden md:flex h-9 px-3 items-center justify-center relative border-b border-[var(--color-border-subtle)]"
                    style={{ background: "var(--color-brand-band)", color: "#f7f0ea" }}
                >
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] tracking-wide font-light leading-normal truncate max-w-[60vw] text-center">
                        {resolvedTopbarText}
                    </p>
                    <div className="absolute right-4 flex items-center gap-2">
                        <ThemeToggle />
                        <HeaderLanguageToggle />
                    </div>
                </div>
            )}

            <div className="h-[64px] md:h-[82px] border-b border-[var(--color-border-subtle)]" style={{ background: "var(--color-elevated)" }}>
                <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-center md:justify-between gap-3 md:gap-4">
                    <Link
                        href="/"
                        className="text-[1.05rem] md:text-[1.34rem] leading-normal flex items-center shrink-0 h-full text-center"
                        style={{ fontFamily: "var(--font-cormorant), serif", color: "var(--color-text-primary)" }}
                    >
                        The Jewellery Bowl
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-[0.9rem] h-full">
                        <Link href="/" className="text-[var(--color-accent)] leading-none inline-flex items-center">{pickLocalizedText(translations.navHome, locale)}</Link>
                        <Link href="/products" className="text-[var(--color-text-primary)] leading-none inline-flex items-center">{pickLocalizedText(translations.navProducts, locale)}</Link>
                        {headerLinks.map((link) => (
                            <Link
                                key={`${link.href}-${link.label}`}
                                href={link.href}
                                className="text-[var(--color-text-primary)] leading-none inline-flex items-center"
                            >
                                {getHeaderLinkLabel(link, translations, locale)}
                            </Link>
                        ))}
                    </nav>

                    <div
                        className="hidden md:flex items-center gap-2 rounded-full bg-[var(--color-brand-band)] text-white px-4 py-2 header-icon-pill"
                    >
                        <button
                            type="button"
                            onClick={open}
                            className="p-1 header-pill-icon-link hover:text-[var(--color-accent)] md:hover:text-[#d9c8ba] transition-colors"
                            aria-label="Open search"
                        >
                            <Search className="h-[19px] w-[19px] md:h-[22px] md:w-[22px]" strokeWidth={1.7} />
                        </button>
                        <Link href="/account/wishlist" className="p-1 header-pill-icon-link hover:text-[var(--color-accent)] md:hover:text-[#d9c8ba] transition-colors"><Heart className="h-[19px] w-[19px] md:h-[22px] md:w-[22px]" strokeWidth={1.7} /></Link>
                        <NotificationBell href="/account/notifications" compact={true} />
                        <Link href="/cart" className="p-1 header-pill-icon-link hover:text-[var(--color-accent)] md:hover:text-[#d9c8ba] transition-colors"><ShoppingBag className="h-[19px] w-[19px] md:h-[22px] md:w-[22px]" strokeWidth={1.7} /></Link>
                        <Link href="/account" className="p-1 header-pill-icon-link hover:text-[var(--color-accent)] md:hover:text-[#d9c8ba] transition-colors"><User className="h-[19px] w-[19px] md:h-[22px] md:w-[22px]" strokeWidth={1.7} /></Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

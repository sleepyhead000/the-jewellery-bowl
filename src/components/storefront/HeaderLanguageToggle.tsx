"use client";

import { useStorefrontLanguage } from "@/components/storefront/StorefrontLanguageProvider";

export default function HeaderLanguageToggle() {
    const { locale, setLocale } = useStorefrontLanguage();

    return (
        <div className="flex items-center text-xs leading-none">
            <button
                type="button"
                className={`transition-colors ${
                    locale === "en"
                        ? "text-[var(--color-accent)] underline underline-offset-3 decoration-[1px]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
                onClick={() => setLocale("en")}
            >
                EN
            </button>
            <span className="mx-1 text-[var(--color-text-muted)]">|</span>
            <button
                type="button"
                className={`transition-colors ${
                    locale === "bn"
                        ? "text-[var(--color-accent)] underline underline-offset-3 decoration-[1px]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
                onClick={() => setLocale("bn")}
            >
                বাং
            </button>
        </div>
    );
}

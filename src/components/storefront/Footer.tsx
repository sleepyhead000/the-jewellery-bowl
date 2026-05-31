"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { defaultFooterSettings, type FooterSettingsConfig } from "@/lib/footer-config";

const B = {
    bg: "var(--color-surface)",
    surface: "var(--color-surface)",
    brand: "var(--color-accent)",
    gold: "var(--color-accent)",
    text: "var(--color-text-primary)",
    muted: "var(--color-text-secondary)",
    border: "var(--color-border)",
};

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-b pb-6 md:border-0 md:pb-0" style={{ borderColor: B.border }}>
            <h5
                className="mb-4 text-xs font-bold uppercase tracking-[0.2em] font-display"
                style={{ color: B.text }}
            >
                {title}
            </h5>
            <div>
                {children}
            </div>
        </div>
    );
}

export default function Footer() {
    const [settings, setSettings] = useState<FooterSettingsConfig>(defaultFooterSettings);

    useEffect(() => {
        let active = true;
        fetch("/api/footer-settings")
            .then((res) => (res.ok ? res.json() : null))
            .then((data: FooterSettingsConfig | null) => {
                if (active && data) setSettings(data);
            })
            .catch(() => null);
        return () => {
            active = false;
        };
    }, []);

    const socialIconMap = { facebook: Facebook, instagram: Instagram, twitter: Twitter };
    const socialLinks = settings.socialLinks
        .filter((entry) => entry.enabled && entry.href.trim().length > 0)
        .map((entry) => ({ Icon: socialIconMap[entry.platform], href: entry.href, platform: entry.platform }));

    return (
        <footer
            className="w-full pt-16 pb-8"
            style={{ background: B.bg, borderTop: `1px solid ${B.border}` }}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-4 border-b pb-6 md:border-0 md:pb-0" style={{ borderColor: B.border }}>
                        <h4
                            className="text-2xl font-bold uppercase tracking-tight font-display"
                            style={{
                                fontFamily: "var(--font-cormorant), 'Palatino Linotype', serif",
                                color: B.text,
                            }}
                        >
                            {settings.brandName}
                        </h4>
                        <div className="w-10 h-px" style={{ background: B.gold, opacity: 0.5 }} />
                        <p className="text-sm leading-relaxed font-body" style={{ color: B.muted }}>
                            {settings.brandDescription}
                        </p>
                        <div className="flex gap-4 pt-2">
                            {socialLinks.map(({ Icon, href, platform }) => (
                                <Link
                                    key={platform}
                                    href={href}
                                    className="transition-colors duration-200 hover:text-[var(--color-accent)]"
                                    style={{ color: B.muted }}
                                >
                                    <Icon className="h-5 w-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Shop */}
                    <FooterAccordion title="Shop">
                        <ul className="space-y-2.5 text-sm font-body">
                            {settings.shopLinks.map((l) => (
                                <li key={l.label}>
                                    <Link
                                        href={l.href}
                                        className="transition-colors duration-200 hover:text-[var(--color-accent)]"
                                        style={{ color: B.muted }}
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </FooterAccordion>

                    {/* Support */}
                    <FooterAccordion title="Support">
                        <ul className="space-y-2.5 text-sm font-body">
                            {settings.supportLinks.map((l) => (
                                <li key={l.label}>
                                    <Link
                                        href={l.href}
                                        className="transition-colors duration-200 hover:text-[var(--color-accent)]"
                                        style={{ color: B.muted }}
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </FooterAccordion>
                </div>

                {/* Bottom bar */}
                <div
                    className="border-t pt-8 flex flex-col items-center gap-4 text-xs font-body"
                    style={{ borderColor: B.border, color: B.muted }}
                >
                    {/* Mobile social icons */}
                    <div className="flex gap-5 md:hidden">
                        {socialLinks.map(({ Icon, href, platform }) => (
                            <Link
                                key={platform}
                                href={href}
                                className="transition-colors duration-200 hover:text-[var(--color-accent)]"
                                style={{ color: B.muted }}
                            >
                                <Icon className="h-5 w-5" />
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} The Jewellery Bowl. All rights reserved.</p>
                        <div className="flex gap-5">
                            {settings.legalLinks.map((l) => (
                                <Link
                                    key={l.label}
                                    href={l.href}
                                    className="transition-colors duration-200 hover:text-[var(--color-accent)]"
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

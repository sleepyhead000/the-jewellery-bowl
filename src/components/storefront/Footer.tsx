"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, ChevronDown } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { useState, useTransition } from "react";

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
    const [open, setOpen] = useState(false);
    return (
        <div className="md:border-0 border-b" style={{ borderColor: B.border }}>
            <button
                onClick={() => setOpen(!open)}
                className="md:hidden flex w-full items-center justify-between py-4 text-xs font-bold uppercase tracking-[0.2em] font-display"
                style={{ color: B.text }}
            >
                {title}
                <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                    style={{ color: B.muted }}
                />
            </button>
            <h5
                className="hidden md:block text-xs font-bold uppercase tracking-[0.2em] font-display mb-4"
                style={{ color: B.text }}
            >
                {title}
            </h5>
            <div className={`${open ? "block" : "hidden"} md:block pb-4 md:pb-0`}>
                {children}
            </div>
        </div>
    );
}

export default function Footer() {
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await subscribeNewsletter(formData);
            if (result.success) {
                setMessage({ type: "success", text: result.success });
            } else if (result.error) {
                setMessage({ type: "error", text: result.error });
            }
        });
    };

    const socialLinks = [
        { Icon: Facebook,  href: "#" },
        { Icon: Instagram, href: "#" },
        { Icon: Twitter,   href: "#" },
    ];

    return (
        <footer
            className="w-full pt-16 pb-8"
            style={{ background: B.bg, borderTop: `1px solid ${B.border}` }}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-12 mb-16">

                    {/* Newsletter — first on mobile */}
                    <div
                        className="space-y-4 order-first md:order-last pb-6 md:pb-0 border-b md:border-0"
                        style={{ borderColor: B.border }}
                    >
                        <h5
                            className="text-xs font-bold uppercase tracking-[0.2em] font-display"
                            style={{ color: B.text }}
                        >
                            Get 10% Off
                        </h5>
                        <p className="text-sm font-body" style={{ color: B.muted }}>
                            Join our list and get 10% off your first order.
                        </p>
                        <form action={handleSubmit} className="space-y-2">
                            <div
                                className="flex"
                                style={{ border: `1px solid ${B.border}` }}
                            >
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="EMAIL ADDRESS"
                                    required
                                    className="flex-1 px-3 py-2.5 text-xs outline-none font-body bg-transparent placeholder:tracking-widest"
                                    style={{ color: B.text }}
                                />
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors duration-200 disabled:opacity-50"
                                    style={{ background: B.brand, color: B.text }}
                                >
                                    {isPending ? "..." : "Join"}
                                </button>
                            </div>
                            {message && (
                                <p
                                    className="text-xs font-body"
                                    style={{ color: message.type === "success" ? B.gold : B.brand }}
                                >
                                    {message.text}
                                </p>
                            )}
                        </form>
                    </div>

                    {/* Brand — desktop only */}
                    <div className="space-y-4 hidden md:block">
                        <h4
                            className="text-2xl font-bold uppercase tracking-tight font-display"
                            style={{
                                fontFamily: "var(--font-cormorant), 'Palatino Linotype', serif",
                                color: B.text,
                            }}
                        >
                            The Jewellery Bowl
                        </h4>
                        <div className="w-10 h-px" style={{ background: B.gold, opacity: 0.5 }} />
                        <p className="text-sm leading-relaxed font-body" style={{ color: B.muted }}>
                            Experience the art of elegance with our premium collection of
                            traditional Bengali accessories. Designed for those who carry
                            culture in every movement.
                        </p>
                        <div className="flex gap-4 pt-2">
                            {socialLinks.map(({ Icon, href }, i) => (
                                <Link
                                    key={i}
                                    href={href}
                                    className="transition-colors duration-200 hover:text-[#C9A84C]"
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
                            {[
                                { label: "All Products",  href: "/products" },
                                { label: "New Arrivals",  href: "/products?sort=newest" },
                                { label: "Featured",      href: "/products?featured=true" },
                                { label: "Sale",          href: "/products?sale=true" },
                            ].map((l) => (
                                <li key={l.label}>
                                    <Link
                                        href={l.href}
                                        className="transition-colors duration-200 hover:text-[#E8D9B0]"
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
                            {[
                                { label: "Contact Us",    href: "#" },
                                { label: "FAQs",          href: "#" },
                                { label: "Shipping Info", href: "#" },
                                { label: "Returns",       href: "#" },
                            ].map((l) => (
                                <li key={l.label}>
                                    <Link
                                        href={l.href}
                                        className="transition-colors duration-200 hover:text-[#E8D9B0]"
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
                        {socialLinks.map(({ Icon, href }, i) => (
                            <Link
                                key={i}
                                href={href}
                                className="transition-colors duration-200 hover:text-[#C9A84C]"
                                style={{ color: B.muted }}
                            >
                                <Icon className="h-5 w-5" />
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} The Jewellery Bowl. All rights reserved.</p>
                        <div className="flex gap-5">
                            {["Privacy Policy", "Terms of Service"].map((l) => (
                                <Link
                                    key={l}
                                    href="#"
                                    className="transition-colors duration-200 hover:text-[#E8D9B0]"
                                >
                                    {l}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, ChevronDown } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { useState, useTransition } from "react";

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 md:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="md:hidden flex w-full items-center justify-between py-4 text-sm font-bold uppercase tracking-wide font-display"
            >
                {title}
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <h5 className="hidden md:block text-sm font-bold uppercase tracking-wide font-display mb-4">{title}</h5>
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

    return (
        <footer className="w-full bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-12 mb-16">
                    {/* Newsletter — first on mobile */}
                    <div className="space-y-4 order-first md:order-last pb-6 md:pb-0 border-b border-gray-100 md:border-0">
                        <h5 className="text-sm font-bold uppercase tracking-wide font-display">Get 10% Off</h5>
                        <p className="text-sm text-gray-500 font-body">
                            Join our list and get 10% off your first order.
                        </p>
                        <form action={handleSubmit} className="space-y-2">
                            <div className="flex border border-gray-300 p-1">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="EMAIL ADDRESS"
                                    required
                                    className="flex-1 px-3 py-2 text-sm outline-none placeholder:text-gray-300 font-body"
                                />
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? "..." : "Join"}
                                </button>
                            </div>
                            {message && (
                                <p className={`text-xs font-body ${message.type === "success" ? "text-green-600" : "text-sale"}`}>
                                    {message.text}
                                </p>
                            )}
                        </form>
                    </div>

                    {/* Brand */}
                    <div className="space-y-4 hidden md:block">
                        <h4 className="text-2xl font-bold uppercase tracking-tight font-display">TN Luxury</h4>
                        <p className="text-sm text-gray-500 leading-relaxed font-body">
                            Experience the art of elegance with our premium collection of accessories.
                            Designed for those who appreciate the finer things in life.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Shop — accordion on mobile */}
                    <FooterAccordion title="Shop">
                        <ul className="space-y-2 text-sm text-gray-500 font-body">
                            <li><Link href="/products" className="hover:text-black transition-colors">All Products</Link></li>
                            <li><Link href="/products?sort=newest" className="hover:text-black transition-colors">New Arrivals</Link></li>
                            <li><Link href="/products?featured=true" className="hover:text-black transition-colors">Featured</Link></li>
                            <li><Link href="/products?sale=true" className="hover:text-black transition-colors">Sale</Link></li>
                        </ul>
                    </FooterAccordion>

                    {/* Support — accordion on mobile */}
                    <FooterAccordion title="Support">
                        <ul className="space-y-2 text-sm text-gray-500 font-body">
                            <li><Link href="#" className="hover:text-black transition-colors">Contact Us</Link></li>
                            <li><Link href="#" className="hover:text-black transition-colors">FAQs</Link></li>
                            <li><Link href="#" className="hover:text-black transition-colors">Shipping Info</Link></li>
                            <li><Link href="#" className="hover:text-black transition-colors">Returns</Link></li>
                        </ul>
                    </FooterAccordion>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-100 pt-8 flex flex-col items-center gap-4 text-xs text-gray-400 font-body">
                    {/* Mobile social icons */}
                    <div className="flex gap-5 md:hidden">
                        <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                            <Facebook className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                            <Instagram className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} TN Luxury. All rights reserved.</p>
                        <div className="flex gap-4">
                            <Link href="#" className="hover:text-black">Privacy Policy</Link>
                            <Link href="#" className="hover:text-black">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

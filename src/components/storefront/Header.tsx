import Link from "next/link";
import { Search, ShoppingBag, Heart, User, Menu } from "lucide-react";
import { db } from "@/lib/db";

export default async function Header() {
    const now = new Date();
    const announcements = await db.announcement.findMany({
        where: {
            isActive: true,
            OR: [{ startAt: null }, { startAt: { lte: now } }],
            AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
        },
        orderBy: { sortOrder: "asc" },
        select: { id: true, text: true, link: true },
    });

    const navLinks = [
        { name: "Phone Case", href: "/categories/phone-case" },
        { name: "Eyeglasses", href: "/categories/eyeglasses" },
        { name: "Bag", href: "/categories/bag" },
        { name: "Accessories", href: "/categories/accessories" },
        { name: "Watch", href: "/categories/watch" },
        { name: "Jewellery", href: "/categories/jewellery" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-background border-b border-gray-100">
            {/* Announcement Bar */}
            {announcements.length > 0 && (
                <div className="w-full bg-white border-b border-gray-100 py-2 text-center text-[10px] md:text-xs uppercase tracking-wider font-medium text-foreground">
                    {announcements.map((a, i) => (
                        <span key={a.id}>
                            {i > 0 && <span className="mx-2">|</span>}
                            {a.link ? (
                                <Link href={a.link} className="hover:underline">
                                    {a.text}
                                </Link>
                            ) : (
                                a.text
                            )}
                        </span>
                    ))}
                </div>
            )}

            <div className="container mx-auto px-4 md:px-8">
                <div className="flex h-16 md:h-20 items-center justify-between">
                    {/* Mobile Menu Button */}
                    <button className="md:hidden hover:text-gray-600 transition-colors">
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Logo */}
                    <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tight uppercase">
                        TN Luxury
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium uppercase tracking-wide hover:text-gray-600 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions — desktop only for search/wishlist/cart, mobile has bottom nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/search" className="hover:text-gray-600 transition-colors">
                            <Search className="h-6 w-6" />
                        </Link>
                        <Link href="/account" className="hover:text-gray-600 transition-colors">
                            <User className="h-6 w-6" />
                        </Link>
                        <Link href="/account/wishlist" className="hover:text-gray-600 transition-colors">
                            <Heart className="h-6 w-6" />
                        </Link>
                        <Link href="/cart" className="hover:text-gray-600 transition-colors relative">
                            <ShoppingBag className="h-6 w-6" />
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-sale rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                0
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

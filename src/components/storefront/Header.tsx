import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
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

    const categories = await db.category.findMany({
        where: { parentId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true },
    });

    return (
        <header
            className="sticky top-0 z-50 w-full"
            style={{ background: "#0d0d0d", borderBottom: "1px solid rgba(201,168,76,0.2)" }}
        >
            {/* Announcement bar */}
            {announcements.length > 0 && (
                <div
                    className="w-full py-2 text-center text-[10px] md:text-xs uppercase tracking-widest font-medium border-b"
                    style={{
                        background: "#1a1010",
                        borderColor: "rgba(139,26,26,0.4)",
                        color: "#C9A84C",
                    }}
                >
                    {announcements.map((a, i) => (
                        <span key={a.id}>
                            {i > 0 && (
                                <span className="mx-3" style={{ color: "rgba(201,168,76,0.35)" }}>
                                    ✦
                                </span>
                            )}
                            {a.link ? (
                                <Link href={a.link} className="hover:underline underline-offset-2">
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
                <div className="relative flex h-16 md:h-20 items-center justify-center md:justify-between">
                    {/* Mobile centered logo */}
                    <Link
                        href="/"
                        className="md:hidden absolute left-1/2 -translate-x-1/2 uppercase leading-none whitespace-nowrap text-center"
                        style={{
                            fontFamily: "var(--font-cormorant), 'Palatino Linotype', serif",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: "#E8D9B0",
                            letterSpacing: "0.14em",
                        }}
                    >
                        The Jewellery Bowl
                    </Link>

                    {/* Desktop logo */}
                    <Link
                        href="/"
                        className="hidden md:block uppercase tracking-widest leading-none"
                        style={{
                            fontFamily: "var(--font-cormorant), 'Palatino Linotype', serif",
                            fontSize: "clamp(0.85rem, 2vw, 1.35rem)",
                            fontWeight: 600,
                            color: "#E8D9B0",
                            letterSpacing: "0.18em",
                        }}
                    >
                        The Jewellery Bowl
                    </Link>

                    {/* Desktop nav: categories only */}
                    <nav className="hidden md:flex items-center gap-8">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/categories/${category.slug}`}
                                className="text-xs uppercase tracking-widest font-medium transition-colors duration-200 relative group"
                                style={{ color: "#7a6e58" }}
                            >
                                <span className="group-hover:text-[#C9A84C] transition-colors duration-200">
                                    {category.name}
                                </span>
                                <span
                                    className="absolute -bottom-1 left-0 w-0 group-hover:w-full transition-all duration-300"
                                    style={{ height: "1px", background: "#C9A84C" }}
                                />
                            </Link>
                        ))}
                    </nav>
                    <div className="hidden md:flex items-center gap-5">
                        <Link
                            href="/search"
                            className="transition-colors duration-200 group"
                            style={{ color: "#7a6e58" }}
                        >
                            <Search
                                className="h-5 w-5 group-hover:text-[#C9A84C] transition-colors duration-200"
                                style={{ color: "inherit" }}
                            />
                        </Link>
                        <Link
                            href="/cart"
                            className="relative transition-colors duration-200 group"
                            style={{ color: "#7a6e58" }}
                        >
                            <ShoppingBag
                                className="h-5 w-5 group-hover:text-[#C9A84C] transition-colors duration-200"
                                style={{ color: "inherit" }}
                            />
                            <span
                                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{ background: "#8B1A1A", color: "#E8D9B0" }}
                            >
                                0
                            </span>
                        </Link>
                        <Link
                            href="/account"
                            className="transition-colors duration-200 group"
                            style={{ color: "#7a6e58" }}
                        >
                            <User
                                className="h-5 w-5 group-hover:text-[#C9A84C] transition-colors duration-200"
                                style={{ color: "inherit" }}
                            />
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

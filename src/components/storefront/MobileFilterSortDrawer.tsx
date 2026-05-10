"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CategoryOption {
    id: string;
    name: string;
    slug: string;
}

interface MobileFilterSortDrawerProps {
    categories: CategoryOption[];
}

export default function MobileFilterSortDrawer({ categories }: MobileFilterSortDrawerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);

    const currentCategory = searchParams.get("category") || "";
    const currentSort = searchParams.get("sort") || "newest";

    const [draftCategory, setDraftCategory] = useState(currentCategory);
    const [draftSort, setDraftSort] = useState(currentSort);

    const hasActiveFilters = useMemo(
        () => Boolean(currentCategory) || currentSort !== "newest",
        [currentCategory, currentSort]
    );

    const openDrawer = () => {
        setDraftCategory(currentCategory);
        setDraftSort(currentSort);
        setOpen(true);
    };

    const apply = () => {
        const next = new URLSearchParams(searchParams.toString());
        if (draftCategory) next.set("category", draftCategory);
        else next.delete("category");
        if (draftSort && draftSort !== "newest") next.set("sort", draftSort);
        else next.delete("sort");
        next.set("page", "1");
        setOpen(false);
        router.push(`${pathname}?${next.toString()}`);
    };

    const clearAll = () => {
        const next = new URLSearchParams(searchParams.toString());
        next.delete("category");
        next.delete("sort");
        next.set("page", "1");
        setDraftCategory("");
        setDraftSort("newest");
        setOpen(false);
        router.push(`${pathname}?${next.toString()}`);
    };

    return (
        <>
            <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
                <button
                    onClick={openDrawer}
                    className="bg-[#C9A84C] px-6 py-3 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform"
                    style={{ color: "#E8D9B0" }}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter & Sort
                    {hasActiveFilters && <span className="text-[10px]">•</span>}
                </button>
            </div>

            {open && (
                <div className="lg:hidden fixed inset-0 z-50 pointer-events-none">
                    <button
                        className="absolute inset-0 bg-black/50 pointer-events-auto"
                        onClick={() => setOpen(false)}
                        aria-label="Close filter drawer"
                    />
                    <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-4 h-[75vh] overflow-y-auto overscroll-contain pointer-events-auto"
                        style={{ WebkitOverflowScrolling: "touch", background: "#0d0d0d", color: "#E8D9B0" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#C9A84C" }}>
                                Filter & Sort
                            </h2>
                            <button onClick={() => setOpen(false)} className="p-2" style={{ color: "#7a6e58" }}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#7a6e58" }}>
                                    Categories
                                </p>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm" style={{ color: "#E8D9B0" }}>
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={draftCategory === ""}
                                            onChange={() => setDraftCategory("")}
                                            style={{ accentColor: "#C9A84C" }}
                                        />
                                        All
                                    </label>
                                    {categories.map((cat) => (
                                        <label key={cat.id} className="flex items-center gap-2 text-sm" style={{ color: "#E8D9B0" }}>
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={draftCategory === cat.slug}
                                                onChange={() => setDraftCategory(cat.slug)}
                                                style={{ accentColor: "#C9A84C" }}
                                            />
                                            {cat.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#7a6e58" }}>
                                    Sort By
                                </p>
                                <div className="space-y-2">
                                    {[
                                        { value: "newest", label: "Newest" },
                                        { value: "price-asc", label: "Price: Low to High" },
                                        { value: "price-desc", label: "Price: High to Low" },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-2 text-sm" style={{ color: "#E8D9B0" }}>
                                            <input
                                                type="radio"
                                                name="sort"
                                                checked={draftSort === option.value}
                                                onChange={() => setDraftSort(option.value)}
                                                style={{ accentColor: "#C9A84C" }}
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6 pb-2">
                            <button
                                onClick={clearAll}
                                className="px-4 py-3 border border-gray-300 text-sm font-medium"
                            >
                                Clear
                            </button>
                            <button
                                onClick={apply}
                                className="px-4 py-3 bg-black text-sm font-medium"
                                style={{ color: "#E8D9B0" }}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

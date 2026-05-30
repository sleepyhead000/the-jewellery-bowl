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
            <div className="lg:hidden fixed bottom-[5.25rem] left-1/2 -translate-x-1/2 z-40">
                <button
                    onClick={openDrawer}
                    className="bg-[var(--color-accent)] px-6 py-3 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform text-[var(--color-accent-contrast)]"
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
                        className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-4 h-[75svh] overflow-y-auto overscroll-contain pointer-events-auto pb-24"
                        style={{ WebkitOverflowScrolling: "touch", background: "var(--color-bg)", color: "var(--color-text-primary)" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-accent)]">
                                Filter & Sort
                            </h2>
                            <button onClick={() => setOpen(false)} className="p-2 text-[var(--color-text-muted)]">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[var(--color-text-muted)]">
                                    Categories
                                </p>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={draftCategory === ""}
                                            onChange={() => setDraftCategory("")}
                                            style={{ accentColor: "var(--color-accent)" }}
                                        />
                                        All
                                    </label>
                                    {categories.map((cat) => (
                                        <label key={cat.id} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={draftCategory === cat.slug}
                                                onChange={() => setDraftCategory(cat.slug)}
                                                style={{ accentColor: "var(--color-accent)" }}
                                            />
                                            {cat.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide mb-2 text-[var(--color-text-muted)]">
                                    Sort By
                                </p>
                                <div className="space-y-2">
                                    {[
                                        { value: "newest", label: "Newest" },
                                        { value: "price-asc", label: "Price: Low to High" },
                                        { value: "price-desc", label: "Price: High to Low" },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                                            <input
                                                type="radio"
                                                name="sort"
                                                checked={draftSort === option.value}
                                                onChange={() => setDraftSort(option.value)}
                                                style={{ accentColor: "var(--color-accent)" }}
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 grid grid-cols-2 gap-3 mt-6 bg-[var(--color-bg)] pt-3 pb-2">
                            <button
                                onClick={clearAll}
                                className="px-4 py-3 border border-[var(--color-border)] text-sm font-medium"
                            >
                                Clear
                            </button>
                            <button
                                onClick={apply}
                                className="px-4 py-3 bg-[var(--color-accent)] text-[var(--color-accent-contrast)] text-sm font-medium"
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

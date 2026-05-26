"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  canSearchQuery,
  normalizeSearchQuery,
  SEARCH_MAX_RESULTS,
  type SearchResponse,
  type SearchSuggestion,
} from "@/lib/search";

type SearchOverlayContextType = {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (value: string) => void;
};

const SearchOverlayContext = createContext<SearchOverlayContextType | null>(null);

export const useSearchOverlay = (): SearchOverlayContextType => {
  const ctx = useContext(SearchOverlayContext);
  if (!ctx) {
    throw new Error("useSearchOverlay must be used within SearchOverlayProvider");
  }
  return ctx;
};

type SearchOverlayProviderProps = {
  children: ReactNode;
};

export const SearchOverlayProvider = ({ children }: SearchOverlayProviderProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const open = useCallback((): void => {
    setIsOpen(true);
  }, []);

  const close = useCallback((): void => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const root = modalRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setResults([]);
      return;
    }
    if (!canSearchQuery(query)) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const normalized = normalizeSearchQuery(query);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as SearchResponse;
        setResults(payload.results.slice(0, SEARCH_MAX_RESULTS));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query]);

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const normalized = normalizeSearchQuery(query);
    if (!canSearchQuery(normalized)) return;
    close();
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  };

  const value = useMemo<SearchOverlayContextType>(() => {
    return { isOpen, query, open, close, setQuery };
  }, [close, isOpen, open, query]);

  return (
    <SearchOverlayContext.Provider value={value}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          style={{ background: "rgba(17, 14, 14, 0.45)", backdropFilter: "blur(4px)" }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-2xl rounded-2xl border p-4 md:p-5 shadow-2xl"
            style={{
              background: "var(--color-elevated)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 opacity-80" />
              <form className="flex-1" onSubmit={onSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-transparent text-[15px] outline-none"
                  aria-label="Search products"
                />
              </form>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-2 hover:bg-black/5"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--color-border-subtle)" }}>
              {!canSearchQuery(query) ? (
                <p className="text-sm opacity-70">Type at least 2 characters</p>
              ) : isLoading ? (
                <p className="text-sm opacity-70">Searching...</p>
              ) : results.length === 0 ? (
                <p className="text-sm opacity-70">No matching products</p>
              ) : (
                <ul className="space-y-2 max-h-[48vh] overflow-auto">
                  {results.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/products/${item.slug}`}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-black/5"
                        onClick={close}
                      >
                        <div
                          className="h-12 w-12 rounded-md bg-cover bg-center border"
                          style={{
                            backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : "none",
                            borderColor: "var(--color-border-subtle)",
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs opacity-70">
                            ৳{((item.salePrice ?? item.price) / 100).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </SearchOverlayContext.Provider>
  );
};

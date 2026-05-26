"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LocaleCode } from "@/lib/homepage-config";

type StorefrontLanguageContextValue = {
    locale: LocaleCode;
    setLocale: (locale: LocaleCode) => void;
};

const STORAGE_KEY = "tjb-storefront-locale";

const StorefrontLanguageContext = createContext<StorefrontLanguageContextValue | null>(null);

function readInitialLocale(): LocaleCode {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "bn" ? "bn" : "en";
}

export function StorefrontLanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<LocaleCode>(readInitialLocale);

    const setLocale = (value: LocaleCode) => {
        setLocaleState(value);
        window.localStorage.setItem(STORAGE_KEY, value);
    };

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, locale);
    }, [locale]);

    const contextValue = useMemo(() => ({ locale, setLocale }), [locale]);

    return (
        <StorefrontLanguageContext.Provider value={contextValue}>
            {children}
        </StorefrontLanguageContext.Provider>
    );
}

export function useStorefrontLanguage(): StorefrontLanguageContextValue {
    const contextValue = useContext(StorefrontLanguageContext);
    if (!contextValue) {
        throw new Error("useStorefrontLanguage must be used within StorefrontLanguageProvider");
    }
    return contextValue;
}

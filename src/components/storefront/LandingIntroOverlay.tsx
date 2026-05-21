"use client";

import { useEffect, useRef, useState } from "react";

type IntroConfig = {
    sessionStorageKey: string;
    baseDurationMs: number;
    weakNetworkDurationMs: number;
    reducedMotionDurationMs: number;
    lineDelayMs: number;
    exitFadeMs: number;
    minVisibleMs: number;
    allowSkip: boolean;
};

const introConfig: IntroConfig = {
    sessionStorageKey: "tjb-home-intro-seen",
    baseDurationMs: 1700,
    weakNetworkDurationMs: 780,
    reducedMotionDurationMs: 520,
    lineDelayMs: 280,
    exitFadeMs: 300,
    minVisibleMs: 280,
    allowSkip: true,
};

type LandingIntroOverlayProps = {
    onClosed: () => void;
    onStateChange: (isActive: boolean) => void;
};

type IntroPhase = "hidden" | "visible" | "closing";

type ConnectionWithHints = {
    effectiveType?: string;
    saveData?: boolean;
};

type NetworkCapabilities = {
    isWeakNetwork: boolean;
    saveDataEnabled: boolean;
};

function hasSeenIntro(sessionStorageKey: string): boolean {
    if (typeof window === "undefined") {
        return true;
    }

    try {
        return window.sessionStorage.getItem(sessionStorageKey) === "1";
    } catch (error) {
        console.warn("landing_intro_storage_read_failed", { key: sessionStorageKey, error });
        return true;
    }
}

function markIntroSeen(sessionStorageKey: string): void {
    try {
        window.sessionStorage.setItem(sessionStorageKey, "1");
    } catch (error) {
        console.warn("landing_intro_storage_write_failed", { key: sessionStorageKey, error });
    }
}

function getNetworkCapabilities(): NetworkCapabilities {
    if (typeof window === "undefined") {
        return { isWeakNetwork: false, saveDataEnabled: false };
    }

    const navigatorWithConnection = navigator as Navigator & {
        connection?: ConnectionWithHints;
        mozConnection?: ConnectionWithHints;
        webkitConnection?: ConnectionWithHints;
    };
    const connection =
        navigatorWithConnection.connection ??
        navigatorWithConnection.mozConnection ??
        navigatorWithConnection.webkitConnection;
    const effectiveType = typeof connection?.effectiveType === "string" ? connection.effectiveType : "";
    const saveDataEnabled = connection?.saveData === true;
    const isWeakType = effectiveType === "2g" || effectiveType === "slow-2g";

    return {
        isWeakNetwork: isWeakType || saveDataEnabled,
        saveDataEnabled,
    };
}

export default function LandingIntroOverlay({ onClosed, onStateChange }: LandingIntroOverlayProps) {
    const [phase, setPhase] = useState<IntroPhase>(() => {
        if (typeof window === "undefined") {
            return "hidden";
        }
        return hasSeenIntro(introConfig.sessionStorageKey) ? "hidden" : "visible";
    });
    const closeTimerRef = useRef<number | null>(null);
    const endTimerRef = useRef<number | null>(null);
    const [shouldReduceMotion] = useState<boolean>(() => {
        if (typeof window === "undefined") {
            return false;
        }
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });
    const [networkCapabilities] = useState<NetworkCapabilities>(getNetworkCapabilities);
    const visibleStartedAtRef = useRef<number | null>(null);
    const hasClosedRef = useRef<boolean>(false);

    const isOpen = phase !== "hidden";
    const isClosing = phase === "closing";

    useEffect(() => {
        onStateChange(isOpen);
    }, [isOpen, onStateChange]);

    useEffect(() => {
        if (phase !== "visible") {
            return;
        }

        visibleStartedAtRef.current = Date.now();
        const visibleDuration = shouldReduceMotion
            ? introConfig.reducedMotionDurationMs
            : networkCapabilities.isWeakNetwork
              ? introConfig.weakNetworkDurationMs
              : introConfig.baseDurationMs;

        closeTimerRef.current = window.setTimeout(() => {
            setPhase("closing");
        }, visibleDuration);
    }, [networkCapabilities.isWeakNetwork, phase, shouldReduceMotion]);

    useEffect(() => {
        if (phase !== "closing") {
            return;
        }
        if (hasClosedRef.current) {
            return;
        }
        hasClosedRef.current = true;

        markIntroSeen(introConfig.sessionStorageKey);
        const startedAt = visibleStartedAtRef.current ?? Date.now();
        const elapsed = Date.now() - startedAt;
        const minimumWait = Math.max(introConfig.minVisibleMs - elapsed, 0);
        const fadeDuration = shouldReduceMotion ? 180 : introConfig.exitFadeMs;
        const totalWait = minimumWait + fadeDuration;
        endTimerRef.current = window.setTimeout(() => {
            setPhase("hidden");
            onClosed();
        }, totalWait);
    }, [onClosed, phase, shouldReduceMotion]);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
            }
            if (endTimerRef.current !== null) {
                window.clearTimeout(endTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape" || !introConfig.allowSkip) {
                return;
            }

            setPhase("closing");
        };

        window.addEventListener("keydown", onEscape);
        return () => {
            window.removeEventListener("keydown", onEscape);
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const reduceMotionClass = shouldReduceMotion ? "intro-title-line-reduced" : "intro-title-line";

    return (
        <div
            className={`intro-overlay ${isClosing ? "intro-overlay-closing" : "intro-overlay-visible"}`}
            role="dialog"
            aria-modal="true"
            aria-label="The Jewellery Bowl introduction"
            onClick={() => {
                if (!introConfig.allowSkip) {
                    return;
                }
                if (phase === "closing") {
                    return;
                }
                setPhase("closing");
            }}
        >
            <div className="intro-overlay-backdrop" />
            <div className="intro-overlay-content">
                <h1 className="intro-title" aria-live="polite">
                    <span
                        className={reduceMotionClass}
                        style={{ animationDelay: shouldReduceMotion ? "0ms" : "0ms" }}
                    >
                        THE
                    </span>
                    <span
                        className={`${reduceMotionClass} intro-title-accent`}
                        style={{
                            animationDelay: shouldReduceMotion
                                ? "0ms"
                                : `${introConfig.lineDelayMs}ms`,
                        }}
                    >
                        JEWELLERY
                    </span>
                    <span
                        className={reduceMotionClass}
                        style={{
                            animationDelay: shouldReduceMotion
                                ? "0ms"
                                : `${introConfig.lineDelayMs * 2}ms`,
                        }}
                    >
                        BOWL
                    </span>
                </h1>
                {introConfig.allowSkip && (
                    <p className="intro-skip-hint">Tap or click anywhere to skip</p>
                )}
            </div>
        </div>
    );
}

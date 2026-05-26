"use client";

import { useEffect, useState } from "react";
import LandingIntroOverlay from "@/components/storefront/LandingIntroOverlay";

type HomeIntroShellProps = {
    children: React.ReactNode;
};

const INTRO_SESSION_KEY = "tjb-home-intro-seen";

function readContentVisibilityFromSession(): boolean {
    try {
        return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
    } catch (error) {
        console.warn("home_intro_storage_read_failed", { key: INTRO_SESSION_KEY, error });
        return true;
    }
}

export default function HomeIntroShell({ children }: HomeIntroShellProps) {
    const [isContentVisible, setIsContentVisible] = useState<boolean>(false);
    const [isIntroActive, setIsIntroActive] = useState<boolean>(true);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const isSeen = readContentVisibilityFromSession();
            if (isSeen) {
                setIsContentVisible(true);
                setIsIntroActive(false);
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <>
            {!isContentVisible && (
                <LandingIntroOverlay
                    onClosed={() => {
                        setIsIntroActive(false);
                        setIsContentVisible(true);
                    }}
                    onStateChange={(isActive) => {
                        setIsIntroActive(isActive);
                    }}
                />
            )}
            <div className={isIntroActive ? "home-intro-gate-active" : "home-intro-gate-idle"}>
                {children}
            </div>
        </>
    );
}

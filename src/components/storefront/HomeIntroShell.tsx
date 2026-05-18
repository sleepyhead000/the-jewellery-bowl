"use client";

import { useState } from "react";
import LandingIntroOverlay from "@/components/storefront/LandingIntroOverlay";

type HomeIntroShellProps = {
    children: React.ReactNode;
};

const INTRO_SESSION_KEY = "tjb-home-intro-seen";

function getInitialContentVisibility(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
}

export default function HomeIntroShell({ children }: HomeIntroShellProps) {
    const [isContentVisible, setIsContentVisible] = useState<boolean>(getInitialContentVisibility);
    const [isIntroActive, setIsIntroActive] = useState<boolean>(() => !getInitialContentVisibility());

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

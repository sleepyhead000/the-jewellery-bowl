import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
    defaultHomepageTopbarMode,
    defaultHomepageTranslations,
    normalizeHomepageTopbarMode,
    normalizeHomepageTranslations,
} from "@/lib/homepage-config";
import { defaultFooterSettings, normalizeFooterSettings } from "@/lib/footer-config";
import HeaderBody from "@/components/storefront/HeaderBody";

const isMissingTableError = (error: unknown): boolean => {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2021"
    );
};

export default async function Header() {
    const now = new Date();
    const [translationsResult, topbarResult, footerResult, announcementsResult] = await Promise.allSettled([
        db.setting.findUnique({ where: { key: "homepage_translations" } }),
        db.setting.findUnique({ where: { key: "homepage_topbar_mode" } }),
        db.setting.findUnique({ where: { key: "footer_settings_v1" } }),
        db.announcement.findMany({
            where: {
                isActive: true,
                OR: [{ startAt: null }, { startAt: { lte: now } }],
                AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            select: { text: true },
        }),
    ]);

    if (translationsResult.status === "rejected" && !isMissingTableError(translationsResult.reason)) {
        throw translationsResult.reason;
    }
    if (topbarResult.status === "rejected" && !isMissingTableError(topbarResult.reason)) {
        throw topbarResult.reason;
    }
    if (footerResult.status === "rejected" && !isMissingTableError(footerResult.reason)) {
        throw footerResult.reason;
    }
    if (announcementsResult.status === "rejected" && !isMissingTableError(announcementsResult.reason)) {
        throw announcementsResult.reason;
    }

    const translationsSetting = translationsResult.status === "fulfilled" ? translationsResult.value : null;
    const topbarSetting = topbarResult.status === "fulfilled" ? topbarResult.value : null;
    const footerSetting = footerResult.status === "fulfilled" ? footerResult.value : null;
    const announcements = announcementsResult.status === "fulfilled" ? announcementsResult.value : [];

    const t = normalizeHomepageTranslations(translationsSetting?.value ?? defaultHomepageTranslations);
    const topbar = normalizeHomepageTopbarMode(topbarSetting?.value ?? defaultHomepageTopbarMode);
    const footer = normalizeFooterSettings(footerSetting?.value ?? defaultFooterSettings);

    const announcementsText =
        topbar.mode === "announcements"
            ? announcements.map((entry) => entry.text.trim()).filter(Boolean).join(" | ")
            : "";

    return (
        <HeaderBody
            translations={t}
            topbarAnnouncementText={announcementsText}
            topbarStaticText={topbar.staticText}
            topbarMode={topbar.mode}
            topbarEnabled={topbar.enabled}
            headerLinks={footer.headerLinks}
        />
    );
}


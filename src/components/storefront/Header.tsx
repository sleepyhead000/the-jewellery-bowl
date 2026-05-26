import { db } from "@/lib/db";
import {
    defaultHomepageTopbarMode,
    defaultHomepageTranslations,
    normalizeHomepageTopbarMode,
    normalizeHomepageTranslations,
} from "@/lib/homepage-config";
import HeaderBody from "@/components/storefront/HeaderBody";

export default async function Header() {
    const now = new Date();
    const [translationsSetting, topbarSetting, announcements] = await Promise.all([
        db.setting.findUnique({ where: { key: "homepage_translations" } }),
        db.setting.findUnique({ where: { key: "homepage_topbar_mode" } }),
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

    const t = normalizeHomepageTranslations(translationsSetting?.value ?? defaultHomepageTranslations);
    const topbar = normalizeHomepageTopbarMode(topbarSetting?.value ?? defaultHomepageTopbarMode);

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
        />
    );
}


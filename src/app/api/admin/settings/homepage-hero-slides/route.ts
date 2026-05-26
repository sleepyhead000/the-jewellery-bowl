import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";
import { defaultHomepageHeroSlides, normalizeHomepageHeroSlidesConfig } from "@/lib/homepage-config";

const KEY = "homepage_hero_slides";

export async function GET(req: NextRequest) {
    const { context, error } = await runSecurityChecks(req, {
        authMode: "staff",
        permission: "settings.manage",
        requireSameOriginForMutations: true,
        rateLimitKey: (_req, userId) => `admin:settings:homepage-hero-slides:get:${userId ?? "anon"}`,
        rateLimitMax: 60,
        rateLimitWindowSeconds: 300,
    });
    if (error) return error;

    const setting = await db.setting.findUnique({ where: { key: KEY } });
    const normalized = normalizeHomepageHeroSlidesConfig(setting?.value ?? defaultHomepageHeroSlides);
    return withRequestId(context.requestId, normalized);
}

export async function PATCH(req: NextRequest) {
    const { context, error } = await runSecurityChecks(req, {
        authMode: "staff",
        permission: "settings.manage",
        requireJsonBody: true,
        requireSameOriginForMutations: true,
        rateLimitKey: (_req, userId) => `admin:settings:homepage-hero-slides:patch:${userId ?? "anon"}`,
        rateLimitMax: 20,
        rateLimitWindowSeconds: 300,
    });
    if (error) return error;

    const body = await req.json();
    const normalized = normalizeHomepageHeroSlidesConfig(body);

    if (normalized.slides.length === 0) {
        return validationError(context.requestId, "homepage_hero_slides must contain at least one slide");
    }

    await db.setting.upsert({
        where: { key: KEY },
        update: { value: normalized },
        create: { key: KEY, value: normalized },
    });

    return withRequestId(context.requestId, normalized);
}

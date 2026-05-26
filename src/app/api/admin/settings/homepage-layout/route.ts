import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";
import { defaultHomepageLayoutConfig, normalizeHomepageLayoutConfig } from "@/lib/homepage-config";

const KEY = "homepage_layout_v1";

export async function GET(req: NextRequest) {
    const { context, error } = await runSecurityChecks(req, {
        authMode: "staff",
        permission: "settings.manage",
        requireSameOriginForMutations: true,
        rateLimitKey: (_req, userId) => `admin:settings:homepage-layout:get:${userId ?? "anon"}`,
        rateLimitMax: 60,
        rateLimitWindowSeconds: 300,
    });
    if (error) return error;

    const setting = await db.setting.findUnique({ where: { key: KEY } });
    const normalized = normalizeHomepageLayoutConfig(setting?.value ?? defaultHomepageLayoutConfig);
    return withRequestId(context.requestId, normalized);
}

export async function PATCH(req: NextRequest) {
    const { context, error } = await runSecurityChecks(req, {
        authMode: "staff",
        permission: "settings.manage",
        requireJsonBody: true,
        requireSameOriginForMutations: true,
        rateLimitKey: (_req, userId) => `admin:settings:homepage-layout:patch:${userId ?? "anon"}`,
        rateLimitMax: 20,
        rateLimitWindowSeconds: 300,
    });
    if (error) return error;

    const body = await req.json();
    const normalized = normalizeHomepageLayoutConfig(body);

    if (normalized.sections.length === 0) {
        return validationError(context.requestId, "homepage_layout_v1 must contain sections");
    }

    await db.setting.upsert({
        where: { key: KEY },
        update: { value: normalized },
        create: { key: KEY, value: normalized },
    });

    return withRequestId(context.requestId, normalized);
}

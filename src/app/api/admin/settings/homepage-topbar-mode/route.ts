import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";
import {
    defaultHomepageTopbarMode,
    normalizeHomepageTopbarMode,
} from "@/lib/homepage-config";

const KEY = "homepage_topbar_mode";

export async function GET(req: NextRequest) {
    const { context, error } = await runSecurityChecks(req, {
        authMode: "staff",
        permission: "settings.manage",
        requireSameOriginForMutations: true,
        rateLimitKey: (_req, userId) => `admin:settings:homepage-topbar-mode:get:${userId ?? "anon"}`,
        rateLimitMax: 60,
        rateLimitWindowSeconds: 300,
    });
    if (error) return error;

    const setting = await db.setting.findUnique({ where: { key: KEY } });
    const normalized = normalizeHomepageTopbarMode(setting?.value ?? defaultHomepageTopbarMode);
    return withRequestId(context.requestId, normalized);
}

export async function PATCH(req: NextRequest) {
    const { context, error } = await runSecurityChecks(req, {
        authMode: "staff",
        permission: "settings.manage",
        requireJsonBody: true,
        requireSameOriginForMutations: true,
        rateLimitKey: (_req, userId) => `admin:settings:homepage-topbar-mode:patch:${userId ?? "anon"}`,
        rateLimitMax: 20,
        rateLimitWindowSeconds: 300,
    });
    if (error) return error;

    const body = await req.json();
    const normalized = normalizeHomepageTopbarMode(body);

    await db.setting.upsert({
        where: { key: KEY },
        update: { value: normalized },
        create: { key: KEY, value: normalized },
    });

    return withRequestId(context.requestId, normalized);
}

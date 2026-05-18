import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

const HERO_SETTING_KEY = "hero_content";

const defaultHeroSettings = {
  label: "The Art of Traditional Elegance",
  titleLine1: "The",
  titleAccent: "Jewellery",
  titleLine2: "Bowl",
  subtitle:
    "Handcrafted churis, necklaces & traditional Bengali accessories for those who carry culture in every movement.",
  primaryCtaText: "Shop Collection",
  primaryCtaHref: "/products",
  secondaryCtaText: "View Jewellery",
  secondaryCtaHref: "/categories/jewellery",
  trustItems: ["Premium Quality", "Free Shipping over BDT 5,000", "Authentic Craftsmanship"],
};

function normalizeHeroSettings(input: unknown) {
  const obj = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
  const trustItemsRaw = Array.isArray(obj.trustItems) ? obj.trustItems : [];
  const trustItems = trustItemsRaw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);

  return {
    label: typeof obj.label === "string" ? obj.label.trim() : defaultHeroSettings.label,
    titleLine1:
      typeof obj.titleLine1 === "string" ? obj.titleLine1.trim() : defaultHeroSettings.titleLine1,
    titleAccent:
      typeof obj.titleAccent === "string" ? obj.titleAccent.trim() : defaultHeroSettings.titleAccent,
    titleLine2:
      typeof obj.titleLine2 === "string" ? obj.titleLine2.trim() : defaultHeroSettings.titleLine2,
    subtitle:
      typeof obj.subtitle === "string" ? obj.subtitle.trim() : defaultHeroSettings.subtitle,
    primaryCtaText:
      typeof obj.primaryCtaText === "string"
        ? obj.primaryCtaText.trim()
        : defaultHeroSettings.primaryCtaText,
    primaryCtaHref:
      typeof obj.primaryCtaHref === "string" ? obj.primaryCtaHref.trim() : defaultHeroSettings.primaryCtaHref,
    secondaryCtaText:
      typeof obj.secondaryCtaText === "string"
        ? obj.secondaryCtaText.trim()
        : defaultHeroSettings.secondaryCtaText,
    secondaryCtaHref:
      typeof obj.secondaryCtaHref === "string"
        ? obj.secondaryCtaHref.trim()
        : defaultHeroSettings.secondaryCtaHref,
    trustItems: trustItems.length === 3 ? trustItems : defaultHeroSettings.trustItems,
  };
}

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:hero:get:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const record = await db.setting.findUnique({ where: { key: HERO_SETTING_KEY } });
  const value = record?.value ?? defaultHeroSettings;
  return withRequestId(context.requestId, normalizeHeroSettings(value));
}

export async function PATCH(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:hero:patch:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const body = await req.json();
  const settings = normalizeHeroSettings(body);

  if (
    !settings.label ||
    !settings.titleLine1 ||
    !settings.titleAccent ||
    !settings.titleLine2 ||
    !settings.subtitle ||
    !settings.primaryCtaText ||
    !settings.primaryCtaHref ||
    !settings.secondaryCtaText ||
    !settings.secondaryCtaHref ||
    settings.trustItems.length !== 3
  ) {
    return validationError(context.requestId, "Invalid payload");
  }

  await db.setting.upsert({
    where: { key: HERO_SETTING_KEY },
    update: { value: settings },
    create: { key: HERO_SETTING_KEY, value: settings },
  });

  return withRequestId(context.requestId, settings);
}

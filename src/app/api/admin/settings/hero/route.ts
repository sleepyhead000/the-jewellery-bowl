import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

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

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await db.setting.findUnique({ where: { key: HERO_SETTING_KEY } });
  const value = record?.value ?? defaultHeroSettings;
  return NextResponse.json(normalizeHeroSettings(value));
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await db.setting.upsert({
    where: { key: HERO_SETTING_KEY },
    update: { value: settings },
    create: { key: HERO_SETTING_KEY, value: settings },
  });

  return NextResponse.json(settings);
}

export type FooterLinkConfig = {
  label: string;
  href: string;
};

export type FooterSocialConfig = {
  platform: "facebook" | "instagram" | "twitter";
  href: string;
  enabled: boolean;
};

export type FooterSettingsConfig = {
  brandName: string;
  brandDescription: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonLabel: string;
  shopLinks: FooterLinkConfig[];
  supportLinks: FooterLinkConfig[];
  legalLinks: FooterLinkConfig[];
  socialLinks: FooterSocialConfig[];
};

export const defaultFooterSettings: FooterSettingsConfig = {
  brandName: "The Jewellery Bowl",
  brandDescription:
    "Experience the art of elegance with our premium collection of traditional Bengali accessories. Designed for those who carry culture in every movement.",
  newsletterTitle: "Get 10% Off",
  newsletterDescription: "Join our list and get 10% off your first order.",
  newsletterButtonLabel: "Join",
  shopLinks: [
    { label: "All Products", href: "/products" },
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Featured", href: "/products?featured=true" },
    { label: "Sale", href: "/products?sale=true" },
  ],
  supportLinks: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "#" },
    { label: "Shipping Info", href: "/how-to-buy" },
    { label: "Returns", href: "#" },
  ],
  legalLinks: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  socialLinks: [
    { platform: "facebook", href: "#", enabled: true },
    { platform: "instagram", href: "#", enabled: true },
    { platform: "twitter", href: "#", enabled: true },
  ],
};

const normalizeLink = (value: unknown, fallback: FooterLinkConfig): FooterLinkConfig => {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    label: typeof record.label === "string" && record.label.trim() ? record.label.trim() : fallback.label,
    href: typeof record.href === "string" && record.href.trim() ? record.href.trim() : fallback.href,
  };
};

const normalizeLinks = (value: unknown, fallback: FooterLinkConfig[]): FooterLinkConfig[] => {
  if (!Array.isArray(value)) return fallback;
  const normalized = value.map((entry, index) => normalizeLink(entry, fallback[index] ?? { label: "Link", href: "#" }));
  return normalized.length > 0 ? normalized.slice(0, 8) : fallback;
};

const normalizeSocial = (value: unknown, fallback: FooterSocialConfig): FooterSocialConfig => {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    platform: fallback.platform,
    href: typeof record.href === "string" && record.href.trim() ? record.href.trim() : fallback.href,
    enabled: typeof record.enabled === "boolean" ? record.enabled : fallback.enabled,
  };
};

export const normalizeFooterSettings = (input: unknown): FooterSettingsConfig => {
  if (!input || typeof input !== "object") return defaultFooterSettings;
  const record = input as Record<string, unknown>;
  const defaultSocialByPlatform = new Map(defaultFooterSettings.socialLinks.map((entry) => [entry.platform, entry]));
  const incomingSocial = Array.isArray(record.socialLinks) ? record.socialLinks : [];

  return {
    brandName:
      typeof record.brandName === "string" && record.brandName.trim()
        ? record.brandName.trim()
        : defaultFooterSettings.brandName,
    brandDescription:
      typeof record.brandDescription === "string" && record.brandDescription.trim()
        ? record.brandDescription.trim()
        : defaultFooterSettings.brandDescription,
    newsletterTitle:
      typeof record.newsletterTitle === "string" && record.newsletterTitle.trim()
        ? record.newsletterTitle.trim()
        : defaultFooterSettings.newsletterTitle,
    newsletterDescription:
      typeof record.newsletterDescription === "string" && record.newsletterDescription.trim()
        ? record.newsletterDescription.trim()
        : defaultFooterSettings.newsletterDescription,
    newsletterButtonLabel:
      typeof record.newsletterButtonLabel === "string" && record.newsletterButtonLabel.trim()
        ? record.newsletterButtonLabel.trim()
        : defaultFooterSettings.newsletterButtonLabel,
    shopLinks: normalizeLinks(record.shopLinks, defaultFooterSettings.shopLinks),
    supportLinks: normalizeLinks(record.supportLinks, defaultFooterSettings.supportLinks),
    legalLinks: normalizeLinks(record.legalLinks, defaultFooterSettings.legalLinks),
    socialLinks: defaultFooterSettings.socialLinks.map((fallback) => {
      const match = incomingSocial.find((entry) => {
        if (!entry || typeof entry !== "object") return false;
        return (entry as Record<string, unknown>).platform === fallback.platform;
      });
      return normalizeSocial(match, defaultSocialByPlatform.get(fallback.platform) ?? fallback);
    }),
  };
};

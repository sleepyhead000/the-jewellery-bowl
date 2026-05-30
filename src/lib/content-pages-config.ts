export type ContentPageKey = "about" | "contact" | "howToBuy" | "faqs" | "returns" | "privacyPolicy" | "termsOfService";

export type ContentPageConfig = {
  title: string;
  body: string;
  listItems: string[];
};

export type ContentPagesConfig = Record<ContentPageKey, ContentPageConfig>;

export const contentPagesSettingKey = "content_pages_v1";

export const defaultContentPages: ContentPagesConfig = {
  about: {
    title: "About Us",
    body: [
      "The Jewellery Bowl curates premium jewelry with a focus on craftsmanship, trusted sourcing, and transparent customer service.",
      "We prioritize quality control, secure checkout, and responsive support so every purchase feels dependable from discovery to delivery.",
    ].join("\n\n"),
    listItems: [],
  },
  contact: {
    title: "Contact",
    body: [
      "For orders, product questions, or support requests, contact our team through the channels listed in your account and checkout communications.",
      "We aim to respond quickly with clear next steps for delivery, payment verification, and after-sales support.",
    ].join("\n\n"),
    listItems: [],
  },
  howToBuy: {
    title: "How To Buy",
    body: "",
    listItems: [
      "Select your preferred product and variant.",
      "Add the item to cart and review quantity and pricing.",
      "Proceed to checkout, choose payment method, and submit order details.",
      "For digital payments, provide transaction details for verification.",
      "Track updates from your account order history and notifications.",
    ],
  },
  faqs: {
    title: "FAQs",
    body: "",
    listItems: [
      "How long does delivery take? Delivery timing depends on your address and selected shipping zone.",
      "How do I confirm digital payment? Submit the transaction details during checkout so the team can verify the payment.",
      "Can I change an order after placing it? Contact support as soon as possible before the order is processed.",
      "Where can I track orders? Sign in to your account and open order history for the latest status.",
    ],
  },
  returns: {
    title: "Returns",
    body: [
      "Return eligibility depends on the product condition, delivery status, and whether the item was customized or used.",
      "Contact support with your order number and product details before sending anything back. The team will confirm the next steps after reviewing the request.",
    ].join("\n\n"),
    listItems: [],
  },
  privacyPolicy: {
    title: "Privacy Policy",
    body: [
      "We collect the information needed to process orders, deliver purchases, verify payments, and support customer accounts.",
      "Customer information is used for storefront operations and support. We do not sell customer data. Payment verification details are handled only for order processing and fraud prevention.",
    ].join("\n\n"),
    listItems: [],
  },
  termsOfService: {
    title: "Terms of Service",
    body: [
      "By using this website, you agree to provide accurate order, account, delivery, and payment information.",
      "Prices, availability, promotions, and delivery timelines may change based on product stock and operational requirements. Confirmed orders remain subject to payment verification and fraud checks.",
    ].join("\n\n"),
    listItems: [],
  },
};

const normalizeText = (value: unknown, fallback: string): string => {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
};

const normalizeListItems = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return items.length > 0 ? items.slice(0, 12) : fallback;
};

const normalizePage = (value: unknown, fallback: ContentPageConfig): ContentPageConfig => {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    title: normalizeText(record.title, fallback.title),
    body: typeof record.body === "string" ? record.body.trim() : fallback.body,
    listItems: normalizeListItems(record.listItems, fallback.listItems),
  };
};

export const normalizeContentPages = (input: unknown): ContentPagesConfig => {
  if (!input || typeof input !== "object") return defaultContentPages;
  const record = input as Record<string, unknown>;
  return {
    about: normalizePage(record.about, defaultContentPages.about),
    contact: normalizePage(record.contact, defaultContentPages.contact),
    howToBuy: normalizePage(record.howToBuy, defaultContentPages.howToBuy),
    faqs: normalizePage(record.faqs, defaultContentPages.faqs),
    returns: normalizePage(record.returns, defaultContentPages.returns),
    privacyPolicy: normalizePage(record.privacyPolicy, defaultContentPages.privacyPolicy),
    termsOfService: normalizePage(record.termsOfService, defaultContentPages.termsOfService),
  };
};

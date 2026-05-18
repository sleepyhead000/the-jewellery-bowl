import type { EndpointPolicy } from "@/lib/api-security";

export const API_POLICIES: Record<string, EndpointPolicy> = {
  "GET /api/products": {
    authMode: "public",
    rateLimitKey: () => "products:get:public",
    rateLimitMax: 150,
    rateLimitWindowSeconds: 300,
  },
  "GET /api/categories": {
    authMode: "public",
    rateLimitKey: () => "categories:get:public",
    rateLimitMax: 150,
    rateLimitWindowSeconds: 300,
  },
  "GET /api/search": {
    authMode: "public",
    rateLimitKey: () => "search:get:public",
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  },
  "GET /api/announcements": {
    authMode: "public",
    rateLimitKey: () => "announcements:get:public",
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  },
  "GET /api/shipping-zones": {
    authMode: "public",
    rateLimitKey: () => "shipping-zones:get:public",
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  },
  "GET /api/payment-accounts": {
    authMode: "public",
    rateLimitKey: () => "payment-accounts:get:public",
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  },
  "POST /api/upload": {
    authMode: "authenticated",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `upload:${userId ?? "anon"}`,
    rateLimitMax: 30,
    rateLimitWindowSeconds: 300,
  },
  "GET /api/admin/dashboard": {
    authMode: "staff",
    permission: "orders.view",
    rateLimitKey: (_req, userId) => `admin:dashboard:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  },
};

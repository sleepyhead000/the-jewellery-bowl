import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

type Role = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN";

type AuthMode = "public" | "authenticated" | "staff";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED";

export interface ApiErrorPayload {
  code: ErrorCode;
  message: string;
  requestId: string;
  details?: unknown;
}

export interface EndpointPolicy {
  authMode: AuthMode;
  permission?: Permission;
  rateLimitKey?: (req: NextRequest, userId: string | null) => string;
  rateLimitMax?: number;
  rateLimitWindowSeconds?: number;
  requireJsonBody?: boolean;
  requireSameOriginForMutations?: boolean;
}

export interface ApiSecurityContext {
  requestId: string;
  role: Role | null;
  userId: string | null;
}

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const candidate = forwardedFor.split(",")[0]?.trim();
    if (candidate) return candidate;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return realIp.trim();
  return "unknown";
}

function buildErrorResponse(
  status: number,
  requestId: string,
  code: ErrorCode,
  message: string,
  details?: unknown
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    { code, message, requestId, details },
    { status, headers: { "x-request-id": requestId } }
  );
}

export function unauthorized(requestId: string): NextResponse<ApiErrorPayload> {
  return buildErrorResponse(401, requestId, "UNAUTHORIZED", "Authentication required");
}

export function forbidden(requestId: string): NextResponse<ApiErrorPayload> {
  return buildErrorResponse(403, requestId, "FORBIDDEN", "Insufficient permissions");
}

export function validationError(
  requestId: string,
  message: string,
  details?: unknown
): NextResponse<ApiErrorPayload> {
  return buildErrorResponse(400, requestId, "VALIDATION_ERROR", message, details);
}

function unsupportedMediaType(requestId: string): NextResponse<ApiErrorPayload> {
  return buildErrorResponse(
    415,
    requestId,
    "UNSUPPORTED_MEDIA_TYPE",
    "Expected application/json content type"
  );
}

function rateLimited(
  requestId: string,
  headers: HeadersInit
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    { code: "RATE_LIMITED", message: "Too many requests", requestId },
    { status: 429, headers: { ...headers, "x-request-id": requestId } }
  );
}

function getRequestId(req: NextRequest): string {
  const incoming = req.headers.get("x-request-id");
  return incoming && incoming.trim().length > 0 ? incoming.trim() : crypto.randomUUID();
}

function isMutationMethod(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

export function validateOriginForMutations(
  req: NextRequest,
  requestId: string
): NextResponse<ApiErrorPayload> | null {
  if (!isMutationMethod(req.method)) return null;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) {
    return forbidden(requestId);
  }

  const originHost = new URL(origin).host;
  if (originHost !== host) {
    return forbidden(requestId);
  }

  return null;
}

export async function enforceRateLimit(
  req: NextRequest,
  requestId: string,
  userId: string | null,
  policy: EndpointPolicy
): Promise<NextResponse<ApiErrorPayload> | null> {
  if (!policy.rateLimitKey || !policy.rateLimitMax || !policy.rateLimitWindowSeconds) {
    return null;
  }
  const key = policy.rateLimitKey(req, userId);
  const limiter = await rateLimit(key, policy.rateLimitMax, policy.rateLimitWindowSeconds);
  if (!limiter.allowed) {
    return rateLimited(requestId, rateLimitHeaders(limiter));
  }
  return null;
}

export async function runSecurityChecks(
  req: NextRequest,
  policy: EndpointPolicy
): Promise<{ context: ApiSecurityContext; error: NextResponse<ApiErrorPayload> | null }> {
  const requestId = getRequestId(req);
  const session = await auth();
  const role = (session?.user?.role ?? null) as Role | null;
  const userId = session?.user?.id ?? null;

  if (policy.requireSameOriginForMutations) {
    const originErr = validateOriginForMutations(req, requestId);
    if (originErr) return { context: { requestId, role, userId }, error: originErr };
  }

  if (policy.requireJsonBody && isMutationMethod(req.method)) {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return {
        context: { requestId, role, userId },
        error: unsupportedMediaType(requestId),
      };
    }
  }

  if (policy.authMode === "authenticated" && !userId) {
    return { context: { requestId, role, userId }, error: unauthorized(requestId) };
  }

  if (policy.authMode === "staff") {
    if (!role || !["STAFF", "MANAGER", "ADMIN"].includes(role)) {
      return { context: { requestId, role, userId }, error: forbidden(requestId) };
    }
  }

  if (policy.permission) {
    if (!role || !hasPermission(role, policy.permission)) {
      return { context: { requestId, role, userId }, error: forbidden(requestId) };
    }
  }

  const rateLimitErr = await enforceRateLimit(req, requestId, userId, policy);
  if (rateLimitErr) return { context: { requestId, role, userId }, error: rateLimitErr };

  return { context: { requestId, role, userId }, error: null };
}

export function withRequestId<T>(requestId: string, body: T, init?: ResponseInit): NextResponse<T> {
  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);
  return NextResponse.json(body, { ...init, headers });
}

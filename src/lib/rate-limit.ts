import { redis } from "@/lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = Math.floor(now / (windowSec * 1000));
  const scopedKey = `rl:${key}:${bucket}`;

  try {
    const total = await redis.incr(scopedKey);
    if (total === 1) {
      await redis.expire(scopedKey, windowSec + 1);
    }

    const ttl = await redis.ttl(scopedKey);
    const retryAfterSec = Math.max(ttl, 1);
    const resetAt = now + retryAfterSec * 1000;
    const remaining = Math.max(limit - total, 0);

    return {
      allowed: total <= limit,
      remaining,
      resetAt,
      retryAfterSec,
    };
  } catch {
    // Graceful local fallback when Redis is unavailable.
    const expiresAt = (bucket + 1) * windowSec * 1000;
    const existing = memoryBuckets.get(scopedKey);
    const count = existing && existing.expiresAt > now ? existing.count + 1 : 1;
    memoryBuckets.set(scopedKey, { count, expiresAt });

    const retryAfterSec = Math.max(Math.ceil((expiresAt - now) / 1000), 1);
    const resetAt = now + retryAfterSec * 1000;
    const remaining = Math.max(limit - count, 0);

    return {
      allowed: count <= limit,
      remaining,
      resetAt,
      retryAfterSec,
    };
  }
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
    "Retry-After": String(result.retryAfterSec),
  };
}

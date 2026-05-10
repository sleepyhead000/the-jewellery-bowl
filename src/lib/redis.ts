import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  redisWarned: boolean | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

// Prevent noisy unhandled ioredis error events when Redis is unavailable.
redis.on("error", (err) => {
  if (!globalForRedis.redisWarned) {
    console.warn("[redis] unavailable, falling back where possible:", err.message);
    globalForRedis.redisWarned = true;
  }
});

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

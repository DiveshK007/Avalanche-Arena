import Redis from "ioredis";
import { getEnv } from "../env";

/**
 * Redis Cache Service
 *
 * Caches leaderboard, quest lists, and global stats to reduce DB load.
 */

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const env = getEnv();
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.warn("Redis connection error (caching disabled):", err.message);
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redis.connect().catch(() => {
      console.warn("⚠️  Redis not available — caching disabled");
    });
  }
  return redis;
}

/**
 * Get cached data or execute query
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const r = getRedis();

  try {
    const cachedValue = await r.get(key);
    if (cachedValue) {
      return JSON.parse(cachedValue) as T;
    }
  } catch {
    // Redis unavailable — fall through to direct query
  }

  const data = await fetchFn();

  try {
    await r.setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // Redis unavailable — silently skip caching
  }

  return data;
}

/**
 * Invalidate a cached key
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const r = getRedis();
    const keys = await r.keys(pattern);
    if (keys.length > 0) {
      await r.del(...keys);
    }
  } catch {
    // Redis unavailable
  }
}

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  LEADERBOARD: "arena:leaderboard",
  GLOBAL_STATS: "arena:global_stats",
  QUESTS_ACTIVE: "arena:quests:active",
  QUEST_BY_ID: (id: number) => `arena:quest:${id}`,
  PLAYER: (addr: string) => `arena:player:${addr.toLowerCase()}`,
} as const;

/**
 * TTL values (in seconds)
 */
export const CACHE_TTL = {
  LEADERBOARD: 30,      // 30 seconds
  GLOBAL_STATS: 60,     // 1 minute
  QUESTS: 120,          // 2 minutes
  PLAYER: 15,           // 15 seconds
} as const;

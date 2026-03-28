import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Instantiate Redis with bounded retries and graceful degradation
export const redis = new Redis(redisUrl, {
  retryStrategy(times) {
    if (times > 3) {
      console.warn('[Redis] Connection failed. Running without cache.');
      return null; // Stop retrying
    }
    return Math.min(times * 100, 3000);
  },
  maxRetriesPerRequest: 1,
});

// Suppress unhandled error crashes
redis.on('error', () => {});

export const getCache = async (key: string): Promise<string | null> => {
  try {
    if (redis.status !== 'ready') return null;
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const setCache = async (key: string, value: string, ttlSeconds: number = 300) => {
  try {
    if (redis.status !== 'ready') return;
    await redis.setex(key, ttlSeconds, value);
  } catch {
    // ignore
  }
};

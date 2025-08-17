import Redis from "ioredis";
import { logger } from "./logger.js";

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: number;
}

export class CacheManager {
  private redis?: Redis;
  private localCache: Map<string, { value: any; expiry: number }> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, keys: 0, memory: 0 };

  constructor() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
      this.redis.on("error", (err) => {
        logger.warn("Redis connection failed, falling back to local cache", { err });
        this.redis?.disconnect();
        this.redis = undefined;
      });
    } catch (error) {
      logger.warn("Redis initialization failed, using local cache only", { error });
    }
  }

  async get<T>(key: any): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    
    try {
      // Try Redis first
      if (this.redis && this.redis.status === "ready") {
        const value = await this.redis.get(cacheKey);
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      }
    } catch (error) {
      logger.debug("Redis get failed, trying local cache", { error, cacheKey });
    }

    // Fallback to local cache
    const local = this.localCache.get(cacheKey);
    if (local && local.expiry > Date.now()) {
      this.stats.hits++;
      return local.value;
    }

    this.stats.misses++;
    return null;
  }

  async set(key: any, value: any, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(key);
    const { ttl = 3600000, tags = [] } = options; // Default 1 hour TTL
    
    try {
      // Try Redis first
      if (this.redis && this.redis.status === "ready") {
        await this.redis.setex(cacheKey, Math.floor(ttl / 1000), JSON.stringify(value));
        
        // Store tags for invalidation
        if (tags.length > 0) {
          await this.redis.sadd(`tags:${cacheKey}`, ...tags);
        }
      }
    } catch (error) {
      logger.debug("Redis set failed, using local cache", { error, cacheKey });
    }

    // Fallback to local cache
    this.localCache.set(cacheKey, {
      value,
      expiry: Date.now() + ttl,
    });

    this.stats.keys = this.localCache.size;
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      if (this.redis && this.redis.status === "ready") {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      logger.debug("Redis invalidation failed", { error, pattern });
    }

    // Invalidate local cache
    for (const [key] of this.localCache) {
      if (key.includes(pattern)) {
        this.localCache.delete(key);
      }
    }
    
    this.stats.keys = this.localCache.size;
  }

  async clear(): Promise<void> {
    try {
      if (this.redis && this.redis.status === "ready") {
        await this.redis.flushdb();
      }
    } catch (error) {
      logger.debug("Redis clear failed", { error });
    }

    this.localCache.clear();
    this.stats.keys = 0;
  }

  async getStats(): Promise<CacheStats> {
    try {
      if (this.redis && this.redis.status === "ready") {
        const info = await this.redis.info("memory");
        const memoryMatch = info.match(/used_memory_human:(\S+)/);
        this.stats.memory = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      }
    } catch (error) {
      logger.debug("Failed to get Redis memory info", { error });
    }

    return { ...this.stats };
  }

  private generateKey(key: any): string {
    if (typeof key === "string") {
      return `cache:${key}`;
    }
    return `cache:${JSON.stringify(key)}`;
  }
}

export const cacheManager = new CacheManager();

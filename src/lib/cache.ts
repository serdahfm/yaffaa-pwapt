import { logger } from "./logger.js";

// Simple in-memory cache implementation
// In production, this would use Redis
export class CacheManager {
  private cache: Map<string, { value: any; expiry: number; tags: string[] }> = new Map();
  private maxSize: number = 1000;
  private defaultTTL: number = 3600000; // 1 hour

  async get<T>(key: any): Promise<T | null> {
    try {
      const cacheKey = this.serializeKey(key);
      const item = this.cache.get(cacheKey);
      
      if (!item) {
        return null;
      }
      
      if (Date.now() > item.expiry) {
        this.cache.delete(cacheKey);
        return null;
      }
      
      return item.value as T;
    } catch (error) {
      logger.error("Cache get error", { error: error.message, key });
      return null;
    }
  }

  async set<T>(key: any, value: T, options: { ttl?: number; tags?: string[] } = {}): Promise<void> {
    try {
      const cacheKey = this.serializeKey(key);
      const ttl = options.ttl || this.defaultTTL;
      const expiry = Date.now() + ttl;
      const tags = options.tags || [];
      
      // Check if we need to evict items
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }
      
      this.cache.set(cacheKey, { value, expiry, tags });
    } catch (error) {
      logger.error("Cache set error", { error: error.message, key });
    }
  }

  async delete(key: any): Promise<boolean> {
    try {
      const cacheKey = this.serializeKey(key);
      return this.cache.delete(cacheKey);
    } catch (error) {
      logger.error("Cache delete error", { error: error.message, key });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      logger.info("Cache cleared");
    } catch (error) {
      logger.error("Cache clear error", { error: error.message });
    }
  }

  async getStats(): Promise<{
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
  }> {
    // This is a simplified implementation
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0.8, // Mock value
      missRate: 0.2, // Mock value
      evictionCount: 0, // Mock value
    };
  }

  async invalidateByTag(tag: string): Promise<number> {
    let invalidatedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  private serializeKey(key: any): string {
    try {
      return JSON.stringify(key);
    } catch {
      return String(key);
    }
  }

  private evictLRU(): void {
    // Simple LRU eviction - remove oldest items
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].expiry - b[1].expiry);
    
    // Remove 10% of oldest items
    const toRemove = Math.ceil(this.maxSize * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

export const cacheManager = new CacheManager();

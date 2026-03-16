import type { CacheEntry } from '../types/index.js';

const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 minutes

const TTL_PRESETS = {
  products: 5 * 60 * 1000,
  services: 5 * 60 * 1000,
  portfolio: 10 * 60 * 1000,
  dashboard: 1 * 60 * 1000,
  short: 30 * 1000,
  default: DEFAULT_TTL_MS,
} as const;

type TTLPreset = keyof typeof TTL_PRESETS;

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlOrPreset: number | TTLPreset = 'default'): void {
    const ttlMs = typeof ttlOrPreset === 'string'
      ? TTL_PRESETS[ttlOrPreset]
      : ttlOrPreset;

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
      }
    }
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const cache = new MemoryCache();

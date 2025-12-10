/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from '@vercel/kv';

// KV client wrapper with fallback to in-memory storage for local development
let kvClient: typeof kv | null = null;
const inMemoryFallback = new Map<string, any>();

async function getKVClient() {
  if (kvClient) return kvClient;
  
  try {
    // Check if KV is configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      kvClient = kv;
      return kvClient;
    }
  } catch {
    console.warn('KV not configured, using in-memory fallback');
  }
  
  return null;
}

export async function kvSet(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const client = await getKVClient();
  
  if (client) {
    try {
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        await client.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('KV set error:', error);
      // Fallback to in-memory
      inMemoryFallback.set(key, { value, expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
    }
  } else {
    inMemoryFallback.set(key, { value, expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  }
}

export async function kvGet(key: string): Promise<any> {
  const client = await getKVClient();
  
  if (client) {
    try {
      const result = await client.get(key);
      return result ? JSON.parse(result as string) : null;
    } catch (error) {
      console.error('KV get error:', error);
      // Fallback to in-memory
      const entry = inMemoryFallback.get(key);
      if (entry) {
        if (entry.expiry && Date.now() > entry.expiry) {
          inMemoryFallback.delete(key);
          return null;
        }
        return entry.value;
      }
      return null;
    }
  } else {
    const entry = inMemoryFallback.get(key);
    if (entry) {
      if (entry.expiry && Date.now() > entry.expiry) {
        inMemoryFallback.delete(key);
        return null;
      }
      return entry.value;
    }
    return null;
  }
}

export async function kvDelete(key: string): Promise<void> {
  const client = await getKVClient();
  
  if (client) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('KV delete error:', error);
      inMemoryFallback.delete(key);
    }
  } else {
    inMemoryFallback.delete(key);
  }
}

export async function kvGetAll(pattern: string): Promise<any[]> {
  const client = await getKVClient();
  
  if (client) {
    try {
      const keys = await client.keys(pattern);
      const results: any[] = [];
      for (const key of keys) {
        const value = await client.get(key);
        if (value) {
          results.push(JSON.parse(value as string));
        }
      }
      return results;
    } catch (error) {
      console.error('KV getAll error:', error);
      // Fallback to in-memory
      return Array.from(inMemoryFallback.values())
        .filter(entry => !entry.expiry || Date.now() <= entry.expiry)
        .map(entry => entry.value);
    }
  } else {
    return Array.from(inMemoryFallback.values())
      .filter(entry => !entry.expiry || Date.now() <= entry.expiry)
      .map(entry => entry.value);
  }
}

export async function kvClear(): Promise<void> {
  const client = await getKVClient();
  
  if (client) {
    try {
      const keys = await client.keys('*');
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error('KV clear error:', error);
      inMemoryFallback.clear();
    }
  } else {
    inMemoryFallback.clear();
  }
}

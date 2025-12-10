/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), '.local-kv.json');

interface KVEntry {
  value: any;
  expiry: number | null;
}

// In-memory cache of the DB
let memoryStore: Map<string, KVEntry> | null = null;

function loadStore(): Map<string, KVEntry> {
  if (memoryStore) return memoryStore;
  
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      memoryStore = new Map(Object.entries(data));
    } else {
      memoryStore = new Map();
    }
  } catch (error) {
    console.warn('Failed to load local KV store, starting fresh:', error);
    memoryStore = new Map();
  }
  
  return memoryStore!;
}

function saveStore() {
  if (!memoryStore) return;
  
  try {
    // Convert Map to object for JSON serialization
    const obj = Object.fromEntries(memoryStore);
    fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save local KV store:', error);
  }
}

export async function kvSet(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const store = loadStore();
  store.set(key, { 
    value, 
    expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null 
  });
  saveStore();
}

export async function kvGet(key: string): Promise<any> {
  const store = loadStore();
  const entry = store.get(key);
  
  if (entry) {
    if (entry.expiry && Date.now() > entry.expiry) {
      store.delete(key);
      saveStore();
      return null;
    }
    return entry.value;
  }
  return null;
}

export async function kvDelete(key: string): Promise<void> {
  const store = loadStore();
  store.delete(key);
  saveStore();
}

export async function kvGetAll(pattern: string): Promise<any[]> {
  const store = loadStore();
  const results: any[] = [];
  const now = Date.now();
  
  // Convert Redis-style glob pattern to regex
  // This is a simplified conversion for the specific use cases seen
  // '*' matches anything
  const regexPattern = pattern
    .replace(/[.+^${}()|[\\]/g, '\\$&') // Escape regex special chars
    .replace(/\*/g, '.*'); // Convert glob * to regex .*
    
  const regex = new RegExp(`^${regexPattern}$`);

  for (const [key, entry] of store.entries()) {
    if (regex.test(key)) {
      if (!entry.expiry || now <= entry.expiry) {
        results.push(entry.value);
      }
    }
  }
  return results;
}

export async function kvClear(): Promise<void> {
  const store = loadStore();
  store.clear();
  saveStore();
}
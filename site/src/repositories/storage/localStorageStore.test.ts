import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFromStorage, writeToStorage } from './localStorageStore';

class ThrowingStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(): void {
    throw new Error('Quota exceeded');
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('localStorageStore', () => {
  it('keeps app stable when write fails due to storage quota', () => {
    (globalThis as unknown as { window: Window }).window = {
      localStorage: new ThrowingStorage(),
    } as unknown as Window;

    expect(() => writeToStorage('k', { a: 1 })).not.toThrow();
  });

  it('recovers from invalid JSON payload with fallback', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', '{bad');

    (globalThis as unknown as { window: Window }).window = {
      localStorage: storage,
    } as unknown as Window;

    const result = readFromStorage('k', (v): v is string[] => Array.isArray(v), ['fallback']);
    expect(result).toEqual(['fallback']);
  });
});

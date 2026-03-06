import type { ContentType } from './cmsContent';

interface PreviewTokenEntry {
  token: string;
  itemId: string;
  type: ContentType;
  expiresAt: number;
  used: boolean;
}

const PREVIEW_STORAGE_KEY = 'smove_preview_tokens_v1';
const TOKEN_TTL_MS = 15 * 60 * 1000;

function getStore(): PreviewTokenEntry[] {
  const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
  if (!raw) return [];
  const entries = JSON.parse(raw) as PreviewTokenEntry[];
  const now = Date.now();
  const valid = entries.filter((entry) => entry.expiresAt > now);
  if (valid.length !== entries.length) {
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(valid));
  }
  return valid;
}

function saveStore(entries: PreviewTokenEntry[]) {
  localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(entries));
}

function generateToken() {
  const randomPart = crypto.getRandomValues(new Uint32Array(4));
  return Array.from(randomPart).map((n) => n.toString(16)).join('');
}

export function createPreviewToken(type: ContentType, itemId: string) {
  const token = generateToken();
  const entries = getStore();
  entries.push({ token, itemId, type, expiresAt: Date.now() + TOKEN_TTL_MS, used: false });
  saveStore(entries);
  return token;
}

export function consumePreviewToken(type: ContentType, itemId: string, token: string) {
  const entries = getStore();
  const index = entries.findIndex((entry) => entry.type === type && entry.itemId === itemId && entry.token === token);
  if (index < 0) return false;
  if (entries[index].used || entries[index].expiresAt < Date.now()) return false;
  entries[index].used = true;
  saveStore(entries);
  return true;
}

import { z } from 'zod';

// Types for compression
export type ContentType = 'code' | 'json' | 'text' | 'image';

export interface CompressedResult {
  compressed: string;
  originalLength: number;
  compressedLength: number;
  savingsPercent: number;
  ccrKey?: string;
  type: ContentType;
}

// CCR (Content-Compressed Retrieval) store reference
let ccrStore: Map<string, string> = new Map();

// Generate a deterministic key for CCR
function generateCCRKey(content: string): string {
  // Simple hash-like key
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `ccr_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

// --- Headroom-style compressors ---

function compressJSON(content: string): string {
  try {
    const parsed = JSON.parse(content);
    // Deep compression: remove whitespace, truncate long arrays/strings
    const compacted = JSON.stringify(parsed, (key, value) => {
      if (typeof value === 'string' && value.length > 120) {
        return value.slice(0, 117) + '...';
      }
      if (Array.isArray(value) && value.length > 30) {
        return [...value.slice(0, 28), '...truncated'];
      }
      return value;
    });
    return compacted;
  } catch {
    return content.slice(0, 800) + '...[truncated]';
  }
}

function compressCode(content: string): string {
  // Simplified CodeCompressor: strip comments, collapse whitespace, keep structure
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/\/\/.*$/gm, '')         // line comments
    .replace(/\s+/g, ' ')
    .replace(/;\s+/g, ';')
    .trim()
    .slice(0, 1500); // Budget
}

function compressText(content: string): string {
  // Kompress-base simulation: extract key sentences + collapse
  const lines = content.split('\n').filter(Boolean);
  const keyLines = lines
    .filter(line => line.length > 20)
    .slice(0, 12)
    .join('\n');
  return keyLines.length > 0 ? keyLines : content.slice(0, 600);
}

function compressImageStub(): string {
  return '[IMAGE:compressed:low-res-embed]';
}

// --- Caveman-style budgets & sanitization ---

// Default budgets (can be overridden via config)
let TOOL_BUDGETS: Record<string, number> = {
  read: 280,
  grep: 160,
  bash: 90,
  ls: 60,
  default: 200
};

export function setToolBudgets(budgets: Record<string, number>) {
  TOOL_BUDGETS = { ...TOOL_BUDGETS, ...budgets };
}

function applyToolBudget(content: string, tool: string): string {
  const budget = TOOL_BUDGETS[tool] || TOOL_BUDGETS.default;
  if (content.length <= budget) return content;

  // Strip ANSI + collapse blank lines
  let cleaned = content
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length > budget) {
    cleaned = cleaned.slice(0, budget - 3) + '...';
  }
  return cleaned;
}

// --- Main compression router ---

export function compressContent(
  raw: string,
  type: ContentType,
  tool?: string
): CompressedResult {
  let compressed = raw;
  let ccrKey: string | undefined;

  // 1. Headroom routing
  switch (type) {
    case 'json':
      compressed = compressJSON(raw);
      break;
    case 'code':
      compressed = compressCode(raw);
      break;
    case 'text':
      compressed = compressText(raw);
      break;
    case 'image':
      compressed = compressImageStub();
      break;
  }

  // 2. Apply caveman-style budget + sanitization
  if (tool) {
    compressed = applyToolBudget(compressed, tool);
  }

  // 3. CCR reversible storage
  if (raw.length > 300) {
    ccrKey = generateCCRKey(raw);
    ccrStore.set(ccrKey, raw); // In-memory store; in prod this would be DB
  }

  const originalLength = raw.length;
  const compressedLength = compressed.length;
  const savings = ((originalLength - compressedLength) / originalLength) * 100;

  return {
    compressed,
    originalLength,
    compressedLength,
    savingsPercent: Math.round(savings),
    ccrKey,
    type
  };
}

// Retrieve original via CCR
export function retrieveOriginal(ccrKey: string): string | null {
  return ccrStore.get(ccrKey) || null;
}

// Clear CCR store (for testing)
export function clearCCRStore() {
  ccrStore.clear();
}

// Utility to detect content type heuristically
export function detectContentType(content: string, tool?: string): ContentType {
  if (tool === 'read' && (content.includes('function') || content.includes('class ') || content.includes('import '))) {
    return 'code';
  }
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    return 'json';
  }
  if (tool === 'bash' || content.length < 150) {
    return 'text';
  }
  return 'text';
}
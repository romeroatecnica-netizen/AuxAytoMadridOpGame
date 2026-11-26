import { CANONICAL_ROOT_URL } from '../config/seo';
import { ExamConfig, SharedChallengePayload } from '../types';

export interface ScoreSummary {
  hits: number;
  misses: number;
  blank: number;
  totalOrdinary: number;
  penaltyPoints: number;
  rawNetScore: number;
  clampedNetScore: number;
  scaledOver10: number;
  scaledOver100: number;
  accuracyPercent: number;
  attemptedPercent: number;
}

/**
 * Fórmula oficial Ayuntamiento de Madrid (penalización 1/3 por error):
 * Puntuación = Aciertos - (Fallos / 3)
 * Preguntas en blanco: 0 penalización.
 */
export function calculateMadridExamScore(
  hits: number,
  misses: number,
  blank: number
): ScoreSummary {
  const totalOrdinary = hits + misses + blank;
  const penaltyPoints = misses / 3;
  const rawNetScore = hits - penaltyPoints;
  const clampedNetScore = Math.max(0, rawNetScore);
  const scaledOver10 = totalOrdinary > 0 ? Math.max(0, (rawNetScore / totalOrdinary) * 10) : 0;
  const scaledOver100 = totalOrdinary > 0 ? Math.max(0, (rawNetScore / totalOrdinary) * 100) : 0;
  const attempted = hits + misses;
  const accuracyPercent = attempted > 0 ? (hits / attempted) * 100 : 0;
  const attemptedPercent = totalOrdinary > 0 ? (attempted / totalOrdinary) * 100 : 0;

  return {
    hits,
    misses,
    blank,
    totalOrdinary,
    penaltyPoints,
    rawNetScore,
    clampedNetScore,
    scaledOver10,
    scaledOver100,
    accuracyPercent,
    attemptedPercent,
  };
}

export function formatScore(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeterministic<T>(items: T[], seed?: number): T[] {
  const arr = [...items];
  const rand = seed !== undefined ? mulberry32(seed) : Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64: string): string {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function buildChallengeUrl(payload: SharedChallengePayload): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const url = new URL(CANONICAL_ROOT_URL);
  url.searchParams.set('reto', encoded);
  return url.toString();
}

export function parseChallengeFromUrl(): SharedChallengePayload | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('reto');
    if (!raw) return null;
    const parsed = JSON.parse(fromBase64Url(raw)) as SharedChallengePayload;
    if (!parsed || !parsed.config || !Array.isArray(parsed.config.blocks)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createDefaultChallengeConfig(config: ExamConfig): ExamConfig {
  return {
    ...config,
    seed: config.seed ?? Math.floor(Date.now() % 1000000),
  };
}

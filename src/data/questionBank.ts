import { BlockId, CustomQuestionPack, Question } from '../types';
import { BLOCK_1_QUESTIONS } from './block1';
import { BLOCK_2_QUESTIONS } from './block2';
import { BLOCK_3_QUESTIONS } from './block3';
import { BLOCK_4_QUESTIONS } from './block4';
import { BLOCK_5_QUESTIONS } from './block5';
import { BLOCK_6_QUESTIONS } from './block6';
import { BLOCK_7_QUESTIONS } from './block7';

export const EMBEDDED_QUESTIONS: Question[] = [
  ...BLOCK_1_QUESTIONS,
  ...BLOCK_2_QUESTIONS,
  ...BLOCK_3_QUESTIONS,
  ...BLOCK_4_QUESTIONS,
  ...BLOCK_5_QUESTIONS,
  ...BLOCK_6_QUESTIONS,
  ...BLOCK_7_QUESTIONS,
];

export function isValidQuestion(item: unknown): item is Question {
  if (!item || typeof item !== 'object') return false;
  const q = item as Record<string, unknown>;
  return (
    typeof q.id === 'string' &&
    q.id.trim().length > 0 &&
    typeof q.blockId === 'number' &&
    q.blockId >= 1 &&
    q.blockId <= 7 &&
    typeof q.question === 'string' &&
    q.question.trim().length > 0 &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((opt) => typeof opt === 'string') &&
    typeof q.correctIndex === 'number' &&
    q.correctIndex >= 0 &&
    q.correctIndex <= 3 &&
    typeof q.explanation === 'string' &&
    typeof q.citation === 'string'
  );
}

export interface StaticPackStatus {
  blockId: BlockId;
  path: string;
  loadedCount: number;
}

/**
 * Carga opcional de ficheros estáticos /data/mad-bloque1.json ... /data/mad-bloque7.json
 * Si no existen en el servidor estático, continúa de forma determinista y silenciosa.
 */
export async function loadOptionalStaticPacks(): Promise<{
  questions: Question[];
  statuses: StaticPackStatus[];
}> {
  const statuses: StaticPackStatus[] = [];
  const loadedQuestions: Question[] = [];

  const fetches = ([1, 2, 3, 4, 5, 6, 7] as BlockId[]).map(async (blockId) => {
    const path = `/data/mad-bloque${blockId}.json`;
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) {
        statuses.push({ blockId, path, loadedCount: 0 });
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
        statuses.push({ blockId, path, loadedCount: 0 });
        return;
      }
      const data: unknown = await res.json();
      const rawList = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray((data as { questions?: unknown }).questions)
          ? (data as { questions: unknown[] }).questions
          : [];
      const valid = rawList.filter(isValidQuestion);
      loadedQuestions.push(...valid);
      statuses.push({ blockId, path, loadedCount: valid.length });
    } catch {
      statuses.push({ blockId, path, loadedCount: 0 });
    }
  });

  await Promise.all(fetches);
  statuses.sort((a, b) => a.blockId - b.blockId);
  return { questions: loadedQuestions, statuses };
}

export function mergeQuestionPools(
  embedded: Question[],
  staticExternal: Question[],
  customPacks: CustomQuestionPack[]
): Question[] {
  const byId = new Map<string, Question>();
  for (const q of embedded) byId.set(q.id, q);
  for (const q of staticExternal) byId.set(q.id, q);
  for (const pack of customPacks) {
    for (const q of pack.questions) {
      byId.set(q.id, q);
    }
  }
  return Array.from(byId.values());
}

import { BlockId, ExamConfig, Question } from '../types';
import { mulberry32 } from './scoring';

export interface ChallengeTemplate {
  rotationIndex: number;
  tag: string;
  modeLabel: string;
  description: string;
  ordinaryCount: number;
  reserveCount: number;
  blocks: BlockId[];
  onlyCases: boolean;
  onlyTraps?: boolean;
  timeLimitMinutes: number | null;
}

export const CHALLENGE_ROTATION_DECK: ChallengeTemplate[] = [
  {
    rotationIndex: 0,
    tag: 'Mixto C2',
    modeLabel: 'Duelo Mixto Ayuntamiento de Madrid (20 preg.)',
    description: 'Selección aleatoria equilibrada de los 7 bloques oficiales del temario C2.',
    ordinaryCount: 20,
    reserveCount: 2,
    blocks: [1, 2, 3, 4, 5, 6, 7],
    onlyCases: false,
    timeLimitMinutes: 18,
  },
  {
    rotationIndex: 1,
    tag: 'Madrid y LCREM',
    modeLabel: 'Reto Ley 22/2006 de Capitalidad y Distritos (15 preg.)',
    description: 'Pleno, Alcaldía, Junta de Gobierno de Madrid, TEAMM y organización territorial.',
    ordinaryCount: 15,
    reserveCount: 0,
    blocks: [1, 2],
    onlyCases: false,
    timeLimitMinutes: 12,
  },
  {
    rotationIndex: 2,
    tag: 'Procedimiento',
    modeLabel: 'Desafío Ley 39/2015, Plazos y Recursos (15 preg.)',
    description: 'Acto administrativo, notificaciones, silencio, cómputo de plazos y recursos.',
    ordinaryCount: 15,
    reserveCount: 0,
    blocks: [3],
    onlyCases: false,
    timeLimitMinutes: 15,
  },
  {
    rotationIndex: 3,
    tag: 'Caza Trampas',
    modeLabel: 'Duelo Caza la Trampa del Enunciado (15 preg.)',
    description: 'Enunciados con matices críticos («siempre», «únicamente», «salvo», «en todo caso»).',
    ordinaryCount: 15,
    reserveCount: 0,
    blocks: [1, 2, 3, 4, 5, 6, 7],
    onlyCases: false,
    onlyTraps: true,
    timeLimitMinutes: 14,
  },
  {
    rotationIndex: 4,
    tag: 'Casos Prácticos',
    modeLabel: 'Reto Supuestos Municipales y Plazos de Madrid (15 preg.)',
    description: 'Supuestos reales de oficina, registros, notificaciones y cálculo de fechas en Madrid.',
    ordinaryCount: 15,
    reserveCount: 0,
    blocks: [1, 2, 3, 4, 5, 6, 7],
    onlyCases: true,
    timeLimitMinutes: 18,
  },
  {
    rotationIndex: 5,
    tag: 'Personal y Hacienda',
    modeLabel: 'Desafío TREBEP y Presupuesto Municipal (15 preg.)',
    description: 'Permisos, situaciones administrativas, IBI/IAE/IVTM, tasas y fases ADOP.',
    ordinaryCount: 15,
    reserveCount: 0,
    blocks: [5, 6],
    onlyCases: false,
    timeLimitMinutes: 14,
  },
  {
    rotationIndex: 6,
    tag: 'e-Admin y Ofimática',
    modeLabel: 'Reto Atención Ciudadana, RGPD y Excel/Word (15 preg.)',
    description: 'Línea Madrid, transparencia, protección de datos, fórmulas Excel y atajos Word.',
    ordinaryCount: 15,
    reserveCount: 0,
    blocks: [4, 7],
    onlyCases: false,
    timeLimitMinutes: 12,
  },
  {
    rotationIndex: 7,
    tag: 'Simulacro 25+3',
    modeLabel: 'Mini Simulacro Oficial con Reserva (-1/3) (25 preg.)',
    description: 'Cuestionario completo de 25 ordinarias + 3 preguntas de reserva en 25 minutos.',
    ordinaryCount: 25,
    reserveCount: 3,
    blocks: [1, 2, 3, 4, 5, 6, 7],
    onlyCases: false,
    timeLimitMinutes: 25,
  },
];

function createFreshSeed(): number {
  const timePart = Date.now() % 1_000_000;
  const randPart = Math.floor(Math.random() * 900_000) + 100_000;
  return (timePart ^ randPart) >>> 0;
}

function createChallengeId(seed: number): string {
  return `R-${seed.toString(36).toUpperCase().slice(0, 6)}`;
}

export function createChallengeFromTemplate(templateIndex: number): ExamConfig {
  const safeIdx =
    ((templateIndex % CHALLENGE_ROTATION_DECK.length) + CHALLENGE_ROTATION_DECK.length) %
    CHALLENGE_ROTATION_DECK.length;
  const tpl = CHALLENGE_ROTATION_DECK[safeIdx];
  const seed = createFreshSeed();
  return {
    modeLabel: tpl.modeLabel,
    ordinaryCount: tpl.ordinaryCount,
    reserveCount: tpl.reserveCount,
    blocks: [...tpl.blocks],
    onlyCases: tpl.onlyCases,
    onlyTraps: tpl.onlyTraps,
    timeLimitMinutes: tpl.timeLimitMinutes,
    seed,
    challengeId: createChallengeId(seed),
    rotationIndex: safeIdx,
  };
}

/**
 * Rota automáticamente a una prueba diferente de la anterior y genera una nueva semilla
 * para que cada nuevo reto cambie tanto de formato/bloques como de preguntas y orden.
 */
export function generateNextRotatingChallenge(previousRotationIndex?: number): ExamConfig {
  const total = CHALLENGE_ROTATION_DECK.length;
  let nextIdx = Math.floor(Math.random() * total);
  if (previousRotationIndex !== undefined && total > 1 && nextIdx === previousRotationIndex) {
    nextIdx = (previousRotationIndex + 1 + Math.floor(Math.random() * (total - 1))) % total;
  }
  return createChallengeFromTemplate(nextIdx);
}

/**
 * Permuta determinísticamente las 4 opciones A/B/C/D según la semilla del reto y posición,
 * garantizando que dos opositores con el mismo enlace vean exactamente las mismas opciones
 * mientras cada nuevo reto cambia el orden.
 */
export function shuffleQuestionOptions(
  question: Question,
  seed: number,
  questionPos: number
): Question {
  const rand = mulberry32((seed + (questionPos + 1) * 7919) >>> 0);
  const indices: [number, number, number, number] = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const newOptions: [string, string, string, string] = [
    question.options[indices[0]],
    question.options[indices[1]],
    question.options[indices[2]],
    question.options[indices[3]],
  ];
  const newCorrect = indices.indexOf(question.correctIndex) as 0 | 1 | 2 | 3;

  return {
    ...question,
    options: newOptions,
    correctIndex: newCorrect,
  };
}

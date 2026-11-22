export type BlockId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Difficulty = 'basico' | 'medio' | 'examen';

export interface Question {
  id: string;
  blockId: BlockId;
  topic: string;
  difficulty: Difficulty;
  isCase?: boolean;
  isTrap?: boolean;
  trapKeyword?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  citation: string;
}

export interface SyllabusBlock {
  id: BlockId;
  code: string;
  title: string;
  shortTitle: string;
  description: string;
  laws: string[];
  units: {
    id: string;
    title: string;
    subtitle: string;
    difficulty: Difficulty;
  }[];
}

export interface MistakeEntry {
  questionId: string;
  count: number;
  lastFailedAt: string;
  mastered: boolean;
}

export interface ExamAnswerRecord {
  questionId: string;
  selectedIndex: number | null;
  isReserve: boolean;
}

export interface ExamRecord {
  id: string;
  title: string;
  date: string;
  totalOrdinary: number;
  reserveCount: number;
  hits: number;
  misses: number;
  blank: number;
  netScore: number;
  maxScore: number;
  scaledOver10: number;
  durationSeconds: number;
  blockBreakdown: Record<number, { hits: number; misses: number; blank: number }>;
}

export interface CustomQuestionPack {
  id: string;
  name: string;
  importedAt: string;
  questions: Question[];
}

export interface UserProgress {
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  shields: number;
  freePracticeNoShields: boolean;
  completedLessons: Record<
    string,
    {
      bestHits: number;
      total: number;
      attempts: number;
      lastPlayedAt: string;
    }
  >;
  mistakes: Record<string, MistakeEntry>;
  examHistory: ExamRecord[];
  customPacks: CustomQuestionPack[];
}

export type AppView = 'ruta' | 'simulador' | 'casos' | 'clinica' | 'temario';

export type MinigameType = 'plazos60' | 'trampas' | 'capitalidad' | 'fallos';

export interface ExamConfig {
  modeLabel: string;
  ordinaryCount: number;
  reserveCount: number;
  blocks: BlockId[];
  onlyCases: boolean;
  timeLimitMinutes: number | null;
  seed?: number;
}

export interface SharedChallengePayload {
  type: 'challenge' | 'result';
  senderName?: string;
  config: ExamConfig;
  result?: {
    hits: number;
    misses: number;
    blank: number;
    netScore: number;
    maxScore: number;
    scaledOver10: number;
  };
}

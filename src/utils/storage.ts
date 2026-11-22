import { CustomQuestionPack, ExamRecord, UserProgress } from '../types';

const STORAGE_KEY = 'auxmadopgame_progress_v1';

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createInitialProgress(): UserProgress {
  return {
    xp: 0,
    streakDays: 0,
    lastActiveDate: '',
    shields: 5,
    freePracticeNoShields: false,
    completedLessons: {},
    mistakes: {},
    examHistory: [],
    customPacks: [],
  };
}

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    const base = createInitialProgress();
    return {
      ...base,
      ...parsed,
      completedLessons: parsed.completedLessons ?? {},
      mistakes: parsed.mistakes ?? {},
      examHistory: Array.isArray(parsed.examHistory) ? parsed.examHistory : [],
      customPacks: Array.isArray(parsed.customPacks) ? parsed.customPacks : [],
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function touchDailyActivity(progress: UserProgress, earnedXp: number): UserProgress {
  const today = getTodayIso();
  const yesterday = getYesterdayIso();
  let nextStreak = progress.streakDays;

  if (progress.lastActiveDate === today) {
    nextStreak = Math.max(1, progress.streakDays);
  } else if (progress.lastActiveDate === yesterday) {
    nextStreak = progress.streakDays + 1;
  } else {
    nextStreak = 1;
  }

  return {
    ...progress,
    xp: progress.xp + earnedXp,
    streakDays: nextStreak,
    lastActiveDate: today,
  };
}

export function recordMistake(progress: UserProgress, questionId: string): UserProgress {
  const existing = progress.mistakes[questionId];
  return {
    ...progress,
    mistakes: {
      ...progress.mistakes,
      [questionId]: {
        questionId,
        count: existing ? existing.count + 1 : 1,
        lastFailedAt: new Date().toISOString(),
        mastered: false,
      },
    },
  };
}

export function markMistakeMastered(progress: UserProgress, questionId: string): UserProgress {
  const existing = progress.mistakes[questionId];
  if (!existing) return progress;
  return {
    ...progress,
    mistakes: {
      ...progress.mistakes,
      [questionId]: {
        ...existing,
        mastered: true,
      },
    },
  };
}

export function appendExamRecord(progress: UserProgress, record: ExamRecord): UserProgress {
  return {
    ...progress,
    examHistory: [record, ...progress.examHistory].slice(0, 30),
  };
}

export function addCustomPack(progress: UserProgress, pack: CustomQuestionPack): UserProgress {
  return {
    ...progress,
    customPacks: [pack, ...progress.customPacks],
  };
}

export function removeCustomPack(progress: UserProgress, packId: string): UserProgress {
  return {
    ...progress,
    customPacks: progress.customPacks.filter((p) => p.id !== packId),
  };
}

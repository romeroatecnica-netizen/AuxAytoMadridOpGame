import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { AdAndSeoSection } from './components/AdAndSeoSection';
import { CasesAndDeadlinesView } from './components/CasesAndDeadlinesView';
import { DuolingoPathView } from './components/DuolingoPathView';
import { ExamSimulator } from './components/ExamSimulator';
import { LessonResultSummary, LessonRunner } from './components/LessonRunner';
import { MistakeClinicView } from './components/MistakeClinicView';
import { SyllabusAndBankView } from './components/SyllabusAndBankView';
import { TopBar } from './components/TopBar';
import { syncSeoHeadTags } from './config/seo';
import {
  EMBEDDED_QUESTIONS,
  loadOptionalStaticPacks,
  mergeQuestionPools,
  StaticPackStatus,
} from './data/questionBank';
import {
  AppView,
  BlockId,
  CustomQuestionPack,
  ExamRecord,
  MinigameType,
  Question,
  SharedChallengePayload,
  UserProgress,
} from './types';
import { generateDeterministicCaseBatch } from './utils/deadlines';
import { buildChallengeUrl, parseChallengeFromUrl, shuffleDeterministic } from './utils/scoring';
import {
  addCustomPack,
  appendExamRecord,
  createInitialProgress,
  loadProgress,
  markMistakeMastered,
  recordMistake,
  removeCustomPack,
  saveProgress,
  touchDailyActivity,
} from './utils/storage';

interface ActiveLessonState {
  lessonKey: string;
  title: string;
  subtitle: string;
  questions: Question[];
  timedSeconds?: number;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('ruta');
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [staticQuestions, setStaticQuestions] = useState<Question[]>([]);
  const [staticStatuses, setStaticStatuses] = useState<StaticPackStatus[]>(
    ([1, 2, 3, 4, 5, 6, 7] as BlockId[]).map((id) => ({
      blockId: id,
      path: `/data/mad-bloque${id}.json`,
      loadedCount: 0,
    }))
  );

  const [activeLesson, setActiveLesson] = useState<ActiveLessonState | null>(null);
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [incomingChallenge, setIncomingChallenge] =
    useState<SharedChallengePayload | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Persist progress changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Sync canonical, hreflang, og:url & twitter:url strictly from CANONICAL_ORIGIN
  useEffect(() => {
    syncSeoHeadTags();
  }, [activeView]);

  // Load optional /data/mad-bloque*.json files & check URL challenge
  useEffect(() => {
    let active = true;
    loadOptionalStaticPacks().then(({ questions, statuses }) => {
      if (!active) return;
      setStaticQuestions(questions);
      setStaticStatuses(statuses);
    });

    const urlChallenge = parseChallengeFromUrl();
    if (urlChallenge) {
      setIncomingChallenge(urlChallenge);
      setActiveView('simulador');
    }
    return () => {
      active = false;
    };
  }, []);

  const allQuestions = useMemo(
    () => mergeQuestionPools(EMBEDDED_QUESTIONS, staticQuestions, progress.customPacks),
    [staticQuestions, progress.customPacks]
  );

  const activeMistakes = useMemo(
    () => Object.values(progress.mistakes).filter((m) => !m.mastered),
    [progress.mistakes]
  );

  const handleNavigate = (view: AppView) => {
    setActiveLesson(null);
    setIsExamRunning(false);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSharePayload = useCallback(async (payload: SharedChallengePayload) => {
    const url = buildChallengeUrl(payload);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setShareToast(url);
    } catch {
      setShareToast(url);
    }
  }, []);

  const handleGlobalShareChallenge = () => {
    handleSharePayload({
      type: 'challenge',
      config: {
        modeLabel: 'Reto Rápido Ayuntamiento de Madrid (25 preg.)',
        ordinaryCount: 25,
        reserveCount: 3,
        blocks: [1, 2, 3, 4, 5, 6, 7],
        onlyCases: false,
        timeLimitMinutes: 25,
        seed: Math.floor(Date.now() % 1000000),
      },
    });
  };

  const handleStartUnitLesson = (
    blockId: BlockId,
    unitId: string,
    unitTitle: string
  ) => {
    const blockPool = allQuestions.filter((q) => q.blockId === blockId);
    const chosen = shuffleDeterministic(blockPool).slice(0, 10);
    setActiveLesson({
      lessonKey: unitId,
      title: unitTitle,
      subtitle: 'Lección rápida de 10 preguntas · Ruta C2',
      questions: chosen,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartMinigame = (type: MinigameType) => {
    if (type === 'plazos60') {
      const deadlinePool = [
        ...allQuestions.filter(
          (q) =>
            q.blockId === 3 ||
            q.question.toLowerCase().includes('plazo') ||
            q.question.toLowerCase().includes('días') ||
            q.question.toLowerCase().includes('mes')
        ),
        ...generateDeterministicCaseBatch(Math.floor(Date.now() % 500), 6),
      ];
      setActiveLesson({
        lessonKey: 'minigame-plazos60',
        title: 'Contrarreloj de Plazos y Leyes (60 s)',
        subtitle: 'Responde tantas preguntas como puedas antes de que el cronómetro llegue a 00:00',
        questions: shuffleDeterministic(deadlinePool).slice(0, 25),
        timedSeconds: 60,
      });
    } else if (type === 'trampas') {
      const trapPool = allQuestions.filter((q) => q.isTrap);
      const fallbackPool = allQuestions.filter((q) => q.difficulty === 'examen');
      const pool = trapPool.length >= 6 ? trapPool : [...trapPool, ...fallbackPool];
      setActiveLesson({
        lessonKey: 'minigame-trampas',
        title: 'Caza la Trampa del Enunciado',
        subtitle: 'Enunciados con «siempre», «únicamente», «salvo» y «en todo caso»',
        questions: shuffleDeterministic(pool).slice(0, 10),
      });
    } else if (type === 'capitalidad') {
      const madridPool = allQuestions.filter(
        (q) =>
          q.blockId === 2 ||
          q.citation.includes('22/2006') ||
          q.question.toLowerCase().includes('madrid')
      );
      setActiveLesson({
        lessonKey: 'minigame-capitalidad',
        title: 'Reto Ley de Capitalidad (22/2006) y Distritos',
        subtitle: 'Especial Ayuntamiento de Madrid: Pleno, Junta de Gobierno y 21 Distritos',
        questions: shuffleDeterministic(madridPool).slice(0, 12),
      });
    } else if (type === 'fallos') {
      const mistakeIds = new Set(activeMistakes.map((m) => m.questionId));
      const mistakeQs = allQuestions.filter((q) => mistakeIds.has(q.id));
      const finalPool =
        mistakeQs.length > 0
          ? shuffleDeterministic(mistakeQs).slice(0, 15)
          : shuffleDeterministic(allQuestions).slice(0, 10);
      setActiveLesson({
        lessonKey: 'minigame-fallos',
        title:
          mistakeQs.length > 0
            ? 'Repaso de Mis Fallos (Clínica)'
            : 'Repaso Mixto de Consolidación',
        subtitle:
          mistakeQs.length > 0
            ? 'Refuerzo de preguntas falladas anteriormente'
            : 'Sin fallos pendientes: sesión mixta de los 7 bloques',
        questions: finalPool,
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePracticeClinicMistakes = (blockFilter?: BlockId) => {
    const mistakeIds = new Set(activeMistakes.map((m) => m.questionId));
    const filtered = allQuestions.filter(
      (q) => mistakeIds.has(q.id) && (blockFilter ? q.blockId === blockFilter : true)
    );
    if (filtered.length === 0) return;

    setActiveView('ruta');
    setActiveLesson({
      lessonKey: 'clinic-drill',
      title: blockFilter
        ? `Clínica de Fallos · Bloque ${blockFilter}`
        : 'Clínica de Fallos · Sesión Dirigida',
      subtitle: 'Las preguntas acertadas quedan reforzadas; los errores se mantienen en clínica',
      questions: shuffleDeterministic(filtered).slice(0, 15),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLessonComplete = useCallback(
    (summary: LessonResultSummary) => {
      if (!activeLesson) return;
      setProgress((prev) => {
        let next = touchDailyActivity(prev, summary.xpEarned);

        // Update shields if not free practice & not timed
        if (!prev.freePracticeNoShields && activeLesson.timedSeconds === undefined) {
          next = { ...next, shields: summary.shieldsRemaining };
        }

        // Log failed questions to clinic
        for (const id of summary.failedQuestionIds) {
          next = recordMistake(next, id);
        }

        // Mark unit completion for standard units
        if (activeLesson.lessonKey.startsWith('b')) {
          const prevRecord = next.completedLessons[activeLesson.lessonKey];
          const total = activeLesson.questions.length;
          next = {
            ...next,
            completedLessons: {
              ...next.completedLessons,
              [activeLesson.lessonKey]: {
                bestHits: Math.max(prevRecord?.bestHits ?? 0, summary.hits),
                total,
                attempts: (prevRecord?.attempts ?? 0) + 1,
                lastPlayedAt: new Date().toISOString(),
              },
            },
          };
        }

        return next;
      });
    },
    [activeLesson]
  );

  const handleFinishExam = useCallback(
    (record: ExamRecord, failedIds: string[], xpEarned: number) => {
      setProgress((prev) => {
        let next = touchDailyActivity(prev, xpEarned);
        next = appendExamRecord(next, record);
        for (const id of failedIds) {
          next = recordMistake(next, id);
        }
        return next;
      });
    },
    []
  );

  const handleToggleFreePractice = () => {
    setProgress((prev) => ({
      ...prev,
      freePracticeNoShields: !prev.freePracticeNoShields,
    }));
  };

  const handleRestoreShields = () => {
    setProgress((prev) => ({ ...prev, shields: 5 }));
  };

  const handleImportPack = (pack: CustomQuestionPack) => {
    setProgress((prev) => addCustomPack(prev, pack));
  };

  const handleDeletePack = (packId: string) => {
    setProgress((prev) => removeCustomPack(prev, packId));
  };

  const handleResetProgress = () => {
    const fresh = createInitialProgress();
    setProgress(fresh);
    saveProgress(fresh);
  };

  const isFocusSessionActive = Boolean(activeLesson) || isExamRunning;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopBar
        activeView={activeView}
        onNavigate={handleNavigate}
        xp={progress.xp}
        streakDays={progress.streakDays}
        shields={progress.shields}
        freePracticeNoShields={progress.freePracticeNoShields}
        mistakeCount={activeMistakes.length}
        onShareChallenge={handleGlobalShareChallenge}
        isFocusSessionActive={isFocusSessionActive}
      />

      {/* Share URL Toast Banner */}
      {shareToast && (
        <div className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#059669]/40 bg-[#ECFDF5] px-4 py-3 text-xs text-[#065F46]">
            <div className="flex items-center gap-2 min-w-0">
              <Check className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
              <span className="font-semibold">Enlace de reto listo para compartir:</span>
              <code className="truncate max-w-[220px] sm:max-w-md rounded bg-white px-2 py-0.5 text-[11px] text-[#0F172A]">
                {shareToast}
              </code>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(shareToast)}
                className="inline-flex items-center gap-1 rounded-md bg-[#059669] px-2.5 py-1 font-semibold text-white cursor-pointer"
              >
                <Copy className="h-3 w-3" aria-hidden="true" />
                <span>Copiar</span>
              </button>
              <button
                type="button"
                onClick={() => setShareToast(null)}
                className="font-semibold underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {activeLesson ? (
          <LessonRunner
            title={activeLesson.title}
            subtitle={activeLesson.subtitle}
            questions={activeLesson.questions}
            timedSeconds={activeLesson.timedSeconds}
            initialShields={progress.shields}
            freePracticeNoShields={progress.freePracticeNoShields}
            onToggleFreePractice={handleToggleFreePractice}
            onComplete={handleLessonComplete}
            onExit={() => setActiveLesson(null)}
          />
        ) : (
          <>
            {activeView === 'ruta' && (
              <DuolingoPathView
                questions={allQuestions}
                progress={progress}
                activeMistakeCount={activeMistakes.length}
                onStartUnitLesson={handleStartUnitLesson}
                onStartMinigame={handleStartMinigame}
                onToggleFreePractice={handleToggleFreePractice}
                onRestoreShields={handleRestoreShields}
                onGoToSimulator={() => handleNavigate('simulador')}
              />
            )}

            {activeView === 'simulador' && (
              <ExamSimulator
                questions={allQuestions}
                examHistory={progress.examHistory}
                incomingChallenge={incomingChallenge}
                onClearIncomingChallenge={() => setIncomingChallenge(null)}
                onExamActiveChange={setIsExamRunning}
                onFinishExam={handleFinishExam}
                onShareExamPayload={handleSharePayload}
              />
            )}

            {activeView === 'casos' && <CasesAndDeadlinesView />}

            {activeView === 'clinica' && (
              <MistakeClinicView
                questions={allQuestions}
                progress={progress}
                onPracticeMistakes={handlePracticeClinicMistakes}
                onMarkMastered={(qId) =>
                  setProgress((prev) => markMistakeMastered(prev, qId))
                }
              />
            )}

            {activeView === 'temario' && (
              <SyllabusAndBankView
                questions={allQuestions}
                embeddedCount={EMBEDDED_QUESTIONS.length}
                staticStatuses={staticStatuses}
                progress={progress}
                onImportPack={handleImportPack}
                onDeletePack={handleDeletePack}
                onResetProgress={handleResetProgress}
              />
            )}
          </>
        )}

        <AdAndSeoSection isFocusSessionActive={isFocusSessionActive} />
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-xs text-[#64748B] no-print">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <span className="font-bold text-[#0F172A]">AuxMadOpGame</span> · Entrenamiento y
            simulacros de Auxiliar Administrativo del Ayuntamiento de Madrid (Subgrupo C2).
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('ruta')}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              Ruta Duolingo
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('simulador')}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              Simulador (-1/3)
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('casos')}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              Plazos Ley 39/2015
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('temario')}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              Temario y JSON
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

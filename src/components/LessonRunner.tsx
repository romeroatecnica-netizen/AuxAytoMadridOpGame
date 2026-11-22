import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  RotateCcw,
  Shield,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { Question } from '../types';
import { formatDuration } from '../utils/scoring';

export interface LessonResultSummary {
  hits: number;
  misses: number;
  xpEarned: number;
  failedQuestionIds: string[];
  masteredQuestionIds: string[];
  shieldsRemaining: number;
  abortedByShields: boolean;
}

interface LessonRunnerProps {
  title: string;
  subtitle: string;
  questions: Question[];
  timedSeconds?: number;
  initialShields: number;
  freePracticeNoShields: boolean;
  onToggleFreePractice: () => void;
  onComplete: (summary: LessonResultSummary) => void;
  onExit: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const LessonRunner: React.FC<LessonRunnerProps> = ({
  title,
  subtitle,
  questions,
  timedSeconds,
  initialShields,
  freePracticeNoShields,
  onToggleFreePractice,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [shields, setShields] = useState(initialShields);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    timedSeconds !== undefined ? timedSeconds : null
  );
  const [finished, setFinished] = useState(false);
  const [abortedByShields, setAbortedByShields] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isTimed = timedSeconds !== undefined;

  const finalizeSession = useCallback(
    (
      finalHits: number,
      finalMisses: number,
      finalXp: number,
      finalFailed: string[],
      finalMastered: string[],
      finalShields: number,
      outOfShields: boolean
    ) => {
      setFinished(true);
      setAbortedByShields(outOfShields);
      onComplete({
        hits: finalHits,
        misses: finalMisses,
        xpEarned: finalXp,
        failedQuestionIds: finalFailed,
        masteredQuestionIds: finalMastered,
        shieldsRemaining: finalShields,
        abortedByShields: outOfShields,
      });
    },
    [onComplete]
  );

  // Countdown for Contrarreloj 60s minigame
  useEffect(() => {
    if (!isTimed || finished || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      finalizeSession(hits, misses, xpEarned, failedIds, masteredIds, shields, false);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [
    isTimed,
    finished,
    secondsLeft,
    hits,
    misses,
    xpEarned,
    failedIds,
    masteredIds,
    shields,
    finalizeSession,
  ]);

  const handleSelectOption = useCallback(
    (optionIdx: number) => {
      if (selectedOption !== null || !currentQuestion || finished) return;
      setSelectedOption(optionIdx);

      const isCorrect = optionIdx === currentQuestion.correctIndex;
      if (isCorrect) {
        const nextCombo = combo + 1;
        const gained = 15 + (nextCombo >= 3 ? 5 : 0);
        setHits((h) => h + 1);
        setCombo(nextCombo);
        setXpEarned((x) => x + gained);
        setMasteredIds((prev) =>
          prev.includes(currentQuestion.id) ? prev : [...prev, currentQuestion.id]
        );
      } else {
        setMisses((m) => m + 1);
        setCombo(0);
        setFailedIds((prev) =>
          prev.includes(currentQuestion.id) ? prev : [...prev, currentQuestion.id]
        );
        if (!freePracticeNoShields && !isTimed) {
          setShields((s) => Math.max(0, s - 1));
        }
      }
    },
    [selectedOption, currentQuestion, finished, combo, freePracticeNoShields, isTimed]
  );

  const handleNext = useCallback(() => {
    if (!currentQuestion) return;

    if (!freePracticeNoShields && !isTimed && shields <= 0) {
      finalizeSession(hits, misses, xpEarned, failedIds, masteredIds, 0, true);
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      finalizeSession(hits, misses, xpEarned, failedIds, masteredIds, shields, false);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
  }, [
    currentQuestion,
    freePracticeNoShields,
    isTimed,
    shields,
    currentIndex,
    questions.length,
    hits,
    misses,
    xpEarned,
    failedIds,
    masteredIds,
    finalizeSession,
  ]);

  // Keyboard shortcuts A/B/C/D and Enter
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (finished) return;
      const key = e.key.toUpperCase();
      if (selectedOption === null) {
        if (key === 'A' || key === '1') handleSelectOption(0);
        if (key === 'B' || key === '2') handleSelectOption(1);
        if (key === 'C' || key === '3') handleSelectOption(2);
        if (key === 'D' || key === '4') handleSelectOption(3);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finished, selectedOption, handleSelectOption, handleNext]);

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-[#0F172A]">No hay preguntas disponibles para este modo</h2>
        <p className="mt-2 text-sm text-[#475569]">
          Prueba otro bloque o añade preguntas desde el importador JSON.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-6 rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  if (finished) {
    const totalAnswered = hits + misses;
    const accuracy = totalAnswered > 0 ? Math.round((hits / totalAnswered) * 100) : 0;

    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#1E3A8A]">
              {abortedByShields ? 'Escudos agotados' : 'Sesión completada'}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#0F172A]">{title}</h2>
            <p className="mt-1 text-sm text-[#475569]">{subtitle}</p>
          </div>
          {abortedByShields ? (
            <ShieldAlert className="h-9 w-9 text-[#DC2626] shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-9 w-9 text-[#059669] shrink-0" aria-hidden="true" />
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <div className="text-xs text-[#64748B]">Aciertos</div>
            <div className="mt-1 text-2xl font-bold text-[#059669] tabular-nums">{hits}</div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <div className="text-xs text-[#64748B]">Fallos (a Clínica)</div>
            <div className="mt-1 text-2xl font-bold text-[#DC2626] tabular-nums">{misses}</div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <div className="text-xs text-[#64748B]">Precisión</div>
            <div className="mt-1 text-2xl font-bold text-[#0F172A] tabular-nums">{accuracy}%</div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <div className="text-xs text-[#64748B]">XP ganada</div>
            <div className="mt-1 text-2xl font-bold text-[#1E3A8A] tabular-nums">+{xpEarned}</div>
          </div>
        </div>

        {abortedByShields && (
          <div className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
            Te quedaste sin escudos en esta lección. Puedes activar el modo{' '}
            <strong>Práctica libre sin vidas</strong> para entrenar sin interrupciones o repasar tus
            errores en Mi Clínica de Fallos.
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
          >
            Volver a la ruta
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              setSelectedOption(null);
              setHits(0);
              setMisses(0);
              setCombo(0);
              setXpEarned(0);
              setShields(Math.max(1, initialShields));
              setFailedIds([]);
              setMasteredIds([]);
              setSecondsLeft(timedSeconds !== undefined ? timedSeconds : null);
              setFinished(false);
              setAbortedByShields(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Repetir sesión</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPct = ((currentIndex + (selectedOption !== null ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Lesson Top Progress Bar */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Salir de la sesión"
              className="rounded-lg border border-[#E2E8F0] p-2 text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">{title}</h2>
              <p className="text-xs text-[#64748B]">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 tabular-nums text-xs font-semibold">
            {isTimed && secondsLeft !== null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${
                  secondsLeft <= 15
                    ? 'bg-[#FEF2F2] text-[#DC2626]'
                    : 'bg-[#EFF6FF] text-[#1E3A8A]'
                }`}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{formatDuration(secondsLeft)}</span>
              </span>
            )}

            {combo >= 2 && (
              <span className="inline-flex items-center gap-1 text-[#D97706]">
                <Flame className="h-4 w-4" aria-hidden="true" />
                <span>Racha x{combo}</span>
              </span>
            )}

            {!isTimed && (
              <button
                type="button"
                onClick={onToggleFreePractice}
                title="Alternar modo Práctica libre sin vidas"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] px-2.5 py-1 text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5 text-[#9F1239]" aria-hidden="true" />
                <span>{freePracticeNoShields ? 'Sin vidas' : `${shields}/5`}</span>
              </button>
            )}

            <span className="text-[#475569]">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
          <div
            className="h-full bg-[#1E3A8A] transition-all duration-200"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <span>Bloque {currentQuestion.blockId}</span>
          <span aria-hidden="true">·</span>
          <span>{currentQuestion.topic}</span>
          {currentQuestion.isCase && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#9F1239]">Supuesto práctico</span>
            </>
          )}
          {currentQuestion.isTrap && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#D97706]">Atención a matiz legal</span>
            </>
          )}
        </div>

        <h3 className="mt-3 text-lg sm:text-xl font-bold leading-snug text-[#0F172A]">
          {currentQuestion.question}
        </h3>

        <div className="mt-5 grid gap-3">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQuestion.correctIndex;
            const showResult = selectedOption !== null;

            let containerClass =
              'border-[#E2E8F0] bg-white hover:border-[#1E3A8A] hover:bg-[#F8FAFC] text-[#0F172A]';
            let letterClass = 'border-[#CBD5E1] bg-[#F8FAFC] text-[#334155]';

            if (showResult) {
              if (isCorrect) {
                containerClass = 'border-[#059669] bg-[#ECFDF5] text-[#065F46]';
                letterClass = 'border-[#059669] bg-[#059669] text-white';
              } else if (isSelected && !isCorrect) {
                containerClass = 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]';
                letterClass = 'border-[#DC2626] bg-[#DC2626] text-white';
              } else {
                containerClass = 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] opacity-75';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={selectedOption !== null}
                onClick={() => handleSelectOption(idx)}
                className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors min-h-[54px] cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] ${containerClass}`}
              >
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${letterClass}`}
                >
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="flex-1 text-sm sm:text-[15px] leading-relaxed font-medium">
                  {opt}
                </span>
                {showResult && isCorrect && (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]"
                    aria-label="Respuesta correcta"
                  />
                )}
                {showResult && isSelected && !isCorrect && (
                  <XCircle
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]"
                    aria-label="Respuesta incorrecta"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback Panel */}
        {selectedOption !== null && (
          <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                {selectedOption === currentQuestion.correctIndex ? (
                  <span className="inline-flex items-center gap-1.5 text-[#059669]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Respuesta correcta (+{combo >= 3 ? 20 : 15} XP)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[#DC2626]">
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    <span>
                      Incorrecta · Opción correcta: {OPTION_LETTERS[currentQuestion.correctIndex]} (enviada a Clínica de Fallos)
                    </span>
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-[#1E3A8A]">
                {currentQuestion.citation}
              </span>
            </div>

            <p className="mt-2.5 text-sm leading-relaxed text-[#334155]">
              {currentQuestion.explanation}
            </p>

            {currentQuestion.trapKeyword && (
              <p className="mt-2 text-xs font-medium text-[#9F1239]">
                Clave de examen: vigila el término «{currentQuestion.trapKeyword}» en los distractores.
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
              >
                <span>
                  {currentIndex + 1 >= questions.length ||
                  (!freePracticeNoShields && !isTimed && shields <= 0)
                    ? 'Ver resumen'
                    : 'Siguiente pregunta'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

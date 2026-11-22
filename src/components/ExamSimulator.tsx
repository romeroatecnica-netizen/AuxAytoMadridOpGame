import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eraser,
  Flag,
  Play,
  Printer,
  RotateCcw,
  Share2,
  XCircle,
} from 'lucide-react';
import { SYLLABUS_BLOCKS } from '../data/syllabus';
import {
  BlockId,
  ExamConfig,
  ExamRecord,
  Question,
  SharedChallengePayload,
} from '../types';
import { generateDeterministicCaseBatch } from '../utils/deadlines';
import {
  calculateMadridExamScore,
  formatDuration,
  formatScore,
  shuffleDeterministic,
} from '../utils/scoring';

interface ExamSimulatorProps {
  questions: Question[];
  examHistory: ExamRecord[];
  incomingChallenge: SharedChallengePayload | null;
  onClearIncomingChallenge: () => void;
  onExamActiveChange: (active: boolean) => void;
  onFinishExam: (
    record: ExamRecord,
    failedIds: string[],
    xpEarned: number
  ) => void;
  onShareExamPayload: (payload: SharedChallengePayload) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

type Phase = 'config' | 'running' | 'results';
type ReviewFilter = 'all' | 'wrong' | 'blank' | 'correct';

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({
  questions,
  examHistory,
  incomingChallenge,
  onClearIncomingChallenge,
  onExamActiveChange,
  onFinishExam,
  onShareExamPayload,
}) => {
  const [phase, setPhase] = useState<Phase>('config');

  // Configurator state
  const [modeLabel, setModeLabel] = useState('Simulacro Oficial (80 preguntas)');
  const [ordinaryCount, setOrdinaryCount] = useState<number>(80);
  const [reserveCount, setReserveCount] = useState<number>(5);
  const [selectedBlocks, setSelectedBlocks] = useState<BlockId[]>([1, 2, 3, 4, 5, 6, 7]);
  const [onlyCases, setOnlyCases] = useState<boolean>(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(75);

  // Active exam state
  const [activeConfig, setActiveConfig] = useState<ExamConfig | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [ordinaryLen, setOrdinaryLen] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  // Results state
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [annulledCount, setAnnulledCount] = useState<number>(0);
  const [lastRecord, setLastRecord] = useState<ExamRecord | null>(null);

  const startExamWithConfig = useCallback(
    (cfg: ExamConfig) => {
      let pool = questions.filter((q) => cfg.blocks.includes(q.blockId));

      if (cfg.onlyCases) {
        const embeddedCases = pool.filter((q) => q.isCase);
        const generated = generateDeterministicCaseBatch(cfg.seed ?? 101, 12);
        pool = [...embeddedCases, ...generated];
      } else if (pool.length < cfg.ordinaryCount + cfg.reserveCount) {
        // Supplement deterministically with procedural cases if user requested 80-100 on narrow block filter
        const generated = generateDeterministicCaseBatch(cfg.seed ?? 202, 10);
        pool = [...pool, ...generated.filter((g) => cfg.blocks.includes(g.blockId))];
      }

      const shuffled = shuffleDeterministic(pool, cfg.seed);
      const totalNeeded = Math.min(shuffled.length, cfg.ordinaryCount + cfg.reserveCount);
      const selected = shuffled.slice(0, totalNeeded);
      const actualOrdinary = Math.min(cfg.ordinaryCount, selected.length);

      setActiveConfig(cfg);
      setExamQuestions(selected);
      setOrdinaryLen(actualOrdinary);
      setAnswers({});
      setFlagged({});
      setCurrentIdx(0);
      setElapsedSeconds(0);
      setSecondsRemaining(cfg.timeLimitMinutes !== null ? cfg.timeLimitMinutes * 60 : null);
      setShowConfirmSubmit(false);
      setAnnulledCount(0);
      setReviewFilter('all');
      setPhase('running');
      onExamActiveChange(true);
    },
    [questions, onExamActiveChange]
  );

  // Apply incoming shared challenge if present
  useEffect(() => {
    if (incomingChallenge && phase === 'config') {
      const cfg = incomingChallenge.config;
      setModeLabel(cfg.modeLabel);
      setOrdinaryCount(cfg.ordinaryCount);
      setReserveCount(cfg.reserveCount);
      setSelectedBlocks(cfg.blocks);
      setOnlyCases(cfg.onlyCases);
      setTimeLimitMinutes(cfg.timeLimitMinutes);
    }
  }, [incomingChallenge, phase]);

  const submitExam = useCallback(() => {
    if (phase !== 'running' || !activeConfig) return;

    const ordinaryQs = examQuestions.slice(0, ordinaryLen);
    let hits = 0;
    let misses = 0;
    let blank = 0;
    const failedIds: string[] = [];
    const blockBreakdown: Record<number, { hits: number; misses: number; blank: number }> = {};

    for (let i = 1; i <= 7; i++) {
      blockBreakdown[i] = { hits: 0, misses: 0, blank: 0 };
    }

    ordinaryQs.forEach((q, idx) => {
      const ans = answers[idx] ?? null;
      if (ans === null) {
        blank++;
        blockBreakdown[q.blockId].blank++;
      } else if (ans === q.correctIndex) {
        hits++;
        blockBreakdown[q.blockId].hits++;
      } else {
        misses++;
        blockBreakdown[q.blockId].misses++;
        failedIds.push(q.id);
      }
    });

    // Also log failed reserve questions to clinic if answered wrong
    examQuestions.slice(ordinaryLen).forEach((q, rIdx) => {
      const ans = answers[ordinaryLen + rIdx] ?? null;
      if (ans !== null && ans !== q.correctIndex) {
        failedIds.push(q.id);
      }
    });

    const summary = calculateMadridExamScore(hits, misses, blank);
    const xpEarned = Math.max(20, hits * 5);

    const record: ExamRecord = {
      id: `exam-${Date.now()}`,
      title: activeConfig.modeLabel,
      date: new Date().toISOString(),
      totalOrdinary: ordinaryLen,
      reserveCount: Math.max(0, examQuestions.length - ordinaryLen),
      hits,
      misses,
      blank,
      netScore: Number(summary.rawNetScore.toFixed(2)),
      maxScore: ordinaryLen,
      scaledOver10: Number(summary.scaledOver10.toFixed(2)),
      durationSeconds: elapsedSeconds,
      blockBreakdown,
    };

    setLastRecord(record);
    setPhase('results');
    onExamActiveChange(false);
    onFinishExam(record, failedIds, xpEarned);
  }, [
    phase,
    activeConfig,
    examQuestions,
    ordinaryLen,
    answers,
    elapsedSeconds,
    onExamActiveChange,
    onFinishExam,
  ]);

  // Timer tick during running exam
  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((e) => e + 1);
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && secondsRemaining === 0) {
      submitExam();
    }
  }, [phase, secondsRemaining, submitExam]);

  // Keyboard shortcuts during running exam
  useEffect(() => {
    if (phase !== 'running' || showConfirmSubmit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k === 'A' || k === '1') setAnswers((p) => ({ ...p, [currentIdx]: 0 }));
      if (k === 'B' || k === '2') setAnswers((p) => ({ ...p, [currentIdx]: 1 }));
      if (k === 'C' || k === '3') setAnswers((p) => ({ ...p, [currentIdx]: 2 }));
      if (k === 'D' || k === '4') setAnswers((p) => ({ ...p, [currentIdx]: 3 }));
      if (e.key === 'ArrowRight') {
        setCurrentIdx((i) => Math.min(examQuestions.length - 1, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, showConfirmSubmit, currentIdx, examQuestions.length]);

  const toggleBlock = (id: BlockId) => {
    setSelectedBlocks((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((b) => b !== id) : prev;
      }
      return [...prev, id].sort((a, b) => a - b);
    });
  };

  const applyPreset = (
    label: string,
    count: number,
    reserves: number,
    minutes: number | null,
    casesOnly = false
  ) => {
    setModeLabel(label);
    setOrdinaryCount(count);
    setReserveCount(reserves);
    setTimeLimitMinutes(minutes);
    setOnlyCases(casesOnly);
    setSelectedBlocks([1, 2, 3, 4, 5, 6, 7]);
  };

  // Dynamic reserve substitution calculation in results
  const simulatedSummary = useMemo(() => {
    if (phase !== 'results') return null;
    const maxReserveAvailable = Math.max(0, examQuestions.length - ordinaryLen);
    const effectiveAnnulled = Math.min(annulledCount, maxReserveAvailable);

    const activeIndices: number[] = [];
    // Active ordinary questions excluding first effectiveAnnulled (simulated as annulled)
    for (let i = effectiveAnnulled; i < ordinaryLen; i++) {
      activeIndices.push(i);
    }
    // Substitute from reserve in order
    for (let r = 0; r < effectiveAnnulled; r++) {
      activeIndices.push(ordinaryLen + r);
    }

    let hits = 0;
    let misses = 0;
    let blank = 0;

    activeIndices.forEach((idx) => {
      const q = examQuestions[idx];
      const ans = answers[idx] ?? null;
      if (ans === null) blank++;
      else if (ans === q.correctIndex) hits++;
      else misses++;
    });

    return {
      ...calculateMadridExamScore(hits, misses, blank),
      effectiveAnnulled,
      maxReserveAvailable,
    };
  }, [phase, examQuestions, ordinaryLen, annulledCount, answers]);

  // 1. CONFIGURATOR VIEW
  if (phase === 'config') {
    const availableCount = onlyCases
      ? questions.filter((q) => selectedBlocks.includes(q.blockId) && q.isCase).length + 12
      : questions.filter((q) => selectedBlocks.includes(q.blockId)).length;

    return (
      <div className="space-y-6">
        {incomingChallenge && (
          <div className="rounded-xl border border-[#1E3A8A]/30 bg-[#EFF6FF] p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#1E3A8A]">
                Reto recibido por enlace URL
              </p>
              <h2 className="mt-0.5 text-base font-bold text-[#0F172A]">
                {incomingChallenge.config.modeLabel} ({incomingChallenge.config.ordinaryCount} preguntas
                {incomingChallenge.config.reserveCount > 0
                  ? ` + ${incomingChallenge.config.reserveCount} reserva`
                  : ''}
                )
              </h2>
              {incomingChallenge.result && (
                <p className="mt-1 text-sm text-[#334155] tabular-nums">
                  Marca a batir: <strong>{formatScore(incomingChallenge.result.netScore)} pts netos</strong>{' '}
                  ({formatScore(incomingChallenge.result.scaledOver10)}/10 · {incomingChallenge.result.hits} aciertos,{' '}
                  {incomingChallenge.result.misses} fallos)
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startExamWithConfig(incomingChallenge.config)}
                className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
              >
                Aceptar mismo examen
              </button>
              <button
                type="button"
                onClick={onClearIncomingChallenge}
                className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#9F1239]">
                Fórmula Ayuntamiento de Madrid · 4 alternativas A/B/C/D
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                Simulador de Examen Municipal (Penalización -1/3)
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#475569]">
                Configura pruebas idénticas al ejercicio oficial de Auxiliar Administrativo (C2):
                cada error resta 1/3 del valor de un acierto y las preguntas en blanco no penalizan.
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-right tabular-nums">
              <div className="text-xs text-[#64748B]">Fórmula de corrección</div>
              <div className="mt-0.5 text-sm font-bold text-[#0F172A]">
                Puntuación = Aciertos − (Fallos / 3)
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-6">
            <h2 className="text-xs font-bold text-[#64748B]">Formatos de prueba rápidos</h2>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Test Exprés (25 preg.)', count: 25, res: 0, mins: 25, cases: false },
                { label: 'Test Medio (50 preg.)', count: 50, res: 3, mins: 45, cases: false },
                { label: 'Simulacro Oficial (80 preg.)', count: 80, res: 5, mins: 75, cases: false },
                { label: 'Simulacro Largo (100 preg.)', count: 100, res: 5, mins: 90, cases: false },
                { label: 'Supuestos de Oficina (25 preg.)', count: 25, res: 0, mins: 30, cases: true },
              ].map((p) => {
                const active =
                  ordinaryCount === p.count &&
                  reserveCount === p.res &&
                  onlyCases === p.cases;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.label, p.count, p.res, p.mins, p.cases)}
                    className={`rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-[#1E3A8A] bg-[#EFF6FF]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#94A3B8]'
                    }`}
                  >
                    <div className="text-sm font-bold text-[#0F172A]">{p.label}</div>
                    <div className="mt-1 text-xs text-[#475569] tabular-nums">
                      {p.res > 0 ? `+${p.res} reserva · ` : ''}
                      {p.mins} min
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Controls */}
          <div className="mt-6 grid gap-6 border-t border-[#E2E8F0] pt-6 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#334155]">
                Preguntas ordinarias
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[25, 50, 80, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setOrdinaryCount(n)}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-semibold tabular-nums cursor-pointer ${
                      ordinaryCount === n
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                        : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155]">
                Preguntas de reserva adicionales
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[0, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReserveCount(r)}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-semibold tabular-nums cursor-pointer ${
                      reserveCount === r
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                        : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {r === 0 ? 'Sin reserva' : `+${r} reserva`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155]">
                Cronómetro
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: 'Sin límite', value: null },
                  { label: '25 min', value: 25 },
                  { label: '45 min', value: 45 },
                  { label: '75 min', value: 75 },
                  { label: '90 min', value: 90 },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTimeLimitMinutes(t.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold tabular-nums cursor-pointer ${
                      timeLimitMinutes === t.value
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                        : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Block filter */}
          <div className="mt-6 border-t border-[#E2E8F0] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#334155]">
                Bloques incluidos en el cuestionario ({selectedBlocks.length}/7)
              </span>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedBlocks([1, 2, 3, 4, 5, 6, 7])}
                  className="font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
                >
                  Seleccionar todos
                </button>
                <label className="inline-flex items-center gap-1.5 text-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyCases}
                    onChange={(e) => setOnlyCases(e.target.checked)}
                    className="h-4 w-4 rounded border-[#CBD5E1] accent-[#1E3A8A]"
                  />
                  <span>Solo supuestos y casos prácticos</span>
                </label>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SYLLABUS_BLOCKS.map((b) => {
                const active = selectedBlocks.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBlock(b.id)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                      active
                        ? 'border-[#1E3A8A] bg-[#EFF6FF] text-[#0F172A] font-semibold'
                        : 'border-[#E2E8F0] bg-white text-[#64748B]'
                    }`}
                  >
                    {b.code} · {b.shortTitle}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E2E8F0] pt-6">
            <div className="text-xs text-[#475569] tabular-nums">
              Banco disponible en tu selección: <strong>{availableCount}</strong> preguntas
              {availableCount < ordinaryCount + reserveCount &&
                ' (se completará hasta el máximo disponible del filtro seleccionado)'}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onShareExamPayload({
                    type: 'challenge',
                    config: {
                      modeLabel,
                      ordinaryCount,
                      reserveCount,
                      blocks: selectedBlocks,
                      onlyCases,
                      timeLimitMinutes,
                      seed: Math.floor(Date.now() % 1000000),
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                <span>Copiar enlace de este reto</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  startExamWithConfig({
                    modeLabel,
                    ordinaryCount,
                    reserveCount,
                    blocks: selectedBlocks,
                    onlyCases,
                    timeLimitMinutes,
                    seed: Math.floor(Date.now() % 1000000),
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>Comenzar simulacro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Exam History Table */}
        {examHistory.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <h2 className="text-base font-bold text-[#0F172A]">
              Historial reciente de simulacros
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="py-2 pr-4 font-semibold">Prueba</th>
                    <th className="py-2 px-3 font-semibold">Aciertos</th>
                    <th className="py-2 px-3 font-semibold">Fallos</th>
                    <th className="py-2 px-3 font-semibold">Blanco</th>
                    <th className="py-2 px-3 font-semibold">Neta (-1/3)</th>
                    <th className="py-2 pl-3 font-semibold">Sobre 10</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] tabular-nums">
                  {examHistory.slice(0, 8).map((rec) => (
                    <tr key={rec.id}>
                      <td className="py-2.5 pr-4 font-medium text-[#0F172A]">
                        {rec.title}
                        <span className="ml-2 text-xs text-[#64748B]">
                          {new Date(rec.date).toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#059669] font-semibold">{rec.hits}</td>
                      <td className="py-2.5 px-3 text-[#DC2626] font-semibold">{rec.misses}</td>
                      <td className="py-2.5 px-3 text-[#64748B]">{rec.blank}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A]">
                        {formatScore(rec.netScore)}/{rec.maxScore}
                      </td>
                      <td className="py-2.5 pl-3 font-bold text-[#1E3A8A]">
                        {formatScore(rec.scaledOver10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. RUNNING EXAM VIEW (Distraction-free, no ads)
  if (phase === 'running' && examQuestions.length > 0) {
    const q = examQuestions[currentIdx];
    const isReserve = currentIdx >= ordinaryLen;
    const reserveNumber = currentIdx - ordinaryLen + 1;
    const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
    const unansweredOrdinary = Array.from({ length: ordinaryLen }).filter(
      (_, i) => answers[i] === null || answers[i] === undefined
    ).length;

    return (
      <div className="space-y-4">
        {/* Exam Status Strip */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#64748B]">
              {activeConfig?.modeLabel} · Penalización -1/3 por fallo
            </div>
            <div className="text-sm font-bold text-[#0F172A] tabular-nums">
              {isReserve
                ? `Pregunta de Reserva R${reserveNumber} (sustitución en caso de anulación)`
                : `Pregunta ${currentIdx + 1} de ${ordinaryLen}`}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-[#475569] tabular-nums">
              Respondidas: {answeredCount}/{examQuestions.length}
            </div>
            {secondsRemaining !== null ? (
              <div
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
                  secondsRemaining <= 180
                    ? 'bg-[#FEF2F2] text-[#DC2626]'
                    : 'bg-[#EFF6FF] text-[#1E3A8A]'
                }`}
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{formatDuration(secondsRemaining)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-xs font-semibold text-[#334155] tabular-nums">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sin límite ({formatDuration(elapsedSeconds)})</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="rounded-lg bg-[#9F1239] px-4 py-2 text-xs font-semibold text-white hover:bg-[#881337] cursor-pointer"
            >
              Finalizar y corregir
            </button>
          </div>
        </div>

        {/* Confirm Modal Inline */}
        {showConfirmSubmit && (
          <div className="rounded-xl border border-[#D97706] bg-[#FFFBEB] p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">
                  ¿Finalizar y corregir el simulacro ahora?
                </h2>
                <p className="mt-1 text-xs text-[#475569] tabular-nums">
                  Has dejado {unansweredOrdinary} preguntas ordinarias en blanco (no penalizan).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Seguir revisando
              </button>
              <button
                type="button"
                onClick={submitExam}
                className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
              >
                Confirmar entrega
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
          {/* Main Question Area */}
          <div className="lg:col-span-8 rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[#64748B]">
                Bloque {q.blockId} · {q.topic}
                {isReserve && ' · Reserva'}
              </div>
              <button
                type="button"
                onClick={() =>
                  setFlagged((p) => ({ ...p, [currentIdx]: !p[currentIdx] }))
                }
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  flagged[currentIdx]
                    ? 'border-[#D97706] bg-[#FFFBEB] text-[#B45309]'
                    : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{flagged[currentIdx] ? 'Marcada duda' : 'Marcar duda'}</span>
              </button>
            </div>

            <h2 className="mt-3 text-base sm:text-lg font-bold leading-snug text-[#0F172A]">
              {q.question}
            </h2>

            <div className="mt-5 grid gap-3">
              {q.options.map((opt, oIdx) => {
                const isChosen = answers[currentIdx] === oIdx;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentIdx]: prev[currentIdx] === oIdx ? null : oIdx,
                      }))
                    }
                    className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors min-h-[54px] cursor-pointer ${
                      isChosen
                        ? 'border-[#1E3A8A] bg-[#EFF6FF] text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8] hover:bg-[#F8FAFC] text-[#0F172A]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                        isChosen
                          ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                          : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#334155]'
                      }`}
                    >
                      {OPTION_LETTERS[oIdx]}
                    </span>
                    <span className="flex-1 text-sm sm:text-[15px] leading-relaxed font-medium">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
              <button
                type="button"
                disabled={answers[currentIdx] === null || answers[currentIdx] === undefined}
                onClick={() => setAnswers((p) => ({ ...p, [currentIdx]: null }))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dejar en blanco (0 penalización)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={currentIdx >= examQuestions.length - 1}
                  onClick={() =>
                    setCurrentIdx((i) => Math.min(examQuestions.length - 1, i + 1))
                  }
                  className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172D6E] disabled:opacity-40 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigator Grid */}
          <aside className="lg:col-span-4 rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#334155]">Hoja de respuestas</h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Pulsa un número para saltar directamente.
            </p>
            <div className="mt-3 grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2 tabular-nums">
              {examQuestions.map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = answers[idx] !== null && answers[idx] !== undefined;
                const isFlag = Boolean(flagged[idx]);
                const isRes = idx >= ordinaryLen;

                let cellClass = 'border-[#E2E8F0] bg-white text-[#475569]';
                if (isAnswered) cellClass = 'border-[#1E3A8A] bg-[#1E3A8A] text-white';
                if (isFlag) cellClass = 'border-[#D97706] bg-[#FFFBEB] text-[#B45309]';
                if (isCurrent) cellClass += ' ring-2 ring-[#9F1239] ring-offset-1';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-md border text-xs font-bold transition-colors cursor-pointer ${cellClass}`}
                  >
                    {isRes ? `R${idx - ordinaryLen + 1}` : idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[#64748B]">
              <span>Azul: contestada</span>
              <span>·</span>
              <span>Ámbar: duda</span>
              <span>·</span>
              <span>Blanco: sin responder</span>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // 3. RESULTS & REVIEW VIEW
  if (phase === 'results' && lastRecord && simulatedSummary) {
    const filteredList = examQuestions
      .map((q, idx) => ({ q, idx, isReserve: idx >= ordinaryLen, selected: answers[idx] ?? null }))
      .filter((item) => {
        if (reviewFilter === 'wrong') return item.selected !== null && item.selected !== item.q.correctIndex;
        if (reviewFilter === 'blank') return item.selected === null;
        if (reviewFilter === 'correct') return item.selected === item.q.correctIndex;
        return true;
      });

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 print-only-clean">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#1E3A8A]">
                Acta de corrección oficial (-1/3 por error)
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {lastRecord.title}
              </h2>
              <p className="mt-1 text-xs text-[#64748B] tabular-nums">
                Duración: {formatDuration(lastRecord.durationSeconds)} · {ordinaryLen} ordinarias
                {simulatedSummary.maxReserveAvailable > 0
                  ? ` + ${simulatedSummary.maxReserveAvailable} de reserva`
                  : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => {
                  if (!activeConfig) return;
                  onShareExamPayload({
                    type: 'result',
                    config: activeConfig,
                    result: {
                      hits: lastRecord.hits,
                      misses: lastRecord.misses,
                      blank: lastRecord.blank,
                      netScore: lastRecord.netScore,
                      maxScore: lastRecord.maxScore,
                      scaledOver10: lastRecord.scaledOver10,
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Compartir resultado</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Imprimir / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPhase('config')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Nuevo simulacro</span>
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 tabular-nums">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs text-[#64748B]">Nota sobre 10</div>
              <div className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">
                {formatScore(simulatedSummary.scaledOver10)}
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs text-[#64748B]">Puntuación neta</div>
              <div className="mt-1 text-2xl font-extrabold text-[#0F172A]">
                {formatScore(simulatedSummary.rawNetScore)}/{simulatedSummary.totalOrdinary}
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs text-[#64748B]">Aciertos (+1)</div>
              <div className="mt-1 text-2xl font-extrabold text-[#059669]">
                {simulatedSummary.hits}
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs text-[#64748B]">Fallos (-1/3)</div>
              <div className="mt-1 text-2xl font-extrabold text-[#DC2626]">
                {simulatedSummary.misses}
              </div>
              <div className="text-[11px] text-[#DC2626]">
                −{formatScore(simulatedSummary.penaltyPoints)} pts
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs text-[#64748B]">En blanco (0)</div>
              <div className="mt-1 text-2xl font-extrabold text-[#475569]">
                {simulatedSummary.blank}
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs text-[#64748B]">Tasa de acierto</div>
              <div className="mt-1 text-2xl font-extrabold text-[#0F172A]">
                {Math.round(simulatedSummary.accuracyPercent)}%
              </div>
            </div>
          </div>

          {/* Reserve Simulation Control */}
          {simulatedSummary.maxReserveAvailable > 0 && (
            <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="text-xs text-[#334155]">
                <strong>Simulación de preguntas de reserva:</strong> el tribunal sustituye las
                preguntas anuladas por las de reserva en orden correlativo (R1, R2...).
              </div>
              <div className="flex items-center gap-2 text-xs tabular-nums">
                <span>Anuladas simuladas:</span>
                {Array.from({ length: simulatedSummary.maxReserveAvailable + 1 }).map((_, n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnnulledCount(n)}
                    className={`rounded-md border px-2.5 py-1 font-semibold cursor-pointer ${
                      annulledCount === n
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                        : 'border-[#CBD5E1] bg-white text-[#334155]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Block Breakdown */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#0F172A]">Desglose por bloques del temario</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 tabular-nums">
              {SYLLABUS_BLOCKS.map((b) => {
                const st = lastRecord.blockBreakdown[b.id];
                if (!st || st.hits + st.misses + st.blank === 0) return null;
                return (
                  <div
                    key={b.id}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs"
                  >
                    <div className="font-bold text-[#0F172A]">
                      {b.code} · {b.shortTitle}
                    </div>
                    <div className="mt-1 text-[#475569]">
                      <span className="text-[#059669] font-semibold">{st.hits} aciertos</span> ·{' '}
                      <span className="text-[#DC2626] font-semibold">{st.misses} fallos</span> ·{' '}
                      <span>{st.blank} blanco</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question by Question Review */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 print-only-clean">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[#0F172A]">
              Revisión pregunta por pregunta
            </h3>
            <div className="flex flex-wrap gap-1.5 rounded-lg bg-[#F1F5F9] p-1 text-xs font-semibold no-print">
              {(
                [
                  { id: 'all', label: 'Todas' },
                  { id: 'wrong', label: 'Falladas' },
                  { id: 'blank', label: 'En blanco' },
                  { id: 'correct', label: 'Acertadas' },
                ] as { id: ReviewFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReviewFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                    reviewFilter === tab.id
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {filteredList.map(({ q, idx, isReserve, selected }) => {
              const isCorrect = selected === q.correctIndex;
              const isBlank = selected === null;

              return (
                <div
                  key={`${q.id}-${idx}`}
                  className="rounded-xl border border-[#E2E8F0] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#475569] tabular-nums">
                      {isReserve ? `Reserva R${idx - ordinaryLen + 1}` : `Pregunta ${idx + 1}`} ·{' '}
                      Bloque {q.blockId} · {q.topic}
                    </span>

                    {isBlank ? (
                      <span className="font-semibold text-[#64748B]">En blanco (0 pts)</span>
                    ) : isCorrect ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#059669]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Acierto (+1)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#DC2626]">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Fallo (-1/3) · Enviada a Clínica</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm sm:text-base font-bold text-[#0F172A]">
                    {q.question}
                  </p>

                  <div className="mt-3 grid gap-2 text-xs sm:text-sm">
                    {q.options.map((opt, oIdx) => {
                      const isRightOpt = oIdx === q.correctIndex;
                      const isUserOpt = oIdx === selected;
                      let cls = 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]';
                      if (isRightOpt) cls = 'border-[#059669] bg-[#ECFDF5] text-[#065F46] font-semibold';
                      else if (isUserOpt && !isRightOpt)
                        cls = 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B] font-semibold';

                      return (
                        <div key={oIdx} className={`rounded-lg border px-3 py-2 ${cls}`}>
                          <span className="font-bold mr-2">{OPTION_LETTERS[oIdx]}.</span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 rounded-lg bg-[#F8FAFC] p-3 text-xs leading-relaxed text-[#334155]">
                    <span className="font-bold text-[#1E3A8A]">{q.citation}: </span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

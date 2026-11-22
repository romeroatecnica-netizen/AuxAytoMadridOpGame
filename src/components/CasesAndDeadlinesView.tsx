import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Scale,
  XCircle,
} from 'lucide-react';
import { Question } from '../types';
import {
  computeAdministrativeDeadline,
  DeadlineUnit,
  formatSpanishDate,
  generateDeterministicCaseBatch,
} from '../utils/deadlines';
import { calculateMadridExamScore, formatScore } from '../utils/scoring';

type Tab = 'plazos' | 'baremo' | 'generador';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const CasesAndDeadlinesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('plazos');

  // 1. Deadline Calculator state
  const [notifDate, setNotifDate] = useState('2026-05-13');
  const [amount, setAmount] = useState(5);
  const [unit, setUnit] = useState<DeadlineUnit>('habiles');

  const deadlineResult = useMemo(
    () => computeAdministrativeDeadline(notifDate || '2026-05-13', Math.max(1, amount), unit),
    [notifDate, amount, unit]
  );

  // 2. Penalty Simulator state
  const [simTotal, setSimTotal] = useState(80);
  const [simHits, setSimHits] = useState(56);
  const [simMisses, setSimMisses] = useState(15);

  const clampedHits = Math.min(simHits, simTotal);
  const clampedMisses = Math.min(simMisses, simTotal - clampedHits);
  const simBlank = Math.max(0, simTotal - clampedHits - clampedMisses);
  const scoreSummary = useMemo(
    () => calculateMadridExamScore(clampedHits, clampedMisses, simBlank),
    [clampedHits, clampedMisses, simBlank]
  );

  // 3. Deterministic Practice Generator state
  const [seed, setSeed] = useState(1);
  const [genAnswers, setGenAnswers] = useState<Record<string, number>>({});

  const generatedBatch: Question[] = useMemo(
    () => generateDeterministicCaseBatch(seed * 7, 6),
    [seed]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#1E3A8A]">
              Motor determinista · Art. 30 Ley 39/2015 y Baremo Ayuntamiento de Madrid
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              Casos Prácticos, Cómputo de Plazos y Calculadora -1/3
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#475569]">
              Simula cualquier plazo administrativo con el calendario oficial de festivos de Madrid
              capital, calcula el impacto matemático de los errores (-1/3) y resuelve supuestos
              generados de forma determinista.
            </p>
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('plazos')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition-colors cursor-pointer ${
                activeTab === 'plazos'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Calculadora de Plazos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('baremo')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition-colors cursor-pointer ${
                activeTab === 'baremo'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Scale className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Simulador -1/3</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('generador')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition-colors cursor-pointer ${
                activeTab === 'generador'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Supuestos Generados</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DEADLINE CALCULATOR */}
      {activeTab === 'plazos' && (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#0F172A]">Parámetros de notificación</h2>

            <div>
              <label htmlFor="notif-date" className="block text-xs font-bold text-[#334155]">
                Fecha de notificación o publicación
              </label>
              <input
                id="notif-date"
                type="date"
                min="2025-01-01"
                max="2027-12-31"
                value={notifDate}
                onChange={(e) => setNotifDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="plazo-amount" className="block text-xs font-bold text-[#334155]">
                  Duración del plazo
                </label>
                <input
                  id="plazo-amount"
                  type="number"
                  min={1}
                  max={60}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                  className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="plazo-unit" className="block text-xs font-bold text-[#334155]">
                  Unidad legal
                </label>
                <select
                  id="plazo-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as DeadlineUnit)}
                  className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
                >
                  <option value="habiles">Días hábiles</option>
                  <option value="naturales">Días naturales</option>
                  <option value="meses">Meses</option>
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#334155]">
                Escenarios típicos de examen
              </span>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setNotifDate('2026-05-13');
                    setAmount(5);
                    setUnit('habiles');
                  }}
                  className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 font-medium hover:border-[#1E3A8A] cursor-pointer"
                >
                  San Isidro (15 mayo)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotifDate('2026-01-31');
                    setAmount(1);
                    setUnit('meses');
                  }}
                  className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 font-medium hover:border-[#1E3A8A] cursor-pointer"
                >
                  31 enero + 1 mes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotifDate('2026-11-06');
                    setAmount(10);
                    setUnit('habiles');
                  }}
                  className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 font-medium hover:border-[#1E3A8A] cursor-pointer"
                >
                  Almudena (9 nov)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotifDate('2026-06-05');
                    setAmount(10);
                    setUnit('naturales');
                  }}
                  className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 font-medium hover:border-[#1E3A8A] cursor-pointer"
                >
                  Rechazo notif. (10 nat.)
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#1E3A8A]/25 bg-[#EFF6FF] p-4">
              <div className="text-xs font-semibold text-[#1E3A8A]">
                Último día válido del plazo (Madrid)
              </div>
              <div className="mt-1 text-lg font-extrabold text-[#0F172A]">
                {formatSpanishDate(deadlineResult.endDate)}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#334155]">
                {deadlineResult.legalBasis}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-[#E2E8F0] bg-white p-6">
            <h2 className="text-lg font-bold text-[#0F172A]">
              Traza día a día según el calendario de Madrid
            </h2>
            <p className="mt-1 text-xs text-[#64748B]">
              Sábados, domingos y festivos nacionales, autonómicos (2 mayo) y locales (15 mayo San
              Isidro y 9 noviembre La Almudena) quedan excluidos en días hábiles.
            </p>

            <div className="mt-4 space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {deadlineResult.steps.map((step, i) => {
                let rowStyle = 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]';
                if (step.status === 'inhabil') {
                  rowStyle = 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]';
                } else if (step.status === 'vencimiento' || step.status === 'prorroga') {
                  rowStyle = 'border-[#059669] bg-[#ECFDF5] text-[#065F46] font-semibold';
                } else if (step.status === 'inicio') {
                  rowStyle = 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]';
                }

                return (
                  <div
                    key={`${step.dateIso}-${i}`}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${rowStyle}`}
                  >
                    <span className="font-semibold">{step.label}</span>
                    <span>{step.note}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENALTY -1/3 SIMULATOR */}
      {activeTab === 'baremo' && (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#0F172A]">
              Simulador de puntuación neta (Penalización -1/3)
            </h2>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#334155] tabular-nums">
                <span>Total preguntas ordinarias</span>
                <span>{simTotal} preguntas</span>
              </div>
              <div className="mt-2 flex gap-2">
                {[25, 50, 80, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setSimTotal(n);
                      setSimHits(Math.round(n * 0.7));
                      setSimMisses(Math.round(n * 0.15));
                    }}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold tabular-nums cursor-pointer ${
                      simTotal === n
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                        : 'border-[#CBD5E1] bg-white text-[#334155]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#059669] tabular-nums">
                <label htmlFor="slider-hits">Aciertos (+1 cada uno)</label>
                <span>{clampedHits}</span>
              </div>
              <input
                id="slider-hits"
                type="range"
                min={0}
                max={simTotal}
                value={clampedHits}
                onChange={(e) => setSimHits(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#059669]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#DC2626] tabular-nums">
                <label htmlFor="slider-misses">Fallos (-1/3 cada uno)</label>
                <span>{clampedMisses} (penalización: −{formatScore(clampedMisses / 3)})</span>
              </div>
              <input
                id="slider-misses"
                type="range"
                min={0}
                max={simTotal - clampedHits}
                value={clampedMisses}
                onChange={(e) => setSimMisses(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#DC2626]"
              />
            </div>

            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs text-[#475569] tabular-nums">
              Preguntas dejadas en blanco: <strong>{simBlank}</strong> (0 puntos de penalización).
            </div>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#0F172A]">Resultado y estrategia de riesgo</h2>

            <div className="grid grid-cols-3 gap-3 tabular-nums">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="text-xs text-[#64748B]">Puntuación neta</div>
                <div className="mt-1 text-2xl font-extrabold text-[#0F172A]">
                  {formatScore(scoreSummary.rawNetScore)}
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="text-xs text-[#64748B]">Nota sobre 10</div>
                <div className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">
                  {formatScore(scoreSummary.scaledOver10)}
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="text-xs text-[#64748B]">Nota sobre 100</div>
                <div className="mt-1 text-2xl font-extrabold text-[#9F1239]">
                  {formatScore(scoreSummary.scaledOver100)}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2 text-xs leading-relaxed text-[#334155]">
              <div className="font-bold text-[#0F172A]">
                ¿Cuándo compensa arriesgar con penalización -1/3?
              </div>
              <p className="tabular-nums">
                • <strong>4 opciones posibles (puro azar):</strong> Esperanza matemática = (1/4 × 1) − (3/4 × 1/3) = <strong>0,00</strong>. No compensa arriesgar sin criterio.
              </p>
              <p className="tabular-nums">
                • <strong>Descartas 1 opción (dudas entre 3):</strong> Esperanza = (1/3 × 1) − (2/3 × 1/3) = <strong>+0,11 pts</strong>. Ligera ventaja estadística.
              </p>
              <p className="tabular-nums">
                • <strong>Descartas 2 opciones (dudas entre 2):</strong> Esperanza = (1/2 × 1) − (1/2 × 1/3) = <strong>+0,33 pts</strong>. Matemáticamente muy rentable contestar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DETERMINISTIC CASE GENERATOR */}
      {activeTab === 'generador' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Lote determinista de supuestos de plazos y baremo municipal
              </h2>
              <p className="text-xs text-[#64748B]">
                Generado al instante en tu navegador sin servidor ni IA (Lote #{seed}).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSeed((s) => s + 1);
                setGenAnswers({});
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Generar nuevo lote de casos</span>
            </button>
          </div>

          <div className="grid gap-4">
            {generatedBatch.map((q, idx) => {
              const chosen = genAnswers[q.id];
              const answered = chosen !== undefined;

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                >
                  <div className="text-xs font-semibold text-[#9F1239]">
                    Caso #{idx + 1} · {q.topic}
                  </div>
                  <h3 className="mt-1.5 text-sm sm:text-base font-bold text-[#0F172A]">
                    {q.question}
                  </h3>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oIdx) => {
                      const isRight = oIdx === q.correctIndex;
                      const isSelected = chosen === oIdx;

                      let cls =
                        'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1E3A8A] text-[#0F172A]';
                      if (answered) {
                        if (isRight) cls = 'border-[#059669] bg-[#ECFDF5] text-[#065F46] font-semibold';
                        else if (isSelected)
                          cls = 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B] font-semibold';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={answered}
                          onClick={() =>
                            setGenAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                          }
                          className={`flex items-start gap-2.5 rounded-lg border p-3 text-left text-xs sm:text-sm cursor-pointer disabled:cursor-default ${cls}`}
                        >
                          <span className="font-bold">{OPTION_LETTERS[oIdx]}.</span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {answered && (
                    <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-[#334155]">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        {chosen === q.correctIndex ? (
                          <span className="inline-flex items-center gap-1 text-[#059669]">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            Correcto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#DC2626]">
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            Incorrecto (la correcta es la {OPTION_LETTERS[q.correctIndex]})
                          </span>
                        )}
                        <span className="text-[#CBD5E1]">·</span>
                        <span className="text-[#1E3A8A]">{q.citation}</span>
                      </div>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Play, RotateCcw, Stethoscope } from 'lucide-react';
import { SYLLABUS_BLOCKS } from '../data/syllabus';
import { BlockId, Question, UserProgress } from '../types';

interface MistakeClinicViewProps {
  questions: Question[];
  progress: UserProgress;
  onPracticeMistakes: (blockFilter?: BlockId) => void;
  onMarkMastered: (questionId: string) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const MistakeClinicView: React.FC<MistakeClinicViewProps> = ({
  questions,
  progress,
  onPracticeMistakes,
  onMarkMastered,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<BlockId | 'all'>('all');
  const [showMastered, setShowMastered] = useState(false);

  const entries = useMemo(() => {
    const byId = new Map(questions.map((q) => [q.id, q]));
    return Object.values(progress.mistakes)
      .map((entry) => ({
        entry,
        question: byId.get(entry.questionId),
      }))
      .filter((x): x is { entry: typeof x.entry; question: Question } => Boolean(x.question))
      .sort((a, b) => b.entry.count - a.entry.count);
  }, [questions, progress.mistakes]);

  const activeEntries = entries.filter((e) => !e.entry.mastered);
  const masteredEntries = entries.filter((e) => e.entry.mastered);

  const visibleEntries = (showMastered ? masteredEntries : activeEntries).filter((e) =>
    selectedBlock === 'all' ? true : e.question.blockId === selectedBlock
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#9F1239]">
              Diagnóstico de errores · Citas normativas
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              Mi Clínica de Fallos
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#475569]">
              Cada pregunta fallada en la Ruta Duolingo o en los Simulacros se registra aquí
              automáticamente para evitar penalizaciones de -1/3 en el examen real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={activeEntries.length === 0}
              onClick={() =>
                onPracticeMistakes(selectedBlock === 'all' ? undefined : selectedBlock)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172D6E] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>
                Practicar fallos ({selectedBlock === 'all' ? activeEntries.length : visibleEntries.length})
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="text-xs text-[#64748B]">Pendientes de repaso</div>
            <div className="mt-1 text-2xl font-extrabold text-[#DC2626]">
              {activeEntries.length}
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="text-xs text-[#64748B]">Preguntas dominadas</div>
            <div className="mt-1 text-2xl font-extrabold text-[#059669]">
              {masteredEntries.length}
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 col-span-2">
            <div className="text-xs text-[#64748B]">Filtro por estado</div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowMastered(false)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  !showMastered
                    ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                    : 'border-[#CBD5E1] bg-white text-[#334155]'
                }`}
              >
                Activos ({activeEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setShowMastered(true)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  showMastered
                    ? 'border-[#059669] bg-[#059669] text-white'
                    : 'border-[#CBD5E1] bg-white text-[#334155]'
                }`}
              >
                Dominados ({masteredEntries.length})
              </button>
            </div>
          </div>
        </div>

        {/* Block filter */}
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedBlock('all')}
            className={`rounded-md border px-3 py-1.5 font-semibold cursor-pointer ${
              selectedBlock === 'all'
                ? 'border-[#1E3A8A] bg-[#EFF6FF] text-[#1E3A8A]'
                : 'border-[#E2E8F0] bg-white text-[#475569]'
            }`}
          >
            Todos los bloques
          </button>
          {SYLLABUS_BLOCKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBlock(b.id)}
              className={`rounded-md border px-3 py-1.5 font-semibold cursor-pointer ${
                selectedBlock === b.id
                  ? 'border-[#1E3A8A] bg-[#EFF6FF] text-[#1E3A8A]'
                  : 'border-[#E2E8F0] bg-white text-[#475569]'
              }`}
            >
              {b.code}
            </button>
          ))}
        </div>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-10 text-center">
          <Stethoscope className="mx-auto h-8 w-8 text-[#94A3B8]" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-[#0F172A]">
            {showMastered
              ? 'Aún no has marcado fallos como dominados'
              : 'Tu clínica de fallos está limpia en este filtro'}
          </h2>
          <p className="mt-1 text-sm text-[#475569]">
            Completa lecciones de la Ruta Duolingo o realiza un Simulacro para detectar puntos
            débiles y reforzarlos aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleEntries.map(({ entry, question }) => (
            <div
              key={question.id}
              className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[#64748B]">
                  <span className="font-bold text-[#1E3A8A]">Bloque {question.blockId}</span>
                  <span className="mx-1.5">·</span>
                  <span>{question.topic}</span>
                  <span className="mx-1.5">·</span>
                  <span className="font-semibold text-[#DC2626] tabular-nums">
                    Fallada {entry.count} {entry.count === 1 ? 'vez' : 'veces'}
                  </span>
                </div>

                {!entry.mastered && (
                  <button
                    type="button"
                    onClick={() => onMarkMastered(question.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#059669]/40 bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#065F46] hover:bg-[#D1FAE5] cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Marcar como dominada</span>
                  </button>
                )}
              </div>

              <h3 className="mt-2 text-base font-bold text-[#0F172A]">{question.question}</h3>

              <div className="mt-3 rounded-lg border border-[#059669]/30 bg-[#ECFDF5] px-3.5 py-2.5 text-sm font-semibold text-[#065F46]">
                Respuesta correcta ({OPTION_LETTERS[question.correctIndex]}):{' '}
                {question.options[question.correctIndex]}
              </div>

              <div className="mt-3 text-xs leading-relaxed text-[#334155]">
                <span className="font-bold text-[#1E3A8A]">{question.citation}: </span>
                {question.explanation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

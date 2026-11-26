import React from 'react';
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Shield,
  Sparkles,
  Stethoscope,
  Swords,
} from 'lucide-react';
import { SYLLABUS_BLOCKS } from '../data/syllabus';
import { BlockId, MinigameType, Question, UserProgress } from '../types';

interface LearningPathViewProps {
  questions: Question[];
  progress: UserProgress;
  activeMistakeCount: number;
  onStartUnitLesson: (blockId: BlockId, unitId: string, unitTitle: string) => void;
  onStartMinigame: (type: MinigameType) => void;
  onToggleFreePractice: () => void;
  onRestoreShields: () => void;
  onGoToSimulator: () => void;
  onOpenChallengeModal: () => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  questions,
  progress,
  activeMistakeCount,
  onStartUnitLesson,
  onStartMinigame,
  onToggleFreePractice,
  onRestoreShields,
  onGoToSimulator,
  onOpenChallengeModal,
}) => {
  const totalLessons = SYLLABUS_BLOCKS.reduce((acc, b) => acc + b.units.length, 0);
  const completedCount = Object.keys(progress.completedLessons).length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero & Gamified Status Panel */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-[#9F1239]">
              Ayuntamiento de Madrid · Oposición Subgrupo C2 · 100 % determinista
            </p>
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] [text-wrap:balance]">
              Test Auxiliar Administrativo Ayuntamiento de Madrid y Entrenamiento Gamificado
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-[#475569]">
              Domina los 7 bloques oficiales del temario C2 con lecciones rápidas de 10 preguntas,
              citas normativas exactas, casos prácticos municipales y simulacros con penalización
              real de -1/3 por fallo.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGoToSimulator}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#172D6E] transition-colors cursor-pointer"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>Configurar simulacro oficial (-1/3)</span>
              </button>
              <button
                type="button"
                onClick={onOpenChallengeModal}
                className="inline-flex items-center gap-2 rounded-lg bg-[#9F1239] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#881337] transition-colors cursor-pointer"
              >
                <Swords className="h-4 w-4" aria-hidden="true" />
                <span>Retar por enlace</span>
              </button>
              <button
                type="button"
                onClick={onToggleFreePractice}
                className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <Shield className="h-4 w-4 text-[#9F1239]" aria-hidden="true" />
                <span>
                  {progress.freePracticeNoShields
                    ? 'Modo activo: Práctica libre sin vidas'
                    : 'Activar práctica libre sin vidas'}
                </span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Experiencia</span>
                <Sparkles className="h-4 w-4 text-[#1E3A8A]" aria-hidden="true" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#0F172A] tabular-nums">
                {progress.xp} XP
              </div>
              <div className="mt-1 text-xs text-[#64748B] tabular-nums">
                {questions.length} preguntas activas
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Racha diaria</span>
                <Flame className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#0F172A] tabular-nums">
                {progress.streakDays} {progress.streakDays === 1 ? 'día' : 'días'}
              </div>
              <div className="mt-1 text-xs text-[#64748B]">Constancia registrada</div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Progreso Ruta</span>
                <Award className="h-4 w-4 text-[#059669]" aria-hidden="true" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#0F172A] tabular-nums">
                {overallPct}%
              </div>
              <div className="mt-1 text-xs text-[#64748B] tabular-nums">
                {completedCount} de {totalLessons} unidades
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Escudos</span>
                <Shield className="h-4 w-4 text-[#9F1239]" aria-hidden="true" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#0F172A] tabular-nums">
                {progress.freePracticeNoShields ? '∞ Libre' : `${progress.shields} / 5`}
              </div>
              {!progress.freePracticeNoShields && progress.shields < 5 ? (
                <button
                  type="button"
                  onClick={onRestoreShields}
                  className="mt-1 text-xs font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
                >
                  Recargar escudos
                </button>
              ) : (
                <div className="mt-1 text-xs text-[#64748B]">Listo para entrenar</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4 Minigames Strip */}
      <section aria-labelledby="minijuegos-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="minijuegos-heading" className="text-xl font-bold text-[#0F172A]">
            Retos rápidos y minijuegos de oposición
          </h2>
          <span className="text-xs text-[#64748B]">Sesiones breves de alto impacto</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => onStartMinigame('plazos60')}
            className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 text-left hover:border-[#1E3A8A] transition-colors cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E3A8A]">Contrarreloj</span>
                <Clock className="h-4 w-4 text-[#1E3A8A]" aria-hidden="true" />
              </div>
              <h3 className="mt-2 text-base font-bold text-[#0F172A]">
                Plazos y Leyes (60 s)
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                Responde el máximo número de plazos de la Ley 39/2015, TREBEP y LCREM en 60 segundos.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-[#1E3A8A]">Jugar ahora →</span>
          </button>

          <button
            type="button"
            onClick={() => onStartMinigame('trampas')}
            className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 text-left hover:border-[#D97706] transition-colors cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#D97706]">Lectura fina</span>
                <AlertTriangle className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
              </div>
              <h3 className="mt-2 text-base font-bold text-[#0F172A]">
                Caza la trampa del enunciado
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                Entrena enunciados con «siempre», «únicamente», «salvo» y «en todo caso».
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-[#D97706]">Detectar trampas →</span>
          </button>

          <button
            type="button"
            onClick={() => onStartMinigame('capitalidad')}
            className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 text-left hover:border-[#9F1239] transition-colors cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9F1239]">Específico Madrid</span>
                <Building2 className="h-4 w-4 text-[#9F1239]" aria-hidden="true" />
              </div>
              <h3 className="mt-2 text-base font-bold text-[#0F172A]">
                Reto Ley 22/2006 y Distritos
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                Pleno, Alcaldía, Junta de Gobierno de Madrid, TEAMM y los 21 distritos.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-[#9F1239]">Iniciar reto Madrid →</span>
          </button>

          <button
            type="button"
            onClick={() => onStartMinigame('fallos')}
            className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 text-left hover:border-[#059669] transition-colors cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#059669]">Repaso dirigido</span>
                <Stethoscope className="h-4 w-4 text-[#059669]" aria-hidden="true" />
              </div>
              <h3 className="mt-2 text-base font-bold text-[#0F172A]">
                Repaso de Mis Fallos
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                {activeMistakeCount > 0
                  ? `Tienes ${activeMistakeCount} preguntas activas pendientes de consolidar.`
                  : 'Sin fallos pendientes: realiza un test de repaso mixto.'}
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-[#059669] tabular-nums">
              {activeMistakeCount > 0 ? `Repasar (${activeMistakeCount}) →` : 'Entrenar mixto →'}
            </span>
          </button>
        </div>
      </section>

      {/* Gamified 7-Block Learning Path */}
      <section aria-labelledby="ruta-bloques-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ruta-bloques-heading" className="text-xl font-bold text-[#0F172A]">
            Ruta por los 7 bloques del temario C2
          </h2>
          <span className="text-xs text-[#64748B]">
            Lecciones de 10 preguntas con cita normativa inmediata
          </span>
        </div>

        <div className="mt-4 space-y-5">
          {SYLLABUS_BLOCKS.map((block) => {
            const blockQuestionsCount = questions.filter((q) => q.blockId === block.id).length;
            const blockUnitsCompleted = block.units.filter(
              (u) => Boolean(progress.completedLessons[u.id])
            ).length;
            const blockPct = Math.round((blockUnitsCompleted / block.units.length) * 100);

            return (
              <div
                key={block.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                      <span className="font-bold text-[#1E3A8A]">{block.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{block.laws.join(' / ')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{blockQuestionsCount} preguntas</span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-[#0F172A]">{block.title}</h3>
                    <p className="mt-1 text-sm text-[#475569]">{block.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[#0F172A] tabular-nums">{blockPct}%</div>
                    <div className="text-xs text-[#64748B] tabular-nums">
                      {blockUnitsCompleted}/{block.units.length} niveles
                    </div>
                  </div>
                </div>

                {/* Units Step Path */}
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {block.units.map((unit, idx) => {
                    const record = progress.completedLessons[unit.id];
                    const isDone = Boolean(record);

                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => onStartUnitLesson(block.id, unit.id, `${block.code} · ${unit.title}`)}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                          isDone
                            ? 'border-[#059669]/40 bg-[#ECFDF5]/60 hover:border-[#059669]'
                            : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1E3A8A] hover:bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <span
                              className={
                                isDone ? 'text-[#059669]' : 'text-[#1E3A8A]'
                              }
                            >
                              Nivel {idx + 1}
                            </span>
                            <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
                            <span className="capitalize text-[#64748B]">{unit.difficulty}</span>
                          </div>
                          <div className="mt-1 text-sm font-bold text-[#0F172A]">
                            {unit.title}
                          </div>
                          <div className="mt-0.5 text-xs text-[#475569]">{unit.subtitle}</div>
                          {record && (
                            <div className="mt-2 text-xs font-semibold text-[#059669] tabular-nums">
                              Mejor marca: {record.bestHits}/{record.total}
                            </div>
                          )}
                        </div>

                        <span className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2
                              className="h-5 w-5 text-[#059669]"
                              aria-label="Nivel completado"
                            />
                          ) : (
                            <Play
                              className="h-5 w-5 text-[#1E3A8A]"
                              aria-label="Iniciar nivel"
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

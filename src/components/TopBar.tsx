import React from 'react';
import { Flame, Share2, Shield, Sparkles } from 'lucide-react';
import { AppView } from '../types';

interface TopBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  xp: number;
  streakDays: number;
  shields: number;
  freePracticeNoShields: boolean;
  mistakeCount: number;
  onShareChallenge: () => void;
  isFocusSessionActive: boolean;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'ruta', label: 'Ruta Duolingo' },
  { id: 'simulador', label: 'Simulador Test' },
  { id: 'casos', label: 'Casos y Plazos' },
  { id: 'clinica', label: 'Clínica de Fallos' },
  { id: 'temario', label: 'Temario C2' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onNavigate,
  xp,
  streakDays,
  shields,
  freePracticeNoShields,
  mistakeCount,
  onShareChallenge,
  isFocusSessionActive,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm no-print">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Zone 1: Brand wordmark (1 line) */}
          <button
            type="button"
            onClick={() => onNavigate('ruta')}
            className="flex items-center gap-2 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] rounded"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#1E3A8A] text-xs font-extrabold text-white font-display">
              AM
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-[#0F172A]">
              AuxMad<span className="text-[#9F1239]">OpGame</span>
            </span>
          </button>

          {/* Zone 2: Desktop Navigation */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center gap-5 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative py-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] rounded ${
                    isActive
                      ? 'text-[#1E3A8A] font-semibold'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                  {item.id === 'clinica' && mistakeCount > 0 && (
                    <span className="ml-1.5 text-xs font-semibold tabular-nums text-[#9F1239]">
                      ({mistakeCount})
                    </span>
                  )}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#1E3A8A]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Metrics + Share Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="hidden sm:flex items-center gap-3 text-xs font-semibold text-[#334155] tabular-nums"
              aria-label="Estadísticas de entrenamiento"
            >
              <span className="inline-flex items-center gap-1" title="Racha diaria">
                <Flame className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                <span>{streakDays}d</span>
              </span>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1" title="Experiencia acumulada">
                <Sparkles className="h-4 w-4 text-[#1E3A8A]" aria-hidden="true" />
                <span>{xp} XP</span>
              </span>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span
                className="inline-flex items-center gap-1"
                title={freePracticeNoShields ? 'Práctica libre sin vidas' : 'Vidas / Escudos disponibles'}
              >
                <Shield className="h-4 w-4 text-[#9F1239]" aria-hidden="true" />
                <span>{freePracticeNoShields ? 'Libre' : `${shields}/5`}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onShareChallenge}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#172D6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Compartir reto</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet compact navigation bar (hidden during active timed focus sessions to keep <=15% sticky height) */}
        {!isFocusSessionActive && (
          <nav
            aria-label="Navegación móvil"
            className="flex lg:hidden items-center gap-2 overflow-x-auto pb-2 pt-0.5 text-xs font-medium no-scrollbar"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white font-semibold'
                      : 'bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                  {item.id === 'clinica' && mistakeCount > 0 ? ` (${mistakeCount})` : ''}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Play,
  RefreshCw,
  Swords,
  X,
} from 'lucide-react';
import { ExamConfig, SharedChallengePayload } from '../types';
import {
  CHALLENGE_ROTATION_DECK,
  createChallengeFromTemplate,
  generateNextRotatingChallenge,
} from '../utils/challenges';
import { buildChallengeUrl } from '../utils/scoring';

interface ChallengeModalProps {
  isOpen: boolean;
  playerName: string;
  onChangePlayerName: (name: string) => void;
  onClose: () => void;
  onPlayAndChallenge: (config: ExamConfig, senderName: string) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  playerName,
  onChangePlayerName,
  onClose,
  onPlayAndChallenge,
}) => {
  const [draftConfig, setDraftConfig] = useState<ExamConfig>(() =>
    generateNextRotatingChallenge()
  );
  const [copied, setCopied] = useState(false);

  // Rotate to a fresh test each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftConfig((prev) => generateNextRotatingChallenge(prev.rotationIndex));
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const challengeUrl = useMemo(() => {
    const payload: SharedChallengePayload = {
      type: 'challenge',
      senderName: playerName.trim() || undefined,
      config: draftConfig,
    };
    return buildChallengeUrl(payload);
  }, [draftConfig, playerName]);

  if (!isOpen) return null;

  const activeTemplate =
    draftConfig.rotationIndex !== undefined
      ? CHALLENGE_ROTATION_DECK[draftConfig.rotationIndex]
      : CHALLENGE_ROTATION_DECK[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(challengeUrl);
    } catch {
      // Fallback: user can still copy from visible input
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const handleRotate = () => {
    setDraftConfig((prev) => generateNextRotatingChallenge(prev.rotationIndex));
    setCopied(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9F1239]/10 text-[#9F1239]">
              <Swords className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[#9F1239]">
                Duelo por enlace · Pruebas cambiantes
              </p>
              <h2
                id="challenge-modal-title"
                className="text-lg sm:text-xl font-extrabold text-[#0F172A]"
              >
                Retar a un compañero con prueba nueva
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de reto"
            className="rounded-lg border border-[#E2E8F0] p-2 text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alias */}
        <div className="mt-5">
          <label htmlFor="challenger-alias" className="block text-xs font-bold text-[#334155]">
            Tu nombre o alias para el reto (opcional)
          </label>
          <input
            id="challenger-alias"
            type="text"
            maxLength={28}
            placeholder="Ej. Lucía M. (Oposición C2)"
            value={playerName}
            onChange={(e) => onChangePlayerName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#1E3A8A] focus:outline-none"
          />
        </div>

        {/* Active Rotating Challenge Card */}
        <div className="mt-5 rounded-xl border border-[#1E3A8A]/25 bg-[#EFF6FF]/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#1E3A8A] tabular-nums">
              Reto {draftConfig.challengeId} · {activeTemplate?.tag}
            </span>
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E3A8A]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-[#EFF6FF] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cambiar prueba (Nuevo sorteo)</span>
            </button>
          </div>

          <h3 className="mt-2 text-base font-extrabold text-[#0F172A]">
            {draftConfig.modeLabel}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#475569]">
            {activeTemplate?.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#334155] tabular-nums">
            <span>{draftConfig.ordinaryCount} preguntas</span>
            {draftConfig.reserveCount > 0 && (
              <>
                <span className="text-[#94A3B8]" aria-hidden="true">·</span>
                <span>+{draftConfig.reserveCount} reserva</span>
              </>
            )}
            <span className="text-[#94A3B8]" aria-hidden="true">·</span>
            <span>{draftConfig.timeLimitMinutes} min</span>
            <span className="text-[#94A3B8]" aria-hidden="true">·</span>
            <span>Bloques: {draftConfig.blocks.join(', ')}</span>
            <span className="text-[#94A3B8]" aria-hidden="true">·</span>
            <span className="text-[#DC2626]">Penalización -1/3</span>
          </div>
        </div>

        {/* Manual Rotation Deck Switcher */}
        <div className="mt-4">
          <div className="text-xs font-bold text-[#64748B]">
            O elige el tipo de prueba para este reto:
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CHALLENGE_ROTATION_DECK.map((tpl) => {
              const isSelected = draftConfig.rotationIndex === tpl.rotationIndex;
              return (
                <button
                  key={tpl.rotationIndex}
                  type="button"
                  onClick={() => {
                    setDraftConfig(createChallengeFromTemplate(tpl.rotationIndex));
                    setCopied(false);
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white font-semibold'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="truncate">{tpl.tag}</div>
                  <div
                    className={`text-[11px] tabular-nums ${
                      isSelected ? 'text-white/80' : 'text-[#64748B]'
                    }`}
                  >
                    {tpl.ordinaryCount} preg · {tpl.timeLimitMinutes}m
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Link Preview & Actions */}
        <div className="mt-5 border-t border-[#E2E8F0] pt-5 space-y-3">
          <label htmlFor="challenge-url-box" className="block text-xs font-bold text-[#334155]">
            Enlace único del reto (mismo examen exacto para ambos)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="challenge-url-box"
              type="text"
              readOnly
              value={challengeUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-mono text-[#334155]"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                  <span className="text-[#059669]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E3A8A] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1E3A8A] hover:bg-[#EFF6FF] cursor-pointer"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>{copied ? 'Enlace copiado al portapapeles' : 'Copiar enlace y retar ya'}</span>
            </button>

            <button
              type="button"
              onClick={() => onPlayAndChallenge(draftConfig, playerName.trim())}
              className="inline-flex items-center gap-2 rounded-lg bg-[#9F1239] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#881337] cursor-pointer"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>Jugar primero y fijar mi marca</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

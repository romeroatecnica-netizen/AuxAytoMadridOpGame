import { Question } from '../types';
import { calculateMadridExamScore, formatScore } from './scoring';

export type DeadlineUnit = 'habiles' | 'naturales' | 'meses';

export interface HolidayInfo {
  date: string; // YYYY-MM-DD
  label: string;
}

// Festivos oficiales en Madrid capital (nacionales + Comunidad de Madrid + locales)
export const MADRID_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-01-01': 'Año Nuevo',
  '2025-01-06': 'Epifanía del Señor (Reyes)',
  '2025-04-17': 'Jueves Santo (CM)',
  '2025-04-18': 'Viernes Santo',
  '2025-05-01': 'Fiesta del Trabajo',
  '2025-05-02': 'Fiesta de la Comunidad de Madrid',
  '2025-05-15': 'San Isidro Labrador (Madrid capital)',
  '2025-07-25': 'Santiago Apóstol (CM)',
  '2025-08-15': 'Asunción de la Virgen',
  '2025-11-01': 'Todos los Santos',
  '2025-11-10': 'Traslado Nuestra Señora de la Almudena (Madrid capital)',
  '2025-12-06': 'Día de la Constitución Española',
  '2025-12-08': 'Inmaculada Concepción',
  '2025-12-25': 'Natividad del Señor',
  // 2026
  '2026-01-01': 'Año Nuevo',
  '2026-01-06': 'Epifanía del Señor (Reyes)',
  '2026-04-02': 'Jueves Santo (CM)',
  '2026-04-03': 'Viernes Santo',
  '2026-05-01': 'Fiesta del Trabajo',
  '2026-05-02': 'Fiesta de la Comunidad de Madrid',
  '2026-05-15': 'San Isidro Labrador (Madrid capital)',
  '2026-08-15': 'Asunción de la Virgen',
  '2026-10-12': 'Fiesta Nacional de España',
  '2026-11-02': 'Traslado Todos los Santos (CM)',
  '2026-11-09': 'Nuestra Señora de la Almudena (Madrid capital)',
  '2026-12-07': 'Traslado Día de la Constitución (CM)',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Natividad del Señor',
  // 2027
  '2027-01-01': 'Año Nuevo',
  '2027-01-06': 'Epifanía del Señor (Reyes)',
  '2027-03-25': 'Jueves Santo (CM)',
  '2027-03-26': 'Viernes Santo',
  '2027-05-01': 'Fiesta del Trabajo',
  '2027-05-03': 'Traslado Fiesta de la Comunidad de Madrid',
  '2027-05-15': 'San Isidro Labrador (Madrid capital)',
  '2027-08-16': 'Traslado Asunción de la Virgen',
  '2027-10-12': 'Fiesta Nacional de España',
  '2027-11-01': 'Todos los Santos',
  '2027-11-09': 'Nuestra Señora de la Almudena (Madrid capital)',
  '2027-12-06': 'Día de la Constitución Española',
  '2027-12-08': 'Inmaculada Concepción',
  '2027-12-25': 'Natividad del Señor',
};

const WEEKDAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function formatSpanishDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()} (${WEEKDAYS_ES[date.getDay()]})`;
}

export function formatShortSpanishDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function isNonWorkingDayMadrid(date: Date): { nonWorking: boolean; reason?: string } {
  const day = date.getDay();
  if (day === 0) return { nonWorking: true, reason: 'Domingo (inhábil Art. 30.2)' };
  if (day === 6) return { nonWorking: true, reason: 'Sábado (inhábil Art. 30.2)' };
  const iso = toIsoDate(date);
  if (MADRID_HOLIDAYS[iso]) {
    return { nonWorking: true, reason: `Festivo en Madrid: ${MADRID_HOLIDAYS[iso]}` };
  }
  return { nonWorking: false };
}

export interface DeadlineTraceStep {
  dateIso: string;
  label: string;
  status: 'inicio' | 'habil' | 'inhabil' | 'vencimiento' | 'prorroga';
  note: string;
}

export interface DeadlineCalculationResult {
  notificationDate: Date;
  startDate: Date;
  endDate: Date;
  unit: DeadlineUnit;
  amount: number;
  extendedFromInhabil: boolean;
  legalBasis: string;
  steps: DeadlineTraceStep[];
}

export function computeAdministrativeDeadline(
  notificationIso: string,
  amount: number,
  unit: DeadlineUnit
): DeadlineCalculationResult {
  const notifDate = parseIsoDate(notificationIso);
  const steps: DeadlineTraceStep[] = [
    {
      dateIso: notificationIso,
      label: formatSpanishDate(notifDate),
      status: 'inicio',
      note: 'Día de la notificación / publicación (no se computa como día 1)',
    },
  ];

  // Día siguiente a la notificación (inicio del cómputo)
  const startDate = new Date(notifDate);
  startDate.setDate(startDate.getDate() + 1);

  if (unit === 'habiles') {
    let cursor = new Date(notifDate);
    let counted = 0;
    while (counted < amount) {
      cursor.setDate(cursor.getDate() + 1);
      const check = isNonWorkingDayMadrid(cursor);
      if (check.nonWorking) {
        steps.push({
          dateIso: toIsoDate(cursor),
          label: formatSpanishDate(cursor),
          status: 'inhabil',
          note: `Excluido — ${check.reason}`,
        });
      } else {
        counted++;
        const isLast = counted === amount;
        steps.push({
          dateIso: toIsoDate(cursor),
          label: formatSpanishDate(cursor),
          status: isLast ? 'vencimiento' : 'habil',
          note: isLast ? `Día hábil ${counted} de ${amount} — Fin del plazo` : `Día hábil ${counted} de ${amount}`,
        });
      }
    }
    return {
      notificationDate: notifDate,
      startDate,
      endDate: cursor,
      unit,
      amount,
      extendedFromInhabil: false,
      legalBasis: 'Art. 30.2 y 30.3 Ley 39/2015: los días se entienden hábiles (excluidos sábados, domingos y festivos) contados desde el día siguiente a la notificación.',
      steps,
    };
  }

  if (unit === 'naturales') {
    const endCandidate = new Date(notifDate);
    endCandidate.setDate(endCandidate.getDate() + amount);
    steps.push({
      dateIso: toIsoDate(startDate),
      label: formatSpanishDate(startDate),
      status: 'habil',
      note: `Día 1 natural de ${amount} (incluye sábados, domingos y festivos intermedios)`,
    });

    let finalDate = new Date(endCandidate);
    const checkEnd = isNonWorkingDayMadrid(finalDate);
    let extended = false;
    if (checkEnd.nonWorking) {
      extended = true;
      steps.push({
        dateIso: toIsoDate(finalDate),
        label: formatSpanishDate(finalDate),
        status: 'inhabil',
        note: `Día ${amount} natural cae en ${checkEnd.reason} — se prorroga al primer día hábil siguiente (Art. 30.5)`,
      });
      while (isNonWorkingDayMadrid(finalDate).nonWorking) {
        finalDate.setDate(finalDate.getDate() + 1);
      }
      steps.push({
        dateIso: toIsoDate(finalDate),
        label: formatSpanishDate(finalDate),
        status: 'prorroga',
        note: 'Primer día hábil siguiente — Fin del plazo prorrogado',
      });
    } else {
      steps.push({
        dateIso: toIsoDate(finalDate),
        label: formatSpanishDate(finalDate),
        status: 'vencimiento',
        note: `Día ${amount} natural — Fin del plazo`,
      });
    }

    return {
      notificationDate: notifDate,
      startDate,
      endDate: finalDate,
      unit,
      amount,
      extendedFromInhabil: extended,
      legalBasis: 'Art. 30.3 y 30.5 Ley 39/2015: en plazos por días naturales se cuentan todos los días desde el siguiente; si el último día es inhábil, se prorroga al primer día hábil siguiente.',
      steps,
    };
  }

  // Meses (Art. 30.4 y 30.5 Ley 39/2015)
  const targetYear = notifDate.getFullYear();
  const targetMonthIndex = notifDate.getMonth() + amount;
  const origDay = notifDate.getDate();

  // Último día del mes objetivo
  const lastDayOfTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0, 12, 0, 0, 0);
  const clampedDay = Math.min(origDay, lastDayOfTargetMonth.getDate());
  let endCandidate = new Date(targetYear, targetMonthIndex, clampedDay, 12, 0, 0, 0);

  steps.push({
    dateIso: toIsoDate(startDate),
    label: formatSpanishDate(startDate),
    status: 'habil',
    note: 'Inicio del cómputo (día siguiente a la notificación, Art. 30.4)',
  });

  if (clampedDay < origDay) {
    steps.push({
      dateIso: toIsoDate(endCandidate),
      label: formatSpanishDate(endCandidate),
      status: 'habil',
      note: `No existe día ${origDay} en ${MONTHS_ES[endCandidate.getMonth()]}: el plazo expira el último día del mes (${clampedDay})`,
    });
  }

  let finalDate = new Date(endCandidate);
  const checkEnd = isNonWorkingDayMadrid(finalDate);
  let extended = false;

  if (checkEnd.nonWorking) {
    extended = true;
    steps.push({
      dateIso: toIsoDate(finalDate),
      label: formatSpanishDate(finalDate),
      status: 'inhabil',
      note: `Fecha equivalente (${checkEnd.reason}) — se prorroga al primer día hábil siguiente (Art. 30.5)`,
    });
    while (isNonWorkingDayMadrid(finalDate).nonWorking) {
      finalDate.setDate(finalDate.getDate() + 1);
    }
    steps.push({
      dateIso: toIsoDate(finalDate),
      label: formatSpanishDate(finalDate),
      status: 'prorroga',
      note: 'Primer día hábil siguiente — Vencimiento definitivo',
    });
  } else {
    steps.push({
      dateIso: toIsoDate(finalDate),
      label: formatSpanishDate(finalDate),
      status: 'vencimiento',
      note: `Fecha equivalente en el mes de vencimiento — Fin del plazo (Art. 30.4)`,
    });
  }

  return {
    notificationDate: notifDate,
    startDate,
    endDate: finalDate,
    unit,
    amount,
    extendedFromInhabil: extended,
    legalBasis: 'Art. 30.4 y 30.5 Ley 39/2015: los plazos por meses se computan desde el día siguiente y vencen en el día equivalente del mes de vencimiento (o último día del mes si no existe equivalente), prorrogándose al primer día hábil siguiente si cae en inhábil.',
    steps,
  };
}

// Generador determinista de ejercicios prácticos (plazos, puntuación -1/3 y supuestos)
export function generateDeterministicCaseBatch(seedBase: number, count = 6): Question[] {
  const generated: Question[] = [];

  const deadlineScenarios = [
    { notif: '2026-04-30', amount: 5, unit: 'habiles' as DeadlineUnit, proc: 'alegaciones urgentes en un distrito de Madrid' },
    { notif: '2026-05-13', amount: 5, unit: 'habiles' as DeadlineUnit, proc: 'subsanación tras requerimiento en Línea Madrid (incluye San Isidro, 15 de mayo)' },
    { notif: '2026-01-31', amount: 1, unit: 'meses' as DeadlineUnit, proc: 'interposición de recurso de reposición' },
    { notif: '2026-11-06', amount: 10, unit: 'habiles' as DeadlineUnit, proc: 'trámite de subsanación de solicitud (incluye 9 de noviembre, La Almudena)' },
    { notif: '2026-06-05', amount: 10, unit: 'naturales' as DeadlineUnit, proc: 'rechazo por falta de acceso a notificación electrónica (Art. 43.2)' },
    { notif: '2026-10-09', amount: 10, unit: 'habiles' as DeadlineUnit, proc: 'trámite de audiencia en expediente municipal (incluye 12 de octubre)' },
  ];

  for (let i = 0; i < count; i++) {
    const idx = (seedBase + i) % (deadlineScenarios.length + 4);

    if (idx < deadlineScenarios.length) {
      const sc = deadlineScenarios[idx];
      const res = computeAdministrativeDeadline(sc.notif, sc.amount, sc.unit);
      const correctLabel = formatSpanishDate(res.endDate);

      const dMinus1 = new Date(res.endDate);
      dMinus1.setDate(dMinus1.getDate() - 1);
      const dPlus1 = new Date(res.endDate);
      dPlus1.setDate(dPlus1.getDate() + 1);
      const dPlus2 = new Date(res.endDate);
      dPlus2.setDate(dPlus2.getDate() + 2);

      const rawOptions = [
        correctLabel,
        formatSpanishDate(dMinus1),
        formatSpanishDate(dPlus1),
        formatSpanishDate(dPlus2),
      ];
      const shift = (seedBase + i) % 4;
      const rotated: [string, string, string, string] = [
        rawOptions[(0 + shift) % 4],
        rawOptions[(1 + shift) % 4],
        rawOptions[(2 + shift) % 4],
        rawOptions[(3 + shift) % 4],
      ];
      const correctIndex = rotated.indexOf(correctLabel) as 0 | 1 | 2 | 3;

      const unitLabel = sc.unit === 'habiles' ? 'días hábiles' : sc.unit === 'naturales' ? 'días naturales' : sc.amount === 1 ? 'mes' : 'meses';

      generated.push({
        id: `gen-plazo-${seedBase}-${i}`,
        blockId: 3,
        topic: 'Generador Determinista de Plazos (Madrid)',
        difficulty: 'examen',
        isCase: true,
        question: `CASO PRÁCTICO DE PLAZOS (MADRID): Un interesado recibe notificación válida el ${formatSpanishDate(res.notificationDate)} para un procedimiento de ${sc.proc}, con un plazo legal de ${sc.amount} ${unitLabel}. Teniendo en cuenta sábados, domingos y festivos en la ciudad de Madrid, ¿cuál es el último día válido del plazo?`,
        options: rotated,
        correctIndex,
        explanation: `${res.legalBasis} El cómputo se inicia el ${formatShortSpanishDate(res.startDate)} y concluye el ${correctLabel}.`,
        citation: 'Art. 30 Ley 39/2015 (LPACAP) y Calendario de Festivos de Madrid',
      });
    } else {
      // Ejercicio matemático determinista de penalización -1/3
      const presets = [
        { total: 80, hits: 57, misses: 15, blank: 8 },
        { total: 100, hits: 72, misses: 18, blank: 10 },
        { total: 50, hits: 38, misses: 9, blank: 3 },
        { total: 80, hits: 61, misses: 12, blank: 7 },
      ];
      const p = presets[(idx - deadlineScenarios.length) % presets.length];
      const summary = calculateMadridExamScore(p.hits, p.misses, p.blank);
      const correctText = `${formatScore(summary.rawNetScore)} puntos netos (${formatScore(summary.scaledOver10)} sobre 10)`;
      const wrong1 = `${formatScore(p.hits - p.misses * 0.25)} puntos netos (${formatScore(((p.hits - p.misses * 0.25) / p.total) * 10)} sobre 10)`;
      const wrong2 = `${formatScore(p.hits - p.misses * 0.5)} puntos netos (${formatScore(((p.hits - p.misses * 0.5) / p.total) * 10)} sobre 10)`;
      const wrong3 = `${formatScore(p.hits - (p.misses + p.blank) / 3)} puntos netos (${formatScore(((p.hits - (p.misses + p.blank) / 3) / p.total) * 10)} sobre 10)`;

      const rawOptions = [correctText, wrong1, wrong2, wrong3];
      const shift = (seedBase + i) % 4;
      const rotated: [string, string, string, string] = [
        rawOptions[(0 + shift) % 4],
        rawOptions[(1 + shift) % 4],
        rawOptions[(2 + shift) % 4],
        rawOptions[(3 + shift) % 4],
      ];

      generated.push({
        id: `gen-score-${seedBase}-${i}`,
        blockId: 2,
        topic: 'Cálculo de Puntuación Oficial (-1/3)',
        difficulty: 'medio',
        isCase: true,
        question: `SIMULACIÓN DE BAREMO MUNICIPAL: En un cuestionario de ${p.total} preguntas del Ayuntamiento de Madrid (penalización 1/3 por error y preguntas en blanco sin penalización), un aspirante logra ${p.hits} aciertos, ${p.misses} fallos y deja ${p.blank} en blanco. ¿Cuál es su puntuación neta?`,
        options: rotated,
        correctIndex: rotated.indexOf(correctText) as 0 | 1 | 2 | 3,
        explanation: `Aplicando la fórmula oficial Puntuación = Aciertos - (Fallos / 3): ${p.hits} - (${p.misses} / 3) = ${p.hits} - ${formatScore(p.misses / 3)} = ${formatScore(summary.rawNetScore)} puntos netos, equivalentes a ${formatScore(summary.scaledOver10)} sobre 10. Las ${p.blank} preguntas en blanco no penalizan.`,
        citation: 'Bases Generales de Convocatoria C2 — Ayuntamiento de Madrid',
      });
    }
  }

  return generated;
}

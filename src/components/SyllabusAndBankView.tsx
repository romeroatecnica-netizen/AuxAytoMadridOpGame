import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Download,
  FileJson,
  MapPin,
  Trash2,
  Upload,
} from 'lucide-react';
import { isValidQuestion, StaticPackStatus } from '../data/questionBank';
import { MADRID_DISTRICTS_21, SYLLABUS_BLOCKS } from '../data/syllabus';
import { CustomQuestionPack, Question, UserProgress } from '../types';

interface SyllabusAndBankViewProps {
  questions: Question[];
  embeddedCount: number;
  staticStatuses: StaticPackStatus[];
  progress: UserProgress;
  onImportPack: (pack: CustomQuestionPack) => void;
  onDeletePack: (packId: string) => void;
  onResetProgress: () => void;
}

export const SyllabusAndBankView: React.FC<SyllabusAndBankViewProps> = ({
  questions,
  embeddedCount,
  staticStatuses,
  progress,
  onImportPack,
  onDeletePack,
  onResetProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [packName, setPackName] = useState('Paquete personal C2');
  const [jsonText, setJsonText] = useState('');
  const [importMessage, setImportMessage] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleImportJson = (raw: string, fallbackName: string) => {
    try {
      const parsed: unknown = JSON.parse(raw);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed &&
            typeof parsed === 'object' &&
            Array.isArray((parsed as { questions?: unknown }).questions)
          ? (parsed as { questions: unknown[] }).questions
          : null;

      if (!list) {
        setImportMessage({
          type: 'error',
          text: 'El JSON debe ser un array de preguntas o un objeto con la propiedad "questions".',
        });
        return;
      }

      const valid = list.filter(isValidQuestion);
      if (valid.length === 0) {
        setImportMessage({
          type: 'error',
          text: 'No se encontró ninguna pregunta válida (requiere id, blockId 1..7, question, 4 options, correctIndex 0..3, explanation y citation).',
        });
        return;
      }

      onImportPack({
        id: `pack-${Date.now()}`,
        name: packName.trim() || fallbackName,
        importedAt: new Date().toISOString(),
        questions: valid,
      });

      setImportMessage({
        type: 'ok',
        text: `Importadas ${valid.length} preguntas válidas (de ${list.length} leídas). Guardadas localmente en tu navegador.`,
      });
      setJsonText('');
    } catch {
      setImportMessage({
        type: 'error',
        text: 'JSON inválido: revisa la sintaxis (comillas dobles, comas y corchetes).',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleImportJson(reader.result, file.name.replace(/\.json$/i, ''));
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sampleTemplate: Question[] = [
    {
      id: 'custom-ejemplo-1',
      blockId: 2,
      topic: 'Ejemplo Ley 22/2006 (LCREM)',
      difficulty: 'medio',
      question: 'Ejemplo editable: ¿Qué órgano aprueba inicialmente los proyectos de ordenanzas en Madrid?',
      options: [
        'La Junta de Gobierno de la Ciudad de Madrid',
        'El Interventor General',
        'La Junta Municipal de Distrito',
        'El Concejal Secretario únicamente',
      ],
      correctIndex: 0,
      explanation: 'Conforme al artículo 17.1.a) de la Ley 22/2006, corresponde a la Junta de Gobierno aprobar los proyectos de ordenanzas y reglamentos.',
      citation: 'Art. 17.1.a) Ley 22/2006 (LCREM)',
    },
  ];

  const staticLoadedTotal = staticStatuses.reduce((acc, s) => acc + s.loadedCount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold text-[#1E3A8A]">
          Programa Oficial Subgrupo C2 · Arquitectura Modular Sin Servidor
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
          Temario Ayuntamiento de Madrid (C2) y Gestor de Banco JSON
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[#475569]">
          Consulta la estructura completa de los 7 bloques normativos, los 21 distritos de Madrid
          y escala tu banco de preguntas a miles de ítems cargando archivos estáticos{' '}
          <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-xs">/data/mad-bloque1.json</code>{' '}
          .. <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-xs">7.json</code> o
          importando tus propios paquetes JSON en localStorage.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 tabular-nums">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="text-xs text-[#64748B]">Banco embebido riguroso</div>
            <div className="mt-1 text-2xl font-extrabold text-[#0F172A]">
              {embeddedCount} preguntas
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="text-xs text-[#64748B]">Paquetes estáticos /data/</div>
            <div className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">
              {staticLoadedTotal} preguntas
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="text-xs text-[#64748B]">Total activo disponible</div>
            <div className="mt-1 text-2xl font-extrabold text-[#059669]">
              {questions.length} preguntas
            </div>
          </div>
        </div>
      </div>

      {/* 7 Syllabus Blocks */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#1E3A8A]" aria-hidden="true" />
          <h2 className="text-xl font-bold text-[#0F172A]">
            Desglose del Temario C2 (7 Bloques)
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {SYLLABUS_BLOCKS.map((b) => {
            const count = questions.filter((q) => q.blockId === b.id).length;
            return (
              <div
                key={b.id}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1E3A8A]">{b.code}</span>
                  <span className="font-semibold text-[#475569] tabular-nums">
                    {count} preguntas en banco
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-bold text-[#0F172A]">{b.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">{b.description}</p>
                <div className="mt-3 text-xs font-medium text-[#9F1239]">
                  Normativa clave: {b.laws.join(' · ')}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 21 Districts Quick Reference */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#9F1239]" aria-hidden="true" />
          <h2 className="text-xl font-bold text-[#0F172A]">
            Los 21 Distritos del Ayuntamiento de Madrid
          </h2>
        </div>
        <p className="mt-1 text-xs text-[#64748B]">
          Referencia rápida para el Bloque II (Ley 22/2006 LCREM y Reglamento Orgánico de los Distritos).
        </p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {MADRID_DISTRICTS_21.map((d) => (
            <div
              key={d}
              className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-medium text-[#0F172A] tabular-nums"
            >
              {d}
            </div>
          ))}
        </div>
      </section>

      {/* Scalable JSON Importer / Exporter */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-[#1E3A8A]" aria-hidden="true" />
              <h2 className="text-xl font-bold text-[#0F172A]">
                Motor Modular JSON (Importar / Exportar miles de preguntas)
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#475569]">
              Sube ficheros <code className="rounded bg-[#F1F5F9] px-1">.json</code> propios o
              aloja archivos estáticos en <code className="rounded bg-[#F1F5F9] px-1">/public/data/mad-bloque1.json</code> ... <code className="rounded bg-[#F1F5F9] px-1">7.json</code>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadJson('auxmadopgame-plantilla.json', sampleTemplate)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Descargar plantilla JSON</span>
            </button>
            <button
              type="button"
              onClick={() => downloadJson('auxmadopgame-banco-completo.json', questions)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Exportar banco completo ({questions.length})</span>
            </button>
          </div>
        </div>

        {/* Static /data/ files status */}
        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7 text-xs tabular-nums">
          {staticStatuses.map((st) => (
            <div
              key={st.blockId}
              className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5"
            >
              <div className="font-semibold text-[#0F172A]">mad-bloque{st.blockId}.json</div>
              <div className="mt-0.5 text-[#64748B]">
                {st.loadedCount > 0 ? `${st.loadedCount} cargadas` : 'Opcional (no detectado)'}
              </div>
            </div>
          ))}
        </div>

        {/* Import form */}
        <div className="grid gap-4 lg:grid-cols-12 border-t border-[#E2E8F0] pt-5">
          <div className="lg:col-span-5 space-y-3">
            <label htmlFor="pack-name" className="block text-xs font-bold text-[#334155]">
              Nombre del paquete JSON
            </label>
            <input
              id="pack-name"
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#94A3B8] bg-[#F8FAFC] px-4 py-3 text-xs font-semibold text-[#1E3A8A] hover:border-[#1E3A8A] cursor-pointer"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Seleccionar archivo .json desde tu equipo</span>
            </button>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <label htmlFor="json-paste" className="block text-xs font-bold text-[#334155]">
              O pegar contenido JSON directamente
            </label>
            <textarea
              id="json-paste"
              rows={4}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"id":"mi-01","blockId":2,"topic":"LCREM","difficulty":"medio","question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","citation":"Art. 14 Ley 22/2006"}]'
              className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-xs font-mono text-[#0F172A]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={!jsonText.trim()}
                onClick={() => handleImportJson(jsonText, 'Paquete pegado')}
                className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172D6E] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Validar e importar JSON
              </button>

              {importMessage && (
                <span
                  className={`text-xs font-semibold ${
                    importMessage.type === 'ok' ? 'text-[#059669]' : 'text-[#DC2626]'
                  }`}
                >
                  {importMessage.text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Custom imported packs list */}
        {progress.customPacks.length > 0 && (
          <div className="border-t border-[#E2E8F0] pt-4">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Paquetes JSON importados en este navegador
            </h3>
            <div className="mt-3 space-y-2">
              {progress.customPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#0F172A]">{pack.name}</span>
                    <span className="mx-2 text-[#CBD5E1]">·</span>
                    <span className="tabular-nums text-[#475569]">
                      {pack.questions.length} preguntas
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePack(pack.id)}
                    className="inline-flex items-center gap-1 font-semibold text-[#DC2626] hover:underline cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Local Progress */}
        <div className="border-t border-[#E2E8F0] pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#64748B]">
            Todos tus datos (XP, racha, historial de simulacros y clínica) se almacenan en
            localStorage sin registro ni envío a terceros.
          </div>
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
            >
              Reiniciar progreso local
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[#DC2626]">¿Confirmar borrado?</span>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                }}
                className="rounded-md bg-[#DC2626] px-3 py-1 font-semibold text-white cursor-pointer"
              >
                Sí, borrar todo
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-md border border-[#CBD5E1] bg-white px-3 py-1 font-semibold text-[#334155] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

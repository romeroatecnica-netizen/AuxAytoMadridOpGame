import React, { useState } from 'react';
import { BookMarked, ChevronDown, ExternalLink } from 'lucide-react';

interface AdAndSeoSectionProps {
  isFocusSessionActive: boolean;
}

const FAQ_ITEMS = [
  {
    q: '¿Cómo funciona la penalización de -1/3 en el examen de Auxiliar Administrativo del Ayuntamiento de Madrid?',
    a: 'En los cuestionarios tipo test de 4 alternativas (A, B, C, D) con una sola respuesta correcta, cada acierto suma 1 punto base, cada contestación errónea resta un tercio (1/3 = 0,333...) del valor de una respuesta acertada y las preguntas dejadas en blanco no penalizan. La fórmula es Puntuación = Aciertos − (Fallos / 3), escalada después a la puntuación máxima prevista en las bases de la convocatoria.',
  },
  {
    q: '¿Qué bloques entran en el temario de Auxiliar Administrativo C2 del Ayuntamiento de Madrid?',
    a: 'El programa oficial abarca 7 grandes bloques: Constitución Española de 1978 y Organización del Estado (incluyendo Estatuto de Autonomía de Madrid), Régimen Local y Ley 22/2006 de Capitalidad y Régimen Especial de Madrid (LCREM), Procedimiento Administrativo Común (Leyes 39/2015 y 40/2015), Atención al Ciudadano, Transparencia y Protección de Datos (RGPD/LOPDGDD), Personal Local (TREBEP), Hacienda Local (TRLRHL) y Ofimática (Windows, Word, Excel y correo).',
  },
  {
    q: '¿Para qué sirven las preguntas de reserva en los simulacros?',
    a: 'El Tribunal Calificador incluye preguntas adicionales de reserva al final del ejercicio para sustituir, por estricto orden correlativo (R1, R2...), a aquellas preguntas ordinarias que puedan ser anuladas tras las reclamaciones posteriores al examen. Conviene contestarlas con la misma estrategia que las ordinarias.',
  },
  {
    q: '¿Cómo se computan los plazos administrativos en días hábiles según la Ley 39/2015?',
    a: 'Conforme al artículo 30.2 de la Ley 39/2015, siempre que por Ley o Derecho de la Unión Europea no se exprese otro cómputo, cuando los plazos se señalen por días se entiende que éstos son hábiles, excluyéndose del cómputo los sábados, los domingos y los declarados festivos (como el 2 de mayo, el 15 de mayo San Isidro y el 9 de noviembre La Almudena en Madrid).',
  },
  {
    q: '¿AuxMadOpGame funciona de forma 100 % local y gratuita sin llamadas a IA?',
    a: 'Sí. Toda la lógica de evaluación con penalización -1/3, el banco inicial de más de 140 preguntas con citas normativas exactas, el calculador de plazos con festivos de Madrid, el generador de supuestos y tu progreso (XP, racha, clínica de fallos e importación JSON) se ejecutan de manera determinista en tu navegador.',
  },
];

const RECOMMENDED_MATERIALS = [
  {
    title: 'Temario Completo Auxiliar Administrativo Ayuntamiento de Madrid (Subgrupo C2)',
    desc: 'Desarrollo actualizado de los temas generales y específicos, incluyendo Ley 22/2006 LCREM, Ordenanzas Municipales y TREBEP.',
    tag: 'Manual de estudio C2',
    href: 'https://www.amazon.es/s?k=temario+auxiliar+administrativo+ayuntamiento+madrid',
  },
  {
    title: 'Libro de Cuestionarios Tipo Test y Simulacros Ayuntamiento de Madrid',
    desc: 'Recopilación de test por bloques y exámenes comentados para entrenar velocidad y gestión del riesgo con penalización -1/3.',
    tag: 'Batería de test',
    href: 'https://www.amazon.es/s?k=test+auxiliar+administrativo+ayuntamiento+madrid',
  },
  {
    title: 'Supuestos Prácticos de Procedimiento Administrativo (Ley 39/2015) y Ofimática',
    desc: 'Casos resueltos paso a paso sobre registros, notificaciones electrónicas, cómputo de plazos, Excel y Word administrativo.',
    tag: 'Casos prácticos y ofimática',
    href: 'https://www.amazon.es/s?k=supuestos+practicos+auxiliar+administrativo+madrid',
  },
];

export const AdAndSeoSection: React.FC<AdAndSeoSectionProps> = ({ isFocusSessionActive }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (isFocusSessionActive) {
    return null;
  }

  return (
    <div className="mt-12 space-y-10 no-print">
      {/* MEDIA.NET AD SLOT 1: Entre el área principal de entrenamiento/simulador y la guía de temario inferior */}
      {/* Configuración Media.net (Slot Superior / Mid-Content):
          Reemplaza el contenido interior con tu etiqueta <div id="mnet-slot-mid"> y carga el script mnet en index.html o mediante useEffect.
          La altura mínima reservada (min-h-[100px]) evita saltos de diseño (Cumulative Layout Shift - CLS). */}
      <aside
        aria-label="Espacio publicitario superior"
        className="ad-slot-container mx-auto flex min-h-[100px] w-full max-w-4xl items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-3 text-center"
      >
        <div id="medianet-ad-slot-mid" data-ad-provider="media.net" data-ad-size="728x90">
          <p className="text-[11px] font-semibold text-[#94A3B8]">
            ESPACIO PUBLICITARIO MEDIA.NET (728×90 / RESPONSIVE · SLOT INTERMEDIO)
          </p>
          <p className="mt-0.5 text-[11px] text-[#94A3B8]">
            Altura mínima reservada (100 px) para CLS = 0 · Oculto durante simulacros activos e impresión
          </p>
        </div>
      </aside>

      {/* Guía SEO de Larga Cola + Explicación Penalización -1/3 + FAQ */}
      <section
        aria-labelledby="seo-guia-heading"
        className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-8"
      >
        <div>
          <h2 id="seo-guia-heading" className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
            Guía del Examen de Auxiliar Administrativo del Ayuntamiento de Madrid (Subgrupo C2)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            Preparar un <strong>test de Auxiliar Administrativo del Ayuntamiento de Madrid gratis</strong> requiere
            entrenar con el formato real del tribunal: cuestionarios tipo test de cuatro opciones (A, B, C y D)
            con preguntas de reserva y una penalización habitual de un tercio por cada error.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <h3 className="text-base font-bold text-[#0F172A]">
              Cómo calcular la puntuación en el simulacro con penalización -1/3
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#475569]">
              En el <strong>simulacro de Auxiliar Administrativo del Ayuntamiento de Madrid</strong>, la
              fórmula de corrección es <span className="font-semibold text-[#0F172A]">Puntuación = Aciertos − (Fallos / 3)</span>.
              Cada tres respuestas erróneas anulan el valor de una respuesta acertada, mientras que
              las preguntas sin contestar no restan puntuación. Si descartas al menos dos opciones
              incorrectas, contestar tiene esperanza matemática positiva.
            </p>
          </article>

          <article className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <h3 className="text-base font-bold text-[#0F172A]">
              Importancia de la Ley 22/2006 de Capitalidad y el Temario C2
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#475569]">
              Las <strong>preguntas sobre la Ley 22/2006 de Capitalidad de Madrid (LCREM)</strong> y las
              bases del <strong>temario C2</strong> marcan la diferencia frente a oposiciones estatales:
              competencias de la Junta de Gobierno de la Ciudad de Madrid, delegación de la Presidencia
              del Pleno, los 21 distritos, la Ley 39/2015, el TREBEP y las fases ADOP del gasto local.
            </p>
          </article>
        </div>

        {/* FAQ Accordion matching FAQPage JSON-LD */}
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">
            Preguntas frecuentes sobre el examen C2 del Ayuntamiento de Madrid
          </h3>
          <div className="mt-3 divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white first:rounded-t-xl last:rounded-b-xl">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm leading-relaxed text-[#475569]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bloque discreto de afiliación contextual */}
      <section
        aria-labelledby="afiliados-heading"
        className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-[#9F1239]" aria-hidden="true" />
            <h2 id="afiliados-heading" className="text-lg font-bold text-[#0F172A]">
              Temarios, libros de test y material recomendado C2
            </h2>
          </div>
          <span className="text-[11px] text-[#64748B]">
            Enlaces de afiliado · Sin coste adicional para ti
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[#475569]">
          Aviso transparente: algunos enlaces externos son enlaces de afiliado contextuales (
          <code className="text-[11px]">rel=&quot;sponsored nofollow noopener&quot;</code>) que ayudan
          a mantener AuxMadOpGame 100 % gratuito para todos los opositores.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {RECOMMENDED_MATERIALS.map((mat) => (
            <a
              key={mat.title}
              href={mat.href}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 hover:border-[#1E3A8A] transition-colors"
            >
              <div>
                <div className="text-[11px] font-semibold text-[#9F1239]">{mat.tag}</div>
                <h3 className="mt-1 text-sm font-bold text-[#0F172A]">{mat.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">{mat.desc}</p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A8A]">
                <span>Consultar ediciones recomendadas</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* MEDIA.NET AD SLOT 2: Bloque inferior de la página */}
      {/* Configuración Media.net (Slot Inferior):
          Inserta aquí tu unidad de display 300x250 / 728x90 / Native Ads.
          Altura mínima reservada (min-h-[250px]) para evitar CLS y nunca superpuesto al simulador. */}
      <aside
        aria-label="Espacio publicitario inferior"
        className="ad-slot-container mx-auto flex min-h-[250px] w-full max-w-4xl items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center"
      >
        <div id="medianet-ad-slot-bottom" data-ad-provider="media.net" data-ad-size="responsive-bottom">
          <p className="text-[11px] font-semibold text-[#94A3B8]">
            ESPACIO PUBLICITARIO MEDIA.NET (300×250 / NATIVE · SLOT INFERIOR)
          </p>
          <p className="mt-0.5 text-[11px] text-[#94A3B8]">
            Altura mínima reservada (250 px) para evitar Cumulative Layout Shift
          </p>
        </div>
      </aside>
    </div>
  );
};

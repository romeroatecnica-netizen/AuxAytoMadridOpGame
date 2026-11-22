import { SyllabusBlock } from '../types';

export const SYLLABUS_BLOCKS: SyllabusBlock[] = [
  {
    id: 1,
    code: 'Bloque I',
    title: 'Constitución Española de 1978 y Organización del Estado',
    shortTitle: 'CE 1978 y Estado',
    description:
      'Principios constitucionales, derechos y deberes fundamentales, Corona, Cortes Generales, Gobierno, Poder Judicial, Tribunal Constitucional, organización territorial y Estatuto de Autonomía de la Comunidad de Madrid.',
    laws: ['CE 1978', 'LO 3/1983 (EACM)', 'LOTC 2/1979'],
    units: [
      { id: 'b1-u1', title: 'Principios y Derechos Fundamentales', subtitle: 'Título Preliminar y Título I CE', difficulty: 'basico' },
      { id: 'b1-u2', title: 'Corona, Cortes y Gobierno', subtitle: 'Títulos II, III, IV y V CE', difficulty: 'medio' },
      { id: 'b1-u3', title: 'Organización Territorial y Madrid', subtitle: 'Título VIII CE y LO 3/1983', difficulty: 'examen' },
    ],
  },
  {
    id: 2,
    code: 'Bloque II',
    title: 'Régimen Local y Ley de Capitalidad de Madrid (LCREM)',
    shortTitle: 'Madrid y Régimen Local',
    description:
      'El municipio y sus competencias, Ley 22/2006 de Capitalidad y Régimen Especial de Madrid, órganos de gobierno (Alcaldía, Junta de Gobierno, Pleno, Juntas Municipales de Distrito), 21 distritos y régimen de sesiones.',
    laws: ['Ley 22/2006 (LCREM)', 'Ley 7/1985 (LBRL)', 'ROGA / ROP Madrid'],
    units: [
      { id: 'b2-u1', title: 'Municipio y Elementos (LBRL)', subtitle: 'Territorio, población y organización', difficulty: 'basico' },
      { id: 'b2-u2', title: 'Ley 22/2006 de Capitalidad (LCREM)', subtitle: 'Pleno, Alcalde y Junta de Gobierno', difficulty: 'medio' },
      { id: 'b2-u3', title: 'Distritos de Madrid y Sesiones', subtitle: '21 Distritos, Juntas y acuerdos', difficulty: 'examen' },
    ],
  },
  {
    id: 3,
    code: 'Bloque III',
    title: 'Derecho Administrativo y Procedimiento Común (39/2015 y 40/2015)',
    shortTitle: 'Procedimiento (39/2015)',
    description:
      'Fuentes del Derecho, acto administrativo (eficacia, notificación, nulidad y anulabilidad), interesados, representación, registros, cómputo de plazos, silencio administrativo, revisión de oficio y recursos.',
    laws: ['Ley 39/2015 (LPACAP)', 'Ley 40/2015 (LRJSP)'],
    units: [
      { id: 'b3-u1', title: 'Acto Administrativo y Eficacia', subtitle: 'Notificaciones, nulidad y anulabilidad', difficulty: 'basico' },
      { id: 'b3-u2', title: 'Plazos, Registros y Silencio', subtitle: 'Art. 16, 24, 25 y 30 Ley 39/2015', difficulty: 'medio' },
      { id: 'b3-u3', title: 'Revisión de Oficio y Recursos', subtitle: 'Alzada, reposición y extraordinario', difficulty: 'examen' },
    ],
  },
  {
    id: 4,
    code: 'Bloque IV',
    title: 'Atención al Ciudadano, Transparencia, Datos y Sede Electrónica',
    shortTitle: 'Atención, Datos y e-Admin',
    description:
      'Derechos de las personas ante las AAPP, oficinas de asistencia en materia de registros (OAMR), Línea Madrid, transparencia y acceso a la información, RGPD/LOPDGDD, ENS y Carpeta Ciudadana.',
    laws: ['Ley 19/2013', 'RGPD (UE) 2016/679', 'LO 3/2018 (LOPDGDD)', 'RD 203/2021'],
    units: [
      { id: 'b4-u1', title: 'Atención Ciudadana y Registros', subtitle: 'Art. 13 y 53 LPACAP y Línea Madrid', difficulty: 'basico' },
      { id: 'b4-u2', title: 'Transparencia y Acceso Público', subtitle: 'Ley 19/2013 y Ordenanza Madrid', difficulty: 'medio' },
      { id: 'b4-u3', title: 'Protección de Datos y Sede Electrónica', subtitle: 'RGPD, LOPDGDD y firma electrónica', difficulty: 'examen' },
    ],
  },
  {
    id: 5,
    code: 'Bloque V',
    title: 'Gestión de Personal al Servicio de las Administraciones Locales',
    shortTitle: 'Personal (TREBEP)',
    description:
      'Clases de personal, acceso al empleo público, adquisición y pérdida de la condición de funcionario, situaciones administrativas, derechos y deberes, permisos, vacaciones, régimen disciplinario e incompatibilidades.',
    laws: ['RDL 5/2015 (TREBEP)', 'Ley 53/1984 (Incompatibilidades)'],
    units: [
      { id: 'b5-u1', title: 'Clases de Personal y Acceso', subtitle: 'Funcionarios, laborales y eventuales', difficulty: 'basico' },
      { id: 'b5-u2', title: 'Permisos, Vacaciones y Situaciones', subtitle: 'Art. 48, 49, 50 y 85 TREBEP', difficulty: 'medio' },
      { id: 'b5-u3', title: 'Régimen Disciplinario e Incompatibilidades', subtitle: 'Faltas, sanciones y prescripción', difficulty: 'examen' },
    ],
  },
  {
    id: 6,
    code: 'Bloque VI',
    title: 'Hacienda Local y Gestión Presupuestaria Municipal',
    shortTitle: 'Hacienda y Presupuestos',
    description:
      'Recursos de las haciendas locales, tributos municipales (IBI, IAE, IVTM, IIVTNU, ICIO), tasas y precios públicos, estructura del presupuesto municipal, modificaciones de crédito y fases ADOP del gasto.',
    laws: ['RDL 2/2004 (TRLRHL)', 'RD 500/1990', 'Orden EHA/3565/2008'],
    units: [
      { id: 'b6-u1', title: 'Ingresos y Tributos Locales', subtitle: 'IBI, IAE, IVTM, Plusvalía y tasas', difficulty: 'basico' },
      { id: 'b6-u2', title: 'Presupuesto General Municipal', subtitle: 'Estructura, principios y prórroga', difficulty: 'medio' },
      { id: 'b6-u3', title: 'Ejecución del Gasto y Modificaciones', subtitle: 'Fases A-D-O-P y créditos', difficulty: 'examen' },
    ],
  },
  {
    id: 7,
    code: 'Bloque VII',
    title: 'Ofimática y Herramientas de Oficina (Windows, Word, Excel)',
    shortTitle: 'Ofimática (Word/Excel)',
    description:
      'Sistema operativo Windows y gestión de archivos, procesador de textos Word (estilos, combinar correspondencia, atajos), hojas de cálculo Excel (fórmulas SI, BUSCARV, SUMAR.SI, referencias absolutas), correo y seguridad.',
    laws: ['Windows 10/11', 'Microsoft Word', 'Microsoft Excel', 'Ciberseguridad'],
    units: [
      { id: 'b7-u1', title: 'Windows, Archivos y Correo', subtitle: 'Atajos, extensiones y protocolos', difficulty: 'basico' },
      { id: 'b7-u2', title: 'Microsoft Word Administrativo', subtitle: 'Estilos, tablas, índices y atajos', difficulty: 'medio' },
      { id: 'b7-u3', title: 'Microsoft Excel y Fórmulas', subtitle: 'Referencias $, SI, BUSCARV y errores', difficulty: 'examen' },
    ],
  },
];

export const MADRID_DISTRICTS_21 = [
  '01. Centro',
  '02. Arganzuela',
  '03. Retiro',
  '04. Salamanca',
  '05. Chamartín',
  '06. Tetuán',
  '07. Chamberí',
  '08. Fuencarral-El Pardo',
  '09. Moncloa-Aravaca',
  '10. Latina',
  '11. Carabanchel',
  '12. Usera',
  '13. Puente de Vallecas',
  '14. Moratalaz',
  '15. Ciudad Lineal',
  '16. Hortaleza',
  '17. Villaverde',
  '18. Villa de Vallecas',
  '19. Vicálvaro',
  '20. San Blas-Canillejas',
  '21. Barajas',
];

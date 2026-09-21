const DB_NAME = 'gymwolf-pwa';
const DB_VERSION = 1;
const DEFAULT_ROUTINE_ID = 'rutina_default';
const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

export const db = new Dexie(DB_NAME);

db.version(DB_VERSION).stores({
  rutinas: 'id, nombre, esDefault, creada, activa',
  sesiones: 'id, fecha, diaId, diaNombre, horaInicio, horaFin',
  medidas: 'id, fecha',
  ajustes: 'clave'
});

const DAY_LABELS = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
  descanso: 'Descanso'
};

function safeUUID() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateKey(date = new Date()) {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function dateKeyToDate(dateKeyValue) {
  return new Date(`${dateKeyValue}T00:00:00`);
}

export function timeString(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

export function formatDateKey(dateKeyValue) {
  const date = dateKeyToDate(dateKeyValue);
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

function createExercise(nombre, series, reps, nota = '', orden = 0, tipo = 'reps') {
  return {
    id: safeUUID(),
    nombre,
    series,
    reps,
    nota,
    orden,
    tipo,
    estado: 'pendiente',
    razonSalto: ''
  };
}

function inferCoreType(reps = '') {
  return /seg|s\b/i.test(String(reps)) ? 'tiempo' : 'reps';
}

function createCoreItem(nombre, series, reps, tipo = null) {
  return {
    id: safeUUID(),
    nombre,
    series,
    reps,
    tipo: tipo || inferCoreType(reps)
  };
}

function routineDay(id, nombre, enfoque, ejercicios, core, esDescanso = false) {
  return {
    id,
    nombre,
    enfoque,
    esDescanso,
    ejercicios,
    core
  };
}

export function buildDefaultRoutine() {
  const core = [
    createCoreItem('Vacíos Abdominales', 4, '15-20 s', 'tiempo'),
    createCoreItem('Plancha Prona sobre Codos', 3, '30-45 s', 'tiempo'),
    createCoreItem('Pallof Press en Polea', 3, '10-12 / lado', 'tiempo_reps')
  ];

  const dias = [
    routineDay(
      'lunes',
      'Lunes',
      'Glúteo Mayor & Femorales',
      [
        createExercise('Hip Thrust con Barra', 4, '8-10', 'Pausa de 1 s arriba', 1),
        createExercise('Peso Muerto Rumano', 4, '10-12', 'Empujar la cadera hacia atrás', 2),
        createExercise('Sentadilla Búlgara', 3, '10 / pierna', 'Torso ligeramente inclinado al frente', 3),
        createExercise('Curl Femoral (Acostado o Sentado)', 3, '12-15', 'Bajada lenta en 2-3 s', 4),
        createExercise('Abducción de Cadera en Máquina', 3, '15-20', 'Última serie drop-set', 5)
      ],
      deepClone(core)
    ),
    routineDay(
      'martes',
      'Martes',
      'Torso Estratégico',
      [
        createExercise('Jalón al Pecho Agarre Abierto y Prono', 4, '10-12', '', 1),
        createExercise('Elevaciones Laterales con Mancuernas', 4, '12-15', 'Estricto, sin impulso', 2),
        createExercise('Remo con Soporte al Pecho', 3, '10-12', 'Codos abiertos', 3),
        createExercise('Elevaciones Laterales en Polea Unilateral', 3, '15 / lado', '', 4),
        createExercise('Face Pulls en Polea Alta con Cuerda', 3, '15', '', 5)
      ],
      deepClone(core)
    ),
    routineDay(
      'miercoles',
      'Miércoles',
      'Cuádriceps & Glúteo',
      [
        createExercise('Prensa de Piernas Inclinada', 4, '10-12', 'Pies a media plataforma', 1),
        createExercise('Sentadilla Goblet o en Máquina Hack', 3, '10-12', '', 2),
        createExercise('Zancadas Caminando', 3, '12 pasos / pierna', '', 3),
        createExercise('Extensiones de Cuádriceps en Máquina', 3, '12-15', 'Pausa de 1 s arriba', 4),
        createExercise('Patada de Glúteo en Polea Baja', 3, '12-15 / pierna', 'Ángulo 45° hacia afuera', 5)
      ],
      deepClone(core)
    ),
    routineDay(
      'jueves',
      'Jueves',
      'Torso & Detalle',
      [
        createExercise('Press Militar con Mancuernas', 3, '10-12', '', 1),
        createExercise('Remo en Polea Baja Agarre Neutro', 3, '10-12', '', 2),
        createExercise('Elevaciones Laterales en Banco a 30°', 4, '12-15', '', 3),
        createExercise('Pájaros con Mancuerna o Pec Deck Invertido', 3, '15', '', 4),
        createExercise('Extensión de Tríceps en Polea + Curl de Bíceps', 3, '12-15', 'Superserie', 5)
      ],
      deepClone(core)
    ),
    routineDay(
      'viernes',
      'Viernes',
      'Glúteo Hipertrofia & Bombeo',
      [
        createExercise('Hip Thrust en Máquina o Smith', 4, '10-12', 'Tensión continua', 1),
        createExercise('Peso Muerto B-Stance', 3, '10 / pierna', '', 2),
        createExercise('Abducciones de Cadera Inclinada al Frente', 4, '15-20', '', 3),
        createExercise('Hiperextensiones en Banco a 45°', 3, '12-15', 'Espalda redondeada', 4),
        createExercise('Paseos Laterales con Banda', 3, '15 pasos / lado', 'Monster walks', 5)
      ],
      deepClone(core)
    )
  ];

  return {
    id: DEFAULT_ROUTINE_ID,
    nombre: 'Gym Wolf 5 Días',
    esDefault: true,
    activa: true,
    creada: new Date().toISOString(),
    dias
  };
}

function normalizeRoutine(routine) {
  const copy = deepClone(routine);
  copy.dias = (copy.dias || []).map((day, index) => ({
    id: day.id || DAY_ORDER[index] || safeUUID(),
    nombre: day.nombre || DAY_LABELS[day.id] || `Día ${index + 1}`,
    enfoque: day.enfoque || '',
    esDescanso: Boolean(day.esDescanso),
    ejercicios: (day.ejercicios || []).map((exercise, exerciseIndex) => ({
      id: exercise.id || safeUUID(),
      nombre: exercise.nombre || '',
      series: Number(exercise.series || 3),
      reps: exercise.reps || '',
      nota: exercise.nota || '',
      orden: typeof exercise.orden === 'number' ? exercise.orden : exerciseIndex + 1,
      tipo: exercise.tipo || 'reps',
      estado: exercise.estado || 'pendiente',
      razonSalto: exercise.razonSalto || '',
      seriesConfiguradas: Number(exercise.seriesConfiguradas || exercise.series || 3)
    })),
    core: (day.core || []).map((item) => ({
      id: item.id || safeUUID(),
      nombre: item.nombre || '',
      series: Number(item.series || 3),
      reps: item.reps || '',
      tipo: item.tipo || inferCoreType(item.reps)
    }))
  }));
  return copy;
}

function buildEmptyRestDay(date = new Date()) {
  const weekday = date.getDay();
  const names = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const id = names[weekday];
  return {
    id,
    nombre: DAY_LABELS[id] || 'Descanso',
    enfoque: 'Descanso',
    esDescanso: true,
    ejercicios: [],
    core: []
  };
}

export function getRoutineDayForDate(routine, date = new Date()) {
  const names = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const id = names[date.getDay()];
  const found = routine?.dias?.find((day) => day.id === id);
  return found || (date.getDay() === 0 || date.getDay() === 6 ? buildEmptyRestDay(date) : routine?.dias?.find((day) => day.id === id) || buildEmptyRestDay(date));
}

export function getRoutineDayById(routine, dayId) {
  if (!routine?.dias?.length || !dayId) return null;
  return routine.dias.find((day) => day.id === dayId) || null;
}

function buildExerciseSeries(exercise) {
  return [];
}

export function buildSessionFromRoutineDay(day, fecha, rutinaId) {
  return {
    id: `ses_${fecha}`,
    fecha,
    rutinaId: rutinaId || DEFAULT_ROUTINE_ID,
    diaId: day.id,
    diaNombre: day.nombre,
    horaInicio: '',
    horaFin: '',
    duracionMin: null,
    energia: 8,
    cardio: '',
    notas: '',
    estado: 'activa',
    indiceEjercicioActivo: 0,
    creado: new Date().toISOString(),
    ejercicios: (day.esDescanso ? [] : (day.ejercicios || []).map((exercise, index) => ({
      ejercicioId: exercise.id || safeUUID(),
      nombre: exercise.nombre || '',
      nota: exercise.nota || '',
      tipo: exercise.tipo || 'reps',
      prescripcion: `${Number(exercise.seriesConfiguradas || exercise.series || 3)} series × ${exercise.reps || ''}`,
      seriesConfiguradas: Number(exercise.seriesConfiguradas || exercise.series || 3),
      estado: index === 0 ? 'en_curso' : 'pendiente',
      razonSalto: null,
      rpePromedio: null,
      series: []
    }))),
    core: (day.core || []).map((item, index) => ({
      coreId: item.coreId || item.id || safeUUID(),
      nombre: item.nombre || '',
      series: Number(item.series || 1),
      reps: item.reps || '',
      tipo: item.tipo || inferCoreType(item.reps || ''),
      prescripcion: `${Number(item.series || 1)} series × ${item.reps || ''}`,
      seriesConfiguradas: Number(item.series || 1),
      estado: 'pendiente',
      razonSalto: null,
      rpePromedio: null,
      series: [],
      hecho: false,
      orden: index + 1
    })),
    unidad: 'kg'
  };
}

function normalizeSession(session) {
  return {
    ...session,
    estado: session.estado || 'activa',
    indiceEjercicioActivo: Number(session.indiceEjercicioActivo || 0),
    ejercicios: (session.ejercicios || []).map((exercise) => ({
      ejercicioId: exercise.ejercicioId || exercise.id || safeUUID(),
      nombre: exercise.nombre || '',
      nota: exercise.nota || '',
      tipo: exercise.tipo || 'reps',
      seriesConfiguradas: Number(exercise.seriesConfiguradas || exercise.series?.length || exercise.series || 3),
      estado: exercise.estado || 'pendiente',
      razonSalto: exercise.razonSalto || '',
      rpePromedio: exercise.rpePromedio ?? null,
      series: (exercise.series || []).map((serie) => ({
        peso: serie.peso ?? '',
        reps: serie.reps ?? '',
        rpe: serie.rpe ?? 8,
        hecho: Boolean(serie.hecho),
        tiempoSeg: Number(serie.tiempoSeg || 0),
        inicioSeg: serie.inicioSeg ?? null,
        registradaEn: serie.registradaEn || null,
        horaInicio: serie.horaInicio || null,
        horaFin: serie.horaFin || null
      }))
    })),
    core: (session.core || []).map((item) => ({
      coreId: item.coreId || item.id || safeUUID(),
      nombre: item.nombre || '',
      series: Number(item.series || 1),
      reps: item.reps || '',
      tipo: item.tipo || inferCoreType(item.reps || ''),
      prescripcion: item.prescripcion || `${Number(item.series || 1)} series × ${item.reps || ''}`,
      seriesConfiguradas: Number(item.seriesConfiguradas || item.series || 1),
      estado: item.estado || 'pendiente',
      razonSalto: item.razonSalto || null,
      rpePromedio: item.rpePromedio ?? null,
      series: Array.isArray(item.seriesList) ? item.seriesList : (Array.isArray(item.series) ? item.series : []),
      hecho: Boolean(item.hecho)
    }))
  };
}

export async function initDb() {
  await db.open();
  await seedDatabase();
  return db;
}

export async function seedDatabase() {
  const routinesCount = await db.rutinas.count();
  if (!routinesCount) {
    await db.rutinas.add(buildDefaultRoutine());
  }

  const active = await db.ajustes.get('rutinaActivaId');
  if (!active) {
    await db.ajustes.put({ clave: 'rutinaActivaId', valor: DEFAULT_ROUTINE_ID });
  }

  const theme = await db.ajustes.get('tema');
  if (!theme) {
    await db.ajustes.put({ clave: 'tema', valor: 'auto' });
  }

  const palette = await db.ajustes.get('paleta');
  if (!palette) {
    await db.ajustes.put({ clave: 'paleta', valor: 'mono' });
  }

  const unit = await db.ajustes.get('unidad');
  if (!unit) {
    await db.ajustes.put({ clave: 'unidad', valor: 'kg' });
  }
}

export async function getSetting(clave, fallback = null) {
  const item = await db.ajustes.get(clave);
  return item?.valor ?? fallback;
}

export async function setSetting(clave, valor) {
  await db.ajustes.put({ clave, valor });
  return valor;
}

export async function getSettingsMap() {
  const ajustes = await db.ajustes.toArray();
  return Object.fromEntries(ajustes.map((item) => [item.clave, item.valor]));
}

export async function listRoutines() {
  return db.rutinas.orderBy('creada').toArray();
}

export async function getRoutineById(id) {
  return db.rutinas.get(id);
}

export async function getActiveRoutine() {
  const activeId = await getSetting('rutinaActivaId', DEFAULT_ROUTINE_ID);
  let routine = await db.rutinas.get(activeId);
  if (!routine) {
    routine = await db.rutinas.get(DEFAULT_ROUTINE_ID) || (await listRoutines())[0] || null;
  }
  return routine ? normalizeRoutine(routine) : null;
}

export async function saveRoutine(routine) {
  const normalized = normalizeRoutine(routine);
  await db.rutinas.put(normalized);
  return normalized;
}

export async function duplicateRoutine(routineId) {
  const source = await db.rutinas.get(routineId);
  if (!source) return null;
  const copy = normalizeRoutine(source);
  const id = `rut_${safeUUID()}`;
  copy.id = id;
  copy.esDefault = false;
  copy.activa = false;
  copy.nombre = `${copy.nombre} (copia)`;
  copy.creada = new Date().toISOString();
  copy.dias = copy.dias.map((day) => ({
    ...day,
    ejercicios: day.ejercicios.map((exercise) => ({ ...exercise, id: safeUUID() })),
    core: day.core.map((item) => ({ ...item, id: safeUUID() }))
  }));
  await db.rutinas.add(copy);
  await setSetting('rutinaActivaId', id);
  return copy;
}

export async function setActiveRoutine(id) {
  await setSetting('rutinaActivaId', id);
  return id;
}

export async function restoreDefaultRoutine() {
  const routine = buildDefaultRoutine();
  await db.rutinas.put(routine);
  await setActiveRoutine(routine.id);
  return routine;
}

export async function createDraftSessionForToday(routineId = null, { force = false, dayId = null } = {}) {
  const today = dateKey();
  const existing = await db.sesiones.get(`ses_${today}`);
  if (existing && !force) return normalizeSession(existing);
  if (existing && force) await db.sesiones.delete(existing.id);

  const routine = routineId ? await db.rutinas.get(routineId) : await getActiveRoutine();
  const day = routine ? (dayId ? getRoutineDayById(routine, dayId) || getRoutineDayForDate(routine, new Date()) : getRoutineDayForDate(routine, new Date())) : buildEmptyRestDay(new Date());
  const session = buildSessionFromRoutineDay(day, today, routine?.id);
  await db.sesiones.put(session);
  return normalizeSession(session);
}

export async function getSessionByDate(dateKeyValue) {
  const session = await db.sesiones.get(`ses_${dateKeyValue}`);
  return session ? normalizeSession(session) : null;
}

export async function getTodaySession() {
  return getSessionByDate(dateKey());
}

export async function upsertSession(session) {
  const normalized = normalizeSession(session);
  await db.sesiones.put(normalized);
  return normalized;
}

export async function startTodaySession(routineId = null, options = {}) {
  const session = await createDraftSessionForToday(routineId, options);
  if (!session.horaInicio) {
    session.horaInicio = timeString();
    if (!session.unidad) session.unidad = 'kg';
    await upsertSession(session);
  }
  return session;
}

export async function finishSession(sessionId) {
  const session = await db.sesiones.get(sessionId);
  if (!session) return null;
  if (!session.horaInicio) {
    session.horaInicio = timeString();
  }
  if (!session.horaFin) {
    session.horaFin = timeString();
  }
  const start = dateKeyToDate(session.fecha);
  const [startHour, startMinute] = session.horaInicio.split(':').map(Number);
  const [endHour, endMinute] = session.horaFin.split(':').map(Number);
  const startDate = new Date(start);
  startDate.setHours(startHour, startMinute, 0, 0);
  const endDate = new Date(start);
  endDate.setHours(endHour, endMinute, 0, 0);
  let duration = Math.round((endDate - startDate) / 60000);
  if (duration < 0) duration += 24 * 60;
  session.duracionMin = duration;
  await upsertSession(session);
  return normalizeSession(session);
}

export async function deleteSession(id) {
  await db.sesiones.delete(id);
}

export async function listSessions(filters = {}) {
  const sesiones = await db.sesiones.orderBy('fecha').reverse().toArray();
  return sesiones
    .map(normalizeSession)
    .filter((session) => {
      if (filters.from && session.fecha < filters.from) return false;
      if (filters.to && session.fecha > filters.to) return false;
      if (filters.diaId && filters.diaId !== 'all' && session.diaId !== filters.diaId) return false;
      if (filters.exercise && filters.exercise !== 'all') {
        const target = filters.exercise.toLowerCase();
        const hasExercise = (session.ejercicios || []).some((exercise) => exercise.nombre.toLowerCase().includes(target));
        if (!hasExercise) return false;
      }
      return true;
    });
}

export async function listMeasures() {
  return db.medidas.orderBy('fecha').reverse().toArray();
}

export async function getMeasureById(id) {
  return db.medidas.get(id);
}

export async function saveMeasure(measure) {
  const record = {
    id: measure.id || `med_${measure.fecha || dateKey()}_${safeUUID()}`,
    fecha: measure.fecha || dateKey(),
    peso: measure.peso === '' || measure.peso == null ? '' : Number(measure.peso),
    cintura: measure.cintura === '' || measure.cintura == null ? '' : Number(measure.cintura),
    cadera: measure.cadera === '' || measure.cadera == null ? '' : Number(measure.cadera),
    muslo: measure.muslo === '' || measure.muslo == null ? '' : Number(measure.muslo),
    brazo: measure.brazo === '' || measure.brazo == null ? '' : Number(measure.brazo),
    grasa: measure.grasa === '' || measure.grasa == null ? '' : Number(measure.grasa),
    notas: measure.notas || ''
  };
  await db.medidas.put(record);
  return record;
}

export async function deleteMeasure(id) {
  await db.medidas.delete(id);
}

export async function clearAllData() {
  await db.sesiones.clear();
  await db.medidas.clear();
  await db.rutinas.clear();
  await db.ajustes.clear();
  await seedDatabase();
}

export async function exportDataBundle() {
  const [rutinas, sesiones, medidas, ajustes] = await Promise.all([
    db.rutinas.toArray(),
    db.sesiones.toArray(),
    db.medidas.toArray(),
    db.ajustes.toArray()
  ]);
  return {
    version: 1,
    exportado: new Date().toISOString(),
    rutinas,
    sesiones,
    medidas,
    ajustes
  };
}

export async function importDataBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('El archivo JSON no tiene un formato válido.');
  }
  await db.transaction('rw', db.rutinas, db.sesiones, db.medidas, db.ajustes, async () => {
    await db.rutinas.clear();
    await db.sesiones.clear();
    await db.medidas.clear();
    await db.ajustes.clear();
    if (Array.isArray(bundle.rutinas)) await db.rutinas.bulkPut(bundle.rutinas.map(normalizeRoutine));
    if (Array.isArray(bundle.sesiones)) await db.sesiones.bulkPut(bundle.sesiones.map(normalizeSession));
    if (Array.isArray(bundle.medidas)) await db.medidas.bulkPut(bundle.medidas);
    if (Array.isArray(bundle.ajustes)) await db.ajustes.bulkPut(bundle.ajustes);
  });
  await seedDatabase();
}

import { db, exportDataBundle, importDataBundle, listMeasures, listRoutines, listSessions } from './db.js';
import { downloadBlob, escapeHtml, toast } from './ui.js';

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function withBom(text) {
  return `\ufeff${text}`;
}

function seriesRowsForSession(session) {
  const rows = [];
  (session.ejercicios || []).forEach((exercise) => {
    (exercise.series || []).forEach((serie, index) => {
      rows.push({
        fecha: session.fecha,
        dia: session.diaNombre,
        ejercicio: exercise.nombre,
        tipo: exercise.tipo || 'reps',
        serie: index + 1,
        peso: serie.peso ?? '',
        reps: serie.reps ?? '',
        rpe: serie.rpe ?? '',
        tiempo_seg: serie.tiempoSeg ?? '',
        estado: exercise.estado || 'pendiente',
        razon_salto: exercise.razonSalto || '',
        rpe_promedio: exercise.rpePromedio ?? '',
        hora_inicio: session.horaInicio || '',
        hora_fin: session.horaFin || '',
        duracion_min: session.duracionMin ?? '',
        energia: session.energia ?? '',
        notas: session.notas || ''
      });
    });
  });
  return rows;
}

export async function buildSessionsCsv() {
  const sessions = await listSessions();
  const headers = ['fecha', 'dia', 'ejercicio', 'tipo', 'serie', 'peso', 'reps', 'rpe', 'tiempo_seg', 'estado', 'razon_salto', 'rpe_promedio', 'hora_inicio', 'hora_fin', 'duracion_min'];
  const lines = [headers.join(',')];
  sessions.forEach((session) => {
    seriesRowsForSession(session).forEach((row) => {
      lines.push(headers.map((header) => csvEscape(row[header])).join(','));
    });
  });
  return withBom(lines.join('\n'));
}

export async function buildMeasuresCsv() {
  const measures = await listMeasures();
  const headers = ['fecha', 'peso', 'cintura', 'cadera', 'muslo', 'brazo', 'grasa', 'notas'];
  const lines = [headers.join(',')];
  measures.forEach((measure) => {
    lines.push(headers.map((header) => csvEscape(measure[header] ?? '')).join(','));
  });
  return withBom(lines.join('\n'));
}

function routineRows(routine) {
  const rows = [];
  (routine.dias || []).forEach((day) => {
    if (day.esDescanso) {
      rows.push({
        rutina: routine.nombre,
        dia: day.nombre,
        enfoque: day.enfoque || '',
        tipo: 'descanso',
        ejercicio: '',
        series: '',
        reps: '',
        nota: ''
      });
      return;
    }
    (day.ejercicios || []).forEach((exercise) => {
      rows.push({
        rutina: routine.nombre,
        dia: day.nombre,
        enfoque: day.enfoque || '',
        tipo: exercise.tipo || 'reps',
        ejercicio: exercise.nombre,
        series: exercise.series ?? '',
        reps: exercise.reps ?? '',
        nota: exercise.nota || ''
      });
    });
    if (!day.ejercicios?.length) {
      rows.push({
        rutina: routine.nombre,
        dia: day.nombre,
        enfoque: day.enfoque || '',
        tipo: 'ejercicio',
        ejercicio: '',
        series: '',
        reps: '',
        nota: ''
      });
    }
  });
  return rows;
}

function styleHeader(sheet) {
  const range = sheet['!ref'];
  if (!range) return;
  const match = range.match(/^[A-Z]+1:[A-Z]+\d+$/);
  if (!match) return;
  const firstRow = XLSX.utils.decode_range(range).s.r.y;
  const decoded = XLSX.utils.decode_range(range);
  for (let col = decoded.s.c; col <= decoded.e.c; col += 1) {
    const cellRef = XLSX.utils.encode_cell({ r: firstRow, c: col });
    const cell = sheet[cellRef];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'C98B9B' } },
        alignment: { horizontal: 'center' }
      };
    }
  }
}

function autoWidth(rows) {
  const widths = [];
  rows.forEach((row) => {
    Object.keys(row).forEach((key, index) => {
      const length = String(row[key] ?? '').length + 2;
      widths[index] = Math.max(widths[index] || 0, length);
    });
  });
  return widths.map((width) => ({ wch: Math.min(Math.max(width, 10), 42) }));
}

export async function buildWorkbook() {
  const sessions = await listSessions();
  const measures = await listMeasures();
  const routines = await listRoutines();
  const sessionRows = sessions.flatMap(seriesRowsForSession);
  const measureRows = measures.map((measure) => ({
    fecha: measure.fecha,
    peso: measure.peso ?? '',
    cintura: measure.cintura ?? '',
    cadera: measure.cadera ?? '',
    muslo: measure.muslo ?? '',
    brazo: measure.brazo ?? '',
    grasa: measure.grasa ?? '',
    notas: measure.notas || ''
  }));
  const routineRowsData = routines.flatMap(routineRows);

  const workbook = XLSX.utils.book_new();
  const sessionsSheet = XLSX.utils.json_to_sheet(sessionRows);
  const measuresSheet = XLSX.utils.json_to_sheet(measureRows);
  const routinesSheet = XLSX.utils.json_to_sheet(routineRowsData);

  styleHeader(sessionsSheet);
  styleHeader(measuresSheet);
  styleHeader(routinesSheet);

  sessionsSheet['!cols'] = autoWidth(sessionRows.length ? sessionRows : [{ fecha: '', dia: '', ejercicio: '', tipo: '', serie: '', peso: '', reps: '', rpe: '', tiempo_seg: '', estado: '', razon_salto: '', rpe_promedio: '', hora_inicio: '', hora_fin: '', duracion_min: '' }]);
  measuresSheet['!cols'] = autoWidth(measureRows.length ? measureRows : [{ fecha: '', peso: '', cintura: '', cadera: '', muslo: '', brazo: '', grasa: '', notas: '' }]);
  routinesSheet['!cols'] = autoWidth(routineRowsData.length ? routineRowsData : [{ rutina: '', dia: '', enfoque: '', tipo: '', ejercicio: '', series: '', reps: '', nota: '' }]);

  XLSX.utils.book_append_sheet(workbook, sessionsSheet, 'Sesiones');
  XLSX.utils.book_append_sheet(workbook, measuresSheet, 'Medidas');
  XLSX.utils.book_append_sheet(workbook, routinesSheet, 'Rutina');
  return workbook;
}

export async function downloadSessionsCsvFile() {
  const csv = await buildSessionsCsv();
  downloadBlob(csv, 'gymwolf-sesiones.csv', 'text/csv;charset=utf-8');
}

export async function downloadMeasuresCsvFile() {
  const csv = await buildMeasuresCsv();
  downloadBlob(csv, 'gymwolf-medidas.csv', 'text/csv;charset=utf-8');
}

export async function downloadWorkbookFile() {
  const workbook = await buildWorkbook();
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'gymwolf-export.xlsx');
}

export async function downloadBackupJsonFile() {
  const payload = await exportDataBundle();
  downloadBlob(JSON.stringify(payload, null, 2), 'gymwolf-backup.json', 'application/json;charset=utf-8');
}

export async function importBackupFromFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  await importDataBundle(payload);
  toast('Importación completa', 'Los datos se restauraron correctamente.', 'success');
}

export async function replaceAllDataFromFile(file) {
  await importBackupFromFile(file);
}

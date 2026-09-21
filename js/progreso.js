import { listMeasures, listSessions, getSetting, setSetting } from './db.js';
import { colorWithAlpha, cssVar, emptyState, escapeHtml, formatDateLong, formatNumber, formatWeight, icon } from './ui.js';

let chartsInstancia = [];

function destruirGraficos() {
  chartsInstancia.forEach((chart) => {
    try {
      chart?.destroy?.();
    } catch {
      // Ignore chart teardown errors.
    }
  });
  chartsInstancia = [];
}

function chartWrapperMarkup(canvasId) {
  return `
    <div class="chart-wrapper">
      <canvas id="${canvasId}"></canvas>
    </div>
  `;
}

function rangeDays(range) {
  const map = { '1M': 30, '3M': 90, '6M': 180, '1A': 365 };
  return map[range] || null;
}

function startDateFromRange(range) {
  const days = rangeDays(range);
  if (!days) return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function endDate() {
  return new Date().toISOString().slice(0, 10);
}

function groupByWeek(sessions) {
  const weeks = new Map();
  sessions.forEach((session) => {
    const date = new Date(`${session.fecha}T00:00:00`);
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().slice(0, 10);
    const total = (session.ejercicios || []).reduce((sum, exercise) => sum + (exercise.series || []).reduce((exerciseSum, serie) => {
      const weight = Number(serie.peso || 0);
      const reps = Number(serie.reps || 0);
      return exerciseSum + (Number.isFinite(weight) && Number.isFinite(reps) ? weight * reps : 0);
    }, 0), 0);
    weeks.set(weekKey, (weeks.get(weekKey) || 0) + total);
  });
  return Array.from(weeks.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function exerciseList(sessions) {
  return Array.from(new Set(sessions.flatMap((session) => (session.ejercicios || []).map((exercise) => exercise.nombre)))).sort((a, b) => a.localeCompare(b));
}

function measureData(measures, metric) {
  return measures.map((measure) => ({ label: measure.fecha, value: Number(measure[metric] || 0) }));
}

function strengthData(sessions, exerciseName) {
  return sessions.map((session) => {
    const exercise = (session.ejercicios || []).find((item) => item.nombre === exerciseName);
    const max = exercise ? Math.max(...(exercise.series || []).map((serie) => Number(serie.peso || 0)), 0) : 0;
    return { label: session.fecha, value: max };
  });
}

function heatmapData(sessions) {
  const map = new Map();
  sessions.forEach((session) => {
    map.set(session.fecha, (map.get(session.fecha) || 0) + 1);
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (89 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, value: map.get(key) || 0 };
  });
}

function volumeData(sessions) {
  return groupByWeek(sessions).map(([week, value]) => ({ label: week, value }));
}

function heatLevel(value) {
  if (value >= 4) return 4;
  if (value === 3) return 3;
  if (value === 2) return 2;
  if (value === 1) return 1;
  return 0;
}

export async function renderProgressPage(container) {
  destruirGraficos();
  const range = await getSetting('progresoRango', '3M');
  const metric = await getSetting('progresoMetric', 'peso');
  const [measuresAll, sessionsAll] = await Promise.all([listMeasures(), listSessions()]);
  const from = startDateFromRange(range);
  const measures = measuresAll.filter((measure) => !from || measure.fecha >= from);
  const sessions = sessionsAll.filter((session) => !from || session.fecha >= from);
  const exercises = exerciseList(sessions);
  const selectedExercise = await getSetting('progresoEjercicio', exercises[0] || '');
  const heatmap = heatmapData(sessionsAll);

  container.innerHTML = `
    <section class="module page-enter stack">
      <header class="module-header">
      <div>
        <h1 class="page-title">Progreso</h1>
        <p class="page-lead">Tendencias, fuerza y frecuencia en un vistazo.</p>
      </div>
      <div class="segmented" role="tablist" aria-label="Rango de progreso">
        ${['1M', '3M', '6M', '1A', 'Todo'].map((label) => `<button type="button" data-range="${label === 'Todo' ? 'all' : label}" class="${(label === 'Todo' ? 'all' : label) === range ? 'active' : ''}">${label}</button>`).join('')}
      </div>
      </header>

    <section class="grid cols-2 page-enter">
      <article class="chart-card stack">
        <div class="helper-row"><div><h2 class="page-title" style="font-size:1.15rem;margin:0;">Peso corporal</h2><p class="page-lead">Últimos registros</p></div></div>
        ${measures.length ? chartWrapperMarkup('weight-chart') : emptyState({ iconName: 'measures', title: 'Sin datos', message: 'Agrega mediciones para ver la tendencia.' })}
      </article>
      <article class="chart-card stack">
        <div class="helper-row"><div><h2 class="page-title" style="font-size:1.15rem;margin:0;">Cintura</h2><p class="page-lead">Evolución de perímetro</p></div></div>
        ${measures.length ? chartWrapperMarkup('waist-chart') : emptyState({ iconName: 'measures', title: 'Sin datos', message: 'Agrega mediciones para ver la tendencia.' })}
      </article>
      <article class="chart-card stack">
        <div class="helper-row">
          <div><h2 class="page-title" style="font-size:1.15rem;margin:0;">Fuerza por ejercicio</h2><p class="page-lead">Máximo peso por sesión</p></div>
          <select id="strength-select" class="select" style="max-width:240px;">
            ${exercises.length ? exercises.map((exercise) => `<option value="${escapeHtml(exercise)}" ${exercise === selectedExercise ? 'selected' : ''}>${escapeHtml(exercise)}</option>`).join('') : '<option value="">Sin ejercicios</option>'}
          </select>
        </div>
        ${sessions.length && selectedExercise ? chartWrapperMarkup('strength-chart') : emptyState({ iconName: 'progress', title: 'Sin fuerza registrada', message: 'Entrena y guarda series para graficar.' })}
      </article>
      <article class="chart-card stack">
        <div class="helper-row"><div><h2 class="page-title" style="font-size:1.15rem;margin:0;">Volumen semanal</h2><p class="page-lead">Suma de peso x reps</p></div></div>
        ${sessions.length ? chartWrapperMarkup('volume-chart') : emptyState({ iconName: 'progress', title: 'Sin sesiones', message: 'Registra entrenos para calcular el volumen.' })}
      </article>
    </section>

    <section class="card page-enter stack">
      <div class="helper-row">
        <div>
          <h2 class="page-title" style="font-size:1.15rem;margin:0;">Frecuencia 90 días</h2>
          <p class="page-lead">Mapa tipo GitHub con sesiones por día</p>
        </div>
        <div class="legend"><span class="legend-swatch level-0"></span><span>0</span><span class="legend-swatch level-1"></span><span>1</span><span class="legend-swatch level-2"></span><span>2</span><span class="legend-swatch level-3"></span><span>3+</span></div>
      </div>
      <div class="heatmap">${heatmap.map((cell) => `<div class="day level-${heatLevel(cell.value)}" title="${cell.date}: ${cell.value} sesiones"></div>`).join('')}</div>
    </section>

    <section class="card page-enter stack">
      <div class="helper-row"><h2 class="page-title" style="font-size:1.15rem;margin:0;">Resumen</h2><span class="badge">${sessions.length} sesiones filtradas</span></div>
      <div class="grid cols-3">
        <div class="stat-card"><div class="stat-label">Peso reciente</div><div class="stat-value">${measures[0] ? formatWeight(measures[0].peso, 'kg') : '—'}</div></div>
        <div class="stat-card"><div class="stat-label">Sesiones</div><div class="stat-value">${sessions.length}</div></div>
        <div class="stat-card"><div class="stat-label">Ejercicio destacado</div><div class="stat-value">${selectedExercise || '—'}</div></div>
      </div>
    </section>
    </section>
  `;

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    resizeDelay: 200,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(138, 122, 128, 0.12)' } },
      x: { grid: { display: false } }
    }
  };

  const destroyable = [];
  if (measures.length) {
    const weightCanvas = container.querySelector('#weight-chart');
    const waistCanvas = container.querySelector('#waist-chart');
    if (weightCanvas) {
      destroyable.push(new Chart(weightCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: measures.map((measure) => measure.fecha),
          datasets: [{ label: 'Peso', data: measures.map((measure) => Number(measure.peso || 0)), borderColor: cssVar('--primary'), backgroundColor: colorWithAlpha(cssVar('--primary'), 0.14), fill: true, tension: 0.3 }]
        },
        options: lineOptions
      }));
    }
    if (waistCanvas) {
      destroyable.push(new Chart(waistCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: measures.map((measure) => measure.fecha),
          datasets: [{ label: 'Cintura', data: measures.map((measure) => Number(measure.cintura || 0)), borderColor: cssVar('--warning'), backgroundColor: colorWithAlpha(cssVar('--warning'), 0.12), fill: true, tension: 0.3 }]
        },
        options: lineOptions
      }));
    }
  }

  if (sessions.length && selectedExercise) {
    const strengthCanvas = container.querySelector('#strength-chart');
    if (strengthCanvas) {
      destroyable.push(new Chart(strengthCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: sessions.map((session) => session.fecha),
          datasets: [{ label: selectedExercise, data: strengthData(sessions, selectedExercise).map((point) => point.value), borderColor: cssVar('--accent'), backgroundColor: colorWithAlpha(cssVar('--accent'), 0.12), fill: true, tension: 0.3 }]
        },
        options: lineOptions
      }));
    }
  }

  if (sessions.length) {
    const volumeCanvas = container.querySelector('#volume-chart');
    if (volumeCanvas) {
      const weekly = volumeData(sessions);
      destroyable.push(new Chart(volumeCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: weekly.map((item) => item.label),
          datasets: [{ label: 'Volumen', data: weekly.map((item) => item.value), backgroundColor: colorWithAlpha(cssVar('--primary'), 0.75) }]
        },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 300 }, resizeDelay: 200, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(138, 122, 128, 0.12)' } }, x: { grid: { display: false } } } }
      }));
    }
  }

  container.querySelectorAll('[data-range]').forEach((button) => {
    button.addEventListener('click', async () => {
      await setSetting('progresoRango', button.getAttribute('data-range'));
      await renderProgressPage(container);
    });
  });

  container.querySelector('#strength-select')?.addEventListener('change', async (event) => {
    await setSetting('progresoEjercicio', event.target.value);
    await renderProgressPage(container);
  });

  chartsInstancia = destroyable;
  container.__charts = destroyable;
}

export { destruirGraficos };

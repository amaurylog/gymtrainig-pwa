import { deleteMeasure, getMeasureById, listMeasures, saveMeasure } from './db.js';
import { colorWithAlpha, cssVar, confirmDialog, escapeHtml, formatDateLong, formatNumber, formatWeight, icon, toast } from './ui.js';

function formValue(value) {
  return value == null ? '' : String(value);
}

function metricOptions() {
  return [
    { value: 'peso', label: 'Peso' },
    { value: 'cintura', label: 'Cintura' },
    { value: 'cadera', label: 'Cadera' },
    { value: 'muslo', label: 'Muslo' },
    { value: 'brazo', label: 'Brazo' },
    { value: 'grasa', label: '% grasa' }
  ];
}

function metricLabel(metric) {
  return metricOptions().find((option) => option.value === metric)?.label || metric;
}

function buildChartData(measures, metric) {
  return {
    labels: measures.map((measure) => measure.fecha),
    values: measures.map((measure) => Number(measure[metric] || 0))
  };
}

export async function renderMeasuresPage(container) {
  const measures = await listMeasures();
  if (container.__chart) {
    container.__chart.destroy();
    container.__chart = null;
  }
  const metric = window.localStorage?.getItem('gymwolf-metric') || 'peso';
  let editingId = null;
  let chart = null;

  container.innerHTML = `
    <section class="page-header page-enter">
      <div>
        <h1 class="page-title">Medidas</h1>
        <p class="page-lead">Peso, cintura, cadera y más en un solo historial.</p>
      </div>
      <div class="toolbar">
        <div class="badge success">${measures[0] ? `Última medición: ${formatDateLong(measures[0].fecha)}` : 'Sin mediciones'}</div>
        <div class="badge">${measures[0] ? `Han pasado ${Math.max(0, Math.round((Date.now() - new Date(`${measures[0].fecha}T00:00:00`).getTime()) / 86400000))} días` : 'Registra tu primera medición'}</div>
      </div>
    </section>

    <section class="card page-enter stack">
      <div class="helper-row">
        <h2 class="page-title" style="font-size:1.15rem;margin:0;">Nuevo registro</h2>
        <span class="badge">Los valores se guardan al momento</span>
      </div>
      <form id="measure-form" class="form-grid two">
        <div><label class="field-label" for="measure-date">Fecha</label><input id="measure-date" class="input" type="date" value="${measures[0]?.fecha || new Date().toISOString().slice(0, 10)}" /></div>
        <div><label class="field-label" for="measure-peso">Peso</label><input id="measure-peso" class="input" inputmode="decimal" type="number" step="0.1" /></div>
        <div><label class="field-label" for="measure-cintura">Cintura</label><input id="measure-cintura" class="input" inputmode="decimal" type="number" step="0.1" /></div>
        <div><label class="field-label" for="measure-cadera">Cadera</label><input id="measure-cadera" class="input" inputmode="decimal" type="number" step="0.1" /></div>
        <div><label class="field-label" for="measure-muslo">Muslo</label><input id="measure-muslo" class="input" inputmode="decimal" type="number" step="0.1" /></div>
        <div><label class="field-label" for="measure-brazo">Brazo</label><input id="measure-brazo" class="input" inputmode="decimal" type="number" step="0.1" /></div>
        <div><label class="field-label" for="measure-grasa">% grasa</label><input id="measure-grasa" class="input" inputmode="decimal" type="number" step="0.1" /></div>
        <div><label class="field-label" for="measure-notes">Notas</label><input id="measure-notes" class="input" /></div>
        <div class="hstack"><button class="btn" type="submit">${icon('check')} Guardar medición</button><button class="btn light" type="button" id="measure-clear">Limpiar</button></div>
      </form>
    </section>

    <section class="grid cols-2 page-enter">
      <article class="chart-card stack">
        <div class="helper-row">
          <div><h2 class="page-title" style="font-size:1.15rem;margin:0;">Tendencia</h2><p class="page-lead">Selecciona la métrica a graficar</p></div>
          <select id="metric-select" class="select" style="max-width:180px;">
            ${metricOptions().map((option) => `<option value="${option.value}" ${option.value === metric ? 'selected' : ''}>${option.label}</option>`).join('')}
          </select>
        </div>
        <div style="min-height:280px;">${measures.length ? '<canvas id="measures-chart" class="aspect-4-3"></canvas>' : '<div class="empty-state"><p class="page-lead">No hay datos todavía.</p></div>'}</div>
      </article>
      <article class="card stack">
        <div class="helper-row"><h2 class="page-title" style="font-size:1.15rem;margin:0;">Resumen</h2><span class="badge">${measures.length} registros</span></div>
        <p class="page-lead">La medición más reciente es <strong>${measures[0] ? formatWeight(measures[0].peso, 'kg') : 'n/a'}</strong>.</p>
        <div class="stat-card"><div class="stat-label">Siguiente paso</div><div class="stat-value">${measures.length ? 'Mantén la frecuencia' : 'Empieza hoy'}</div><div class="stat-note">Tomar medidas cada 7-14 días suele bastar.</div></div>
      </article>
    </section>

    <section class="card page-enter stack">
      <div class="helper-row"><h2 class="page-title" style="font-size:1.15rem;margin:0;">Historial</h2><span class="badge">Editar y eliminar</span></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th>Cadera</th><th>Muslo</th><th>Brazo</th><th>% grasa</th><th>Notas</th><th></th></tr>
          </thead>
          <tbody>
            ${measures.length ? measures.map((measure) => `
              <tr data-measure-id="${measure.id}">
                <td>${escapeHtml(measure.fecha)}</td>
                <td>${formatNumber(measure.peso, 1)}</td>
                <td>${formatNumber(measure.cintura, 1)}</td>
                <td>${formatNumber(measure.cadera, 1)}</td>
                <td>${formatNumber(measure.muslo, 1)}</td>
                <td>${formatNumber(measure.brazo, 1)}</td>
                <td>${formatNumber(measure.grasa, 1)}</td>
                <td>${escapeHtml(measure.notas || '')}</td>
                <td class="hstack"><button class="icon-btn" type="button" data-action="edit">${icon('edit')}</button><button class="icon-btn" type="button" data-action="delete">${icon('trash')}</button></td>
              </tr>
            `).join('') : '<tr><td colspan="9"><div class="empty-state" style="padding:12px 0;">Sin datos aún.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;

  const form = container.querySelector('#measure-form');
  const chartMetricSelect = container.querySelector('#metric-select');

  const chartData = buildChartData(measures.slice().reverse(), metric);
  if (measures.length) {
    const canvas = container.querySelector('#measures-chart');
    if (canvas) {
      chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: metricLabel(metric),
            data: chartData.values,
            borderColor: cssVar('--primary'),
            backgroundColor: colorWithAlpha(cssVar('--primary'), 0.16),
            fill: true,
            tension: 0.3,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(138, 122, 128, 0.12)' } },
            x: { grid: { display: false } }
          }
        }
      });
      container.__chart = chart;
    }
  }

  function fillForm(measure = {}) {
    form.querySelector('#measure-date').value = measure.fecha || new Date().toISOString().slice(0, 10);
    form.querySelector('#measure-peso').value = measure.peso ?? '';
    form.querySelector('#measure-cintura').value = measure.cintura ?? '';
    form.querySelector('#measure-cadera').value = measure.cadera ?? '';
    form.querySelector('#measure-muslo').value = measure.muslo ?? '';
    form.querySelector('#measure-brazo').value = measure.brazo ?? '';
    form.querySelector('#measure-grasa').value = measure.grasa ?? '';
    form.querySelector('#measure-notes').value = measure.notas ?? '';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      id: editingId || undefined,
      fecha: form.querySelector('#measure-date').value,
      peso: form.querySelector('#measure-peso').value,
      cintura: form.querySelector('#measure-cintura').value,
      cadera: form.querySelector('#measure-cadera').value,
      muslo: form.querySelector('#measure-muslo').value,
      brazo: form.querySelector('#measure-brazo').value,
      grasa: form.querySelector('#measure-grasa').value,
      notas: form.querySelector('#measure-notes').value
    };
    await saveMeasure(payload);
    toast('Medición guardada', 'Se actualizó el historial.', 'success');
    editingId = null;
    fillForm();
    await renderMeasuresPage(container);
  });

  container.querySelector('#measure-clear')?.addEventListener('click', () => {
    editingId = null;
    fillForm();
  });

  chartMetricSelect?.addEventListener('change', async (event) => {
    window.localStorage?.setItem('gymwolf-metric', event.target.value);
    await renderMeasuresPage(container);
  });

  container.querySelectorAll('tr[data-measure-id]').forEach((row) => {
    const measureId = row.getAttribute('data-measure-id');
    row.querySelector('[data-action="edit"]')?.addEventListener('click', async () => {
      const measure = await getMeasureById(measureId);
      if (!measure) return;
      editingId = measure.id;
      fillForm(measure);
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const accepted = await confirmDialog({
        title: 'Eliminar medición',
        message: 'La medición se quitará del historial.',
        confirmText: 'Eliminar',
        danger: true
      });
      if (!accepted) return;
      await deleteMeasure(measureId);
      toast('Medición eliminada', 'El registro fue borrado.', 'success');
      await renderMeasuresPage(container);
    });
  });

  fillForm(measures[0] || {});
}

import { deleteSession, listSessions } from './db.js';
import { confirmDialog, escapeHtml, formatDateLong, formatMinutes, formatTime, icon, toast, showModal } from './ui.js';

function topExercises(session) {
  return (session.ejercicios || []).slice(0, 3).map((exercise) => exercise.nombre).join(' · ') || 'Sin ejercicios';
}

function sessionDetailsHtml(session) {
  return `
    <div class="stack">
      <div class="grid cols-4">
        <div class="stat-card"><div class="stat-label">Fecha</div><div class="stat-value">${escapeHtml(session.fecha)}</div></div>
        <div class="stat-card"><div class="stat-label">Horario</div><div class="stat-value">${formatTime(session.horaInicio)} - ${formatTime(session.horaFin)}</div></div>
        <div class="stat-card"><div class="stat-label">Duración</div><div class="stat-value">${formatMinutes(session.duracionMin)}</div></div>
        <div class="stat-card"><div class="stat-label">Energía</div><div class="stat-value">${session.energia || '—'}</div></div>
      </div>
      <div class="card stack">
        <strong>Notas</strong>
        <p class="page-lead">${escapeHtml(session.notas || 'Sin notas')}</p>
      </div>
      <div class="stack">
        <h3 class="page-title" style="font-size:1.1rem;margin:0;">Ejercicios</h3>
        ${(session.ejercicios || []).map((exercise) => `
          <article class="card stack">
            <div class="helper-row"><strong>${escapeHtml(exercise.nombre)}</strong><span class="badge">${exercise.series?.length || 0} series</span></div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>#</th><th>Peso</th><th>Reps</th><th>RPE</th><th>Hecho</th></tr></thead>
                <tbody>
                  ${(exercise.series || []).map((serie, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(serie.peso)}</td><td>${escapeHtml(serie.reps)}</td><td>${escapeHtml(serie.rpe)}</td><td>${serie.hecho ? 'Sí' : 'No'}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </article>
        `).join('')}
      </div>
      <div class="stack">
        <h3 class="page-title" style="font-size:1.1rem;margin:0;">Core</h3>
        ${(session.core || []).map((item) => `<div class="card hstack" style="justify-content:space-between;"><strong>${escapeHtml(item.nombre)}</strong><span class="badge ${item.hecho ? 'success' : ''}">${item.hecho ? 'Hecho' : 'Pendiente'}</span></div>`).join('')}
      </div>
    </div>
  `;
}

export async function renderHistoryPage(container) {
  const sessions = await listSessions();
  const exerciseNames = Array.from(new Set(sessions.flatMap((session) => (session.ejercicios || []).map((exercise) => exercise.nombre))));

  container.innerHTML = `
    <section class="page-header page-enter">
      <div>
        <h1 class="page-title">Historial</h1>
        <p class="page-lead">Sesiones pasadas con detalle y filtros rápidos.</p>
      </div>
      <div class="toolbar">
        <input class="input" id="filter-from" type="date" />
        <input class="input" id="filter-to" type="date" />
        <select class="select" id="filter-day">
          <option value="all">Todos los días</option>
          <option value="lunes">Lunes</option>
          <option value="martes">Martes</option>
          <option value="miercoles">Miércoles</option>
          <option value="jueves">Jueves</option>
          <option value="viernes">Viernes</option>
          <option value="sabado">Sábado</option>
          <option value="domingo">Domingo</option>
        </select>
        <select class="select" id="filter-exercise">
          <option value="all">Todos los ejercicios</option>
          ${exerciseNames.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}
        </select>
      </div>
    </section>

    <section class="stack" id="history-list">
      ${sessions.length ? sessions.map((session) => `
        <article class="history-card page-enter" data-session-id="${session.id}">
          <div class="helper-row">
            <div>
              <h2 class="page-title" style="font-size:1.15rem;margin:0;">${formatDateLong(session.fecha)}</h2>
              <p class="page-lead">${escapeHtml(session.diaNombre)} · ${formatTime(session.horaInicio)} - ${formatTime(session.horaFin)}</p>
            </div>
            <div class="toolbar">
              <span class="badge success">${formatMinutes(session.duracionMin)}</span>
              <button class="icon-btn" type="button" data-action="open">${icon('search')}</button>
              <button class="icon-btn" type="button" data-action="delete">${icon('trash')}</button>
            </div>
          </div>
          <p class="page-lead"><strong>Top 3:</strong> ${escapeHtml(topExercises(session))}</p>
        </article>
      `).join('') : '<div class="empty-state"><p class="page-lead">Aún no hay sesiones registradas.</p></div>'}
    </section>
  `;

  const list = container.querySelector('#history-list');
  const filters = {
    from: container.querySelector('#filter-from'),
    to: container.querySelector('#filter-to'),
    day: container.querySelector('#filter-day'),
    exercise: container.querySelector('#filter-exercise')
  };

  const applyFilters = async () => {
    const filtered = await listSessions({
      from: filters.from.value || undefined,
      to: filters.to.value || undefined,
      diaId: filters.day.value,
      exercise: filters.exercise.value
    });
    list.innerHTML = filtered.length ? filtered.map((session) => `
      <article class="history-card page-enter" data-session-id="${session.id}">
        <div class="helper-row">
          <div>
            <h2 class="page-title" style="font-size:1.15rem;margin:0;">${formatDateLong(session.fecha)}</h2>
            <p class="page-lead">${escapeHtml(session.diaNombre)} · ${formatTime(session.horaInicio)} - ${formatTime(session.horaFin)}</p>
          </div>
          <div class="toolbar">
            <span class="badge success">${formatMinutes(session.duracionMin)}</span>
            <button class="icon-btn" type="button" data-action="open">${icon('search')}</button>
            <button class="icon-btn" type="button" data-action="delete">${icon('trash')}</button>
          </div>
        </div>
        <p class="page-lead"><strong>Top 3:</strong> ${escapeHtml(topExercises(session))}</p>
      </article>
    `).join('') : '<div class="empty-state"><p class="page-lead">No hay sesiones para ese filtro.</p></div>';
    bindRows();
  };

  const bindRows = () => {
    list.querySelectorAll('[data-session-id]').forEach((card) => {
      const sessionId = card.getAttribute('data-session-id');
      const session = sessions.find((item) => item.id === sessionId);
      card.querySelector('[data-action="open"]')?.addEventListener('click', () => {
        showModal({
          title: `${session.diaNombre} · ${session.fecha}`,
          content: sessionDetailsHtml(session),
          maxWidth: 900
        });
      });
      card.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
        const accepted = await confirmDialog({
          title: 'Eliminar sesión',
          message: 'Esta sesión se quitará del historial.',
          confirmText: 'Eliminar',
          danger: true
        });
        if (!accepted) return;
        await deleteSession(sessionId);
        toast('Sesión eliminada', 'La sesión fue borrada.', 'success');
        await renderHistoryPage(container);
      });
    });
  };

  bindRows();
  Object.values(filters).forEach((input) => input.addEventListener('change', applyFilters));
}

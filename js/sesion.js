import { dateKey, finishSession, getActiveRoutine, getRoutineById, getRoutineDayById, getSetting, getRoutineDayForDate, getTodaySession, startTodaySession, upsertSession } from './db.js';
import { abrirModalSerie, abrirModalSaltar, mostrarResumenSesion } from './serie-modal.js';
import { confirmDialog, debounce, escapeHtml, formatMinutes, formatTime, icon, promptDialog, showModal, toast } from './ui.js';

function blankSeries() {
  return { peso: '', reps: '', rpe: 8, hecho: false, tiempoSeg: 0, inicioSeg: null };
}

function formatSeconds(totalSeconds) {
  const total = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function seriesElapsed(serie) {
  const base = Number(serie.tiempoSeg || 0);
  if (!serie.inicioSeg) return base;
  const extra = Math.max(0, Math.floor((Date.now() - Number(serie.inicioSeg)) / 1000));
  return base + extra;
}

function seriesRowMarkup(exercise, exerciseIndex, serie, serieIndex, unit) {
  const running = Boolean(serie.inicioSeg);
  const elapsed = seriesElapsed(serie);
  return `
    <div class="serie-row ${running ? 'is-running' : ''} ${serie.hecho ? 'is-done' : ''}" data-exercise-index="${exerciseIndex}" data-series-index="${serieIndex}">
      <div class="serie-row-head">
        <div>
          <strong>Serie ${serieIndex + 1}</strong>
          <div class="field-help">${escapeHtml(exercise.nombre)}</div>
        </div>
        <div class="serie-timer" data-series-timer>${formatSeconds(elapsed)}</div>
      </div>

      <div class="serie-grid">
        <div class="field">
          <label class="field-label">Peso (${unit})</label>
          <input class="input" inputmode="decimal" data-series-field="peso" value="${escapeHtml(serie.peso)}" />
        </div>
        <div class="field">
          <label class="field-label">Reps</label>
          <input class="input" inputmode="decimal" data-series-field="reps" value="${escapeHtml(serie.reps)}" />
        </div>
        <div class="field">
          <label class="field-label">RPE</label>
          <input class="input" type="number" min="6" max="10" step="0.5" data-series-field="rpe" value="${escapeHtml(serie.rpe ?? 8)}" />
        </div>
      </div>

      <div class="serie-actions">
        <button class="btn btn-secondary" type="button" data-action="toggle-series-timer">${running ? icon('stop') : icon('start')} ${running ? 'Terminar' : 'Iniciar serie'}</button>
        <button class="btn btn-secondary" type="button" data-action="edit-rpe">${icon('edit')} RPE</button>
        <label class="toggle-row">
          <input type="checkbox" data-series-field="hecho" ${serie.hecho ? 'checked' : ''} />
          <span>Hecha</span>
        </label>
      </div>
    </div>
  `;
}

function exerciseCardMarkup(exercise, exerciseIndex, unit) {
  const seriesMarkup = (exercise.series || []).map((serie, serieIndex) => seriesRowMarkup(exercise, exerciseIndex, serie, serieIndex, unit)).join('');
  return `
    <article class="exercise-card" data-exercise-index="${exerciseIndex}">
      <div class="exercise-head">
        <div>
          <h3 class="exercise-title">${escapeHtml(exercise.nombre || `Ejercicio ${exerciseIndex + 1}`)}</h3>
          <p class="field-help">${escapeHtml(exercise.nota || '')}</p>
        </div>
        <div class="hstack">
          <button class="btn btn-secondary" type="button" data-action="add-series">${icon('plus')} Agregar serie</button>
          <button class="icon-btn" type="button" data-action="delete-exercise" aria-label="Eliminar ejercicio">${icon('trash')}</button>
        </div>
      </div>
      <div class="form-grid two">
        <div>
          <label class="field-label">Nombre</label>
          <input class="input" data-field="nombre" value="${escapeHtml(exercise.nombre)}" />
        </div>
        <div>
          <label class="field-label">Nota</label>
          <input class="input" data-field="nota" value="${escapeHtml(exercise.nota || '')}" />
        </div>
      </div>
      <div class="stack">
        ${seriesMarkup}
      </div>
    </article>
  `;
}

function coreMarkup(coreItems) {
  return coreItems.map((item, index) => `
    <article class="ejercicio-card core-card" data-core-idx="${index}" data-estado="${item.estado || 'pendiente'}">
      <header class="ejercicio-card-header">
        <div class="ejercicio-card-title">
          <span class="ejercicio-num">C${index + 1}</span>
          <div>
            <h3 class="ejercicio-card-nombre">${escapeHtml(item.nombre)}</h3>
            <p class="ejercicio-card-prescripcion">${escapeHtml(item.series)} series × ${escapeHtml(item.reps)}</p>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" data-action="saltar-ejercicio-core">⊘ No lo hice</button>
      </header>
      <ul class="series-registradas"></ul>
      <button class="btn btn-primary btn-full" type="button" data-action="iniciar-serie-core">
        <span aria-hidden="true">▶</span> Iniciar serie 1
      </button>
    </article>
  `).join('');
}

function renderTimer(session) {
  if (!session?.horaInicio) return '00:00';
  const base = new Date(`${session.fecha}T${session.horaInicio}:00`);
  const end = session.horaFin ? new Date(`${session.fecha}T${session.horaFin}:00`) : new Date();
  const minutes = Math.max(0, Math.round((end - base) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${String(rest).padStart(2, '0')} min` : `${rest} min`;
}

function chooseDayModal(routine, currentId) {
  return new Promise((resolve) => {
    let settled = false;
    const dayCards = (routine?.dias || []).map((day) => {
      const selected = day.id === currentId;
      return `
        <button type="button" class="routine-card ${selected ? 'is-selected' : ''}" data-day-id="${day.id}" aria-checked="${selected ? 'true' : 'false'}" role="radio">
          <span class="routine-card-title">${escapeHtml(day.nombre)}</span>
          <span class="routine-card-meta">${escapeHtml(day.enfoque || 'Sin enfoque')} · ${(day.ejercicios || []).length} ejercicios</span>
        </button>
      `;
    }).join('');
    showModal({
      title: 'Elegir rutina de hoy',
      content: `
        <div class="stack">
          <p class="page-lead" style="margin:0;">Selecciona el día que quieres registrar hoy.</p>
          <div class="routine-day-grid" role="radiogroup" aria-label="Días de la rutina">
            ${dayCards}
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" type="button" data-cancel>Cancelar</button>
        <button class="btn btn-primary" type="button" data-confirm>Iniciar</button>
      `,
      maxWidth: 560
    });

    const root = document.getElementById('modal-root');
    const selectedCard = () => root?.querySelector('.routine-card[aria-checked="true"]');
    const close = () => {
      if (root) root.innerHTML = '';
    };
    const finish = (value) => {
      if (settled) return;
      settled = true;
      close();
      resolve(value);
    };
    root?.querySelector('[data-cancel]')?.addEventListener('click', () => {
      finish(null);
    });
    root?.querySelector('[data-confirm]')?.addEventListener('click', () => finish(selectedCard()?.dataset.dayId || null));
    root?.querySelector('[data-close-modal]')?.addEventListener('click', () => finish(null));
    root?.querySelector('.modal-backdrop')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) finish(null);
    });
    root?.querySelectorAll('.routine-card').forEach((card) => {
      card.addEventListener('click', () => {
        root.querySelectorAll('.routine-card').forEach((other) => {
          other.classList.remove('is-selected');
          other.setAttribute('aria-checked', 'false');
        });
        card.classList.add('is-selected');
        card.setAttribute('aria-checked', 'true');
      });
    });
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        document.removeEventListener('keydown', handleEscape);
        finish(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

async function startChosenRoutine(routine, currentDayId) {
  const selectedDayId = await chooseDayModal(routine, currentDayId);
  if (!selectedDayId) return null;
  const session = await startTodaySession(routine.id, { force: true, dayId: selectedDayId });
  toast('Sesión iniciada', 'El día elegido quedó registrado.', 'success');
  document.dispatchEvent(new CustomEvent('gw:sesion-creada', { detail: { sessionId: session.id, dayId: selectedDayId } }));
  return session;
}

async function startSeries(session, exerciseIndex, serieIndex) {
  const series = session.ejercicios[exerciseIndex]?.series?.[serieIndex];
  if (!series || series.inicioSeg) return;
  series.inicioSeg = Date.now();
  await upsertSession(session);
}

async function stopSeries(session, exerciseIndex, serieIndex) {
  const series = session.ejercicios[exerciseIndex]?.series?.[serieIndex];
  if (!series?.inicioSeg) return;
  series.tiempoSeg = seriesElapsed(series);
  series.inicioSeg = null;
  series.hecho = true;
  await upsertSession(session);

  const rpe = await promptDialog({
    title: 'RPE de la serie',
    message: 'Escribe el esfuerzo percibido entre 6 y 10.',
    defaultValue: String(series.rpe ?? 8),
    confirmText: 'Guardar'
  });
  if (rpe != null) {
    series.rpe = Number(rpe);
    await upsertSession(session);
  }
}

function updateSeriesTimers(container, session) {
  container.querySelectorAll('[data-exercise-index][data-series-index]').forEach((row) => {
    const exerciseIndex = Number(row.getAttribute('data-exercise-index'));
    const serieIndex = Number(row.getAttribute('data-series-index'));
    const series = session.ejercicios?.[exerciseIndex]?.series?.[serieIndex];
    if (!series) return;
    const timer = row.querySelector('[data-series-timer]');
    if (timer) timer.textContent = formatSeconds(seriesElapsed(series));
  });
}

export async function startTodayFlow(context = {}) {
  const [activeRoutine, currentSession] = await Promise.all([
    getActiveRoutine(),
    getTodaySession()
  ]);

  if (currentSession?.horaInicio && !currentSession.horaFin) return currentSession;
  if (!activeRoutine) return null;

  const suggestedDay = currentSession?.diaId || getRoutineDayForDate(activeRoutine, new Date())?.id || activeRoutine.dias?.[0]?.id || '';
  const selected = await startChosenRoutine(activeRoutine, suggestedDay);
  if (!selected) return null;
  await context.refresh?.();
  return selected;
}

export async function renderTodayPage(container, context = {}) {
  if (container.__timer) {
    window.clearInterval(container.__timer);
    container.__timer = null;
  }

  const [session, routine, unit] = await Promise.all([
    getTodaySession(),
    getActiveRoutine(),
    getSetting('unidad', 'kg')
  ]);

  const previewRoutine = (session?.rutinaId ? await getRoutineById(session.rutinaId) : null) || routine || null;
  const day = previewRoutine ? (session?.diaId ? getRoutineDayById(previewRoutine, session.diaId) : getRoutineDayForDate(previewRoutine, new Date())) || { nombre: 'Descanso', enfoque: '', ejercicios: [], core: [], esDescanso: true } : { nombre: 'Descanso', enfoque: '', ejercicios: [], core: [], esDescanso: true };
  const started = Boolean(session?.horaInicio);
  const finished = Boolean(session?.horaFin);
  const activeRoutineName = previewRoutine?.nombre || 'Sin rutina';

  const exerciseCards = ((session?.ejercicios || [])).map((exercise, exerciseIndex) => {
    const seriesRegistradas = Array.isArray(exercise.series) ? exercise.series : [];
    const total = Number(exercise.seriesConfiguradas || seriesRegistradas.length || 1);
    const estado = exercise.estado || (seriesRegistradas.length >= total ? 'completado' : 'pendiente');
    const list = seriesRegistradas.length ? seriesRegistradas.map((serie, serieIndex) => `
      <li class="serie-registrada">
        <span class="serie-check" aria-hidden="true">✓</span>
        <span class="serie-resumen">S${serieIndex + 1} · ${serie.peso != null && serie.peso !== '' ? `${serie.peso} kg` : '—'} × ${serie.reps != null && serie.reps !== '' ? `${serie.reps} reps` : '—'} · RPE ${serie.rpe ?? '—'} · ${formatSeconds(Number(serie.tiempoSeg || 0))}</span>
      </li>
    `).join('') : '<div class="series-vacio">Aún no has registrado ninguna serie</div>';
    const canStart = estado !== 'completado' && estado !== 'saltado' && seriesRegistradas.length < total;
    const buttonText = canStart ? `Iniciar serie ${seriesRegistradas.length + 1} de ${total}` : '';
    const skipButton = estado === 'pendiente' || estado === 'en_curso' ? '<button class="btn btn-ghost btn-sm" type="button" data-action="saltar-ejercicio">⊘ No lo hice</button>' : '';
    const completedBadge = estado === 'completado' ? `<div class="ejercicio-completado-badge"><span aria-hidden="true">✓</span> Completado · RPE promedio ${exercise.rpePromedio ?? '—'}</div>` : '';

    return `
      <article class="ejercicio-card" data-sesion-id="${session.id}" data-ej-idx="${exerciseIndex}" data-estado="${estado}">
        <header class="ejercicio-card-header">
          <div class="ejercicio-card-title">
            <span class="ejercicio-num">${exerciseIndex + 1}</span>
            <div>
              <h3 class="ejercicio-card-nombre">${escapeHtml(exercise.nombre || `Ejercicio ${exerciseIndex + 1}`)}</h3>
              <p class="ejercicio-card-prescripcion">${escapeHtml(exercise.prescripcion || `${total} series × ${exercise.reps || ''}`)}${exercise.nota ? ` · ${escapeHtml(exercise.nota)}` : ''}</p>
            </div>
          </div>
          ${skipButton}
        </header>
        ${list}
        ${completedBadge || (canStart ? `<button class="btn btn-primary btn-full" type="button" data-action="iniciar-serie"><span aria-hidden="true">▶</span> ${buttonText}</button>` : '')}
      </article>
    `;
  }).join('');

  const coreCards = (session?.core || []).map((item, index) => {
    const seriesRegistradas = Array.isArray(item.series) ? item.series : [];
    const total = Number(item.seriesConfiguradas || item.series || 1);
    const estado = item.estado || 'pendiente';
    const canStart = estado !== 'completado' && estado !== 'saltado' && seriesRegistradas.length < total;
    const list = seriesRegistradas.length ? seriesRegistradas.map((serie, serieIndex) => `
      <li class="serie-registrada">
        <span class="serie-check" aria-hidden="true">✓</span>
        <span class="serie-resumen">S${serieIndex + 1} · ${formatSeconds(Number(serie.tiempoSeg || 0))} · RPE ${serie.rpe ?? '—'}</span>
      </li>
    `).join('') : '<div class="series-vacio">Aún no has registrado ninguna serie</div>';

    return `
      <article class="ejercicio-card core-card" data-sesion-id="${session.id}" data-core-idx="${index}" data-estado="${estado}">
        <header class="ejercicio-card-header">
          <div class="ejercicio-card-title">
            <span class="ejercicio-num">C${index + 1}</span>
            <div>
              <h3 class="ejercicio-card-nombre">${escapeHtml(item.nombre)}</h3>
              <p class="ejercicio-card-prescripcion">${escapeHtml(item.prescripcion || `${total} series × ${item.reps || ''}`)}</p>
            </div>
          </div>
          ${(estado === 'pendiente' || estado === 'en_curso') ? '<button class="btn btn-ghost btn-sm" type="button" data-action="saltar-ejercicio-core">⊘ No lo hice</button>' : ''}
        </header>
        ${list}
        ${canStart ? `<button class="btn btn-primary btn-full" type="button" data-action="iniciar-serie-core"><span aria-hidden="true">▶</span> Iniciar serie ${seriesRegistradas.length + 1} de ${total}</button>` : ''}
      </article>
    `;
  }).join('');

  container.innerHTML = `
    <section class="module page-enter stack">
      <header class="module-header">
        <div>
          <h1 class="page-title">Hoy</h1>
          <p class="module-subtitle">${escapeHtml(day.nombre)} · ${escapeHtml(day.enfoque || 'Sin enfoque definido')}</p>
        </div>
        <div class="module-actions">
          <button class="btn btn-primary" type="button" data-action="toggle-session">${started && !finished ? icon('stop') : icon('start')} ${started && !finished ? 'Terminar Gym' : 'Iniciar Gym'}</button>
          <div class="badge badge-success" data-save-state>${started ? 'Guardado ✓' : 'Borrador listo'}</div>
        </div>
      </header>

      <section class="card stack">
        <div class="helper-row">
          <div>
            <h2 class="page-title" style="font-size:1.1rem;margin:0;">Rutina de hoy</h2>
            <p class="page-lead" style="margin:0;">${escapeHtml(activeRoutineName)}</p>
          </div>
          <button class="btn btn-secondary" type="button" data-action="choose-routine">${icon('routine')} Elegir rutina</button>
        </div>
        <div class="grid cols-4">
          <div class="stat-card"><div class="stat-label">Fecha</div><div class="stat-value">${dateKey()}</div></div>
          <div class="stat-card"><div class="stat-label">Tiempo</div><div class="stat-value" data-timer>${session?.horaInicio ? renderTimer(session) : '00:00'}</div></div>
          <div class="stat-card"><div class="stat-label">Inicio</div><div class="stat-value">${session?.horaInicio ? formatTime(session.horaInicio) : '—'}</div></div>
          <div class="stat-card"><div class="stat-label">Fin</div><div class="stat-value">${session?.horaFin ? formatTime(session.horaFin) : '—'}</div></div>
        </div>
        <div class="form-grid three">
          <div>
            <label class="field-label">Energía</label>
            <select class="select" data-session-field="energia">
              ${Array.from({ length: 10 }, (_, index) => index + 1).map((value) => `<option value="${value}" ${Number(session?.energia || 8) === value ? 'selected' : ''}>${value}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label">Cardio / pasos</label>
            <input class="input" data-session-field="cardio" value="${escapeHtml(session?.cardio || '')}" placeholder="Ej. 8.000 pasos o 20 min" />
          </div>
          <div>
            <label class="field-label">Unidad</label>
            <input class="input" value="${unit}" disabled />
          </div>
        </div>
        <div>
          <label class="field-label">Notas del día</label>
          <textarea class="textarea" data-session-field="notas" placeholder="Sensaciones, ajustes, técnica...">${escapeHtml(session?.notas || '')}</textarea>
        </div>
      </section>

      <section class="stack">
        <div class="helper-row">
          <h2 class="page-title" style="font-size:1.15rem;margin:0;">Ejercicios</h2>
        </div>
        <div class="stack" id="exercise-list">
          ${(session?.ejercicios || []).length ? exerciseCards : '<div class="empty-state"><p class="page-lead">Hoy no tienes ejercicios cargados.</p></div>'}
        </div>
      </section>

      <section class="stack">
        <div class="helper-row">
          <h2 class="page-title" style="font-size:1.15rem;margin:0;">Core diario</h2>
          <span class="badge badge-success">Se guarda junto con la sesión</span>
        </div>
        <div class="grid cols-1">${coreCards}</div>
      </section>
    </section>
  `;

  const timerEl = container.querySelector('[data-timer]');
  container.__timer = window.setInterval(() => {
    if (timerEl && session?.horaInicio && !session.horaFin) {
      timerEl.textContent = renderTimer({ ...session, horaFin: new Date().toTimeString().slice(0, 5) });
    }
    updateSeriesTimers(container, session);
  }, 1000);

  const saveDraft = async () => {
    await upsertSession(session);
    const saveState = container.querySelector('[data-save-state]');
    if (saveState) saveState.textContent = 'Guardado ✓';
  };
  const scheduleSave = debounce(saveDraft, 400);

  container.querySelector('[data-action="toggle-session"]')?.addEventListener('click', async () => {
    if (session?.horaInicio && !session.horaFin) {
      const closed = await finishSession(session.id);
      mostrarResumenSesion(closed || session);
      toast('Sesión terminada', `Duración: ${formatMinutes(closed?.duracionMin || 0)}.`, 'success');
      await context.refresh?.();
      return;
    }
    const selected = await startChosenRoutine(previewRoutine || routine, session?.diaId || day?.id || previewRoutine?.dias?.[0]?.id || '');
    if (!selected) return;
    await context.refresh?.();
  });

  container.querySelector('[data-action="choose-routine"]')?.addEventListener('click', async () => {
    const selected = await startChosenRoutine(previewRoutine || routine, session?.diaId || day?.id || previewRoutine?.dias?.[0]?.id || '');
    if (!selected) return;
    await context.refresh?.();
  });

  container.querySelectorAll('.exercise-card').forEach((card) => {
    const exerciseIndex = Number(card.getAttribute('data-exercise-index'));
    const exercise = session.ejercicios[exerciseIndex];

    card.querySelectorAll('[data-field]').forEach((input) => {
      input.addEventListener('input', async (event) => {
        const field = event.target.getAttribute('data-field');
        exercise[field] = event.target.value;
        scheduleSave();
      });
    });

    card.querySelectorAll('[data-series-field]').forEach((input) => {
      input.addEventListener('input', async (event) => {
        const seriesField = event.target.getAttribute('data-series-field');
        const row = event.target.closest('[data-series-index]');
        const serieIndex = Number(row.getAttribute('data-series-index'));
        const series = exercise.series[serieIndex];
        if (seriesField === 'hecho') {
          series.hecho = event.target.checked;
        } else if (seriesField === 'rpe') {
          series.rpe = Number(event.target.value);
        } else {
          series[seriesField] = event.target.value;
        }
        scheduleSave();
      });
    });

    card.querySelectorAll('[data-action="toggle-series-timer"]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const row = event.currentTarget.closest('[data-series-index]');
        const serieIndex = Number(row.getAttribute('data-series-index'));
        const series = exercise.series[serieIndex];
        if (series.inicioSeg) {
          await stopSeries(session, exerciseIndex, serieIndex);
        } else {
          await startSeries(session, exerciseIndex, serieIndex);
        }
        await renderTodayPage(container, context);
      });
    });

    card.querySelectorAll('[data-action="edit-rpe"]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const row = event.currentTarget.closest('[data-series-index]');
        const serieIndex = Number(row.getAttribute('data-series-index'));
        const series = exercise.series[serieIndex];
        const rpe = await promptDialog({ title: 'Editar RPE', message: 'Escribe el esfuerzo percibido de la serie.', defaultValue: String(series.rpe ?? 8), confirmText: 'Guardar' });
        if (rpe == null) return;
        series.rpe = Number(rpe);
        await upsertSession(session);
        await renderTodayPage(container, context);
      });
    });

    card.querySelector('[data-action="add-series"]')?.addEventListener('click', async () => {
      exercise.series.push(blankSeries());
      await upsertSession(session);
      await renderTodayPage(container, context);
    });

    card.querySelector('[data-action="delete-exercise"]')?.addEventListener('click', async () => {
      const accepted = await confirmDialog({ title: 'Eliminar ejercicio', message: `¿Quitar ${exercise.nombre} de la sesión de hoy?`, confirmText: 'Eliminar', danger: true });
      if (!accepted) return;
      session.ejercicios.splice(exerciseIndex, 1);
      await upsertSession(session);
      await renderTodayPage(container, context);
    });
  });

  container.querySelectorAll('[data-core-index]').forEach((label) => {
    const index = Number(label.getAttribute('data-core-index'));
    label.querySelector('[data-action="toggle-core"]')?.addEventListener('change', async (event) => {
      session.core[index].hecho = event.target.checked;
      scheduleSave();
    });
  });

  container.querySelectorAll('[data-session-field]').forEach((input) => {
    input.addEventListener('input', async (event) => {
      const field = event.target.getAttribute('data-session-field');
      session[field] = field === 'energia' ? Number(event.target.value) : event.target.value;
      scheduleSave();
    });
  });
}
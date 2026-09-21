import { buildDefaultRoutine, duplicateRoutine, getActiveRoutine, getRoutineDayForDate, listRoutines, restoreDefaultRoutine, saveRoutine, setActiveRoutine } from './db.js';
import { confirmDialog, escapeHtml, icon, promptDialog, toast } from './ui.js';

const OPEN_DAY_KEY = 'gw_rutina_abierta';

function uid(prefix) {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function blankExercise() {
  return { id: uid('ex'), nombre: 'Nuevo ejercicio', series: 3, reps: '8-12', nota: '', orden: 999 };
}

function cloneExercise(exercise) {
  return { ...exercise, id: uid('ex') };
}

function getOpenDayId() {
  return sessionStorage.getItem(OPEN_DAY_KEY) || '';
}

function setOpenDayId(dayId) {
  if (dayId) sessionStorage.setItem(OPEN_DAY_KEY, dayId);
  else sessionStorage.removeItem(OPEN_DAY_KEY);
}

function exerciseSummary(exercise) {
  const series = Math.max(1, Number(exercise.series || 1));
  return `${series} series × ${exercise.reps || '—'} reps`;
}

function dragHandleMarkup() {
  return `
    <button class="drag-handle" type="button" aria-label="Reordenar ejercicio">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <circle cx="4" cy="3" r="1.4"></circle>
        <circle cx="10" cy="3" r="1.4"></circle>
        <circle cx="4" cy="7" r="1.4"></circle>
        <circle cx="10" cy="7" r="1.4"></circle>
        <circle cx="4" cy="11" r="1.4"></circle>
        <circle cx="10" cy="11" r="1.4"></circle>
      </svg>
    </button>
  `;
}

function daySummary(day) {
  return `${day.enfoque || 'Sin enfoque definido'} · ${(day.ejercicios || []).length} ejercicios`;
}

function routineBadge(day, activeDayId) {
  if (day.esDescanso) return '<span class="badge badge-active">Descanso</span>';
  if (day.id === activeDayId) return '<span class="badge badge-active">Activo</span>';
  return '<span class="badge badge-success">Listo</span>';
}

function exerciseRowMarkup(exercise, exerciseIndex) {
  return `
    <li class="ejercicio-row" data-exercise-index="${exerciseIndex}" data-ejercicio-id="${exercise.id || ''}">
      ${dragHandleMarkup()}
      <div class="ejercicio-info">
        <span class="ejercicio-nombre">${escapeHtml(exercise.nombre || `Ejercicio ${exerciseIndex + 1}`)}</span>
        <span class="ejercicio-detalle">${escapeHtml(exerciseSummary(exercise))}${exercise.nota ? ` · ${escapeHtml(exercise.nota)}` : ''}</span>
      </div>
      <div class="ejercicio-actions" aria-label="Acciones del ejercicio">
        <button type="button" data-action="edit-exercise" aria-label="Editar ejercicio">${icon('edit')}</button>
        <button type="button" data-action="duplicate-exercise" aria-label="Duplicar ejercicio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button type="button" data-action="delete-exercise" aria-label="Eliminar ejercicio">${icon('trash')}</button>
      </div>
    </li>
  `;
}

function dayCardMarkup(day, dayIndex, activeDayId, openDayId) {
  const open = day.id === openDayId;
  const exerciseRows = (day.ejercicios || []).map((exercise, exerciseIndex) => exerciseRowMarkup(exercise, exerciseIndex)).join('');
  const coreRows = (day.core || []).map((item, index) => `
    <label class="card hstack" style="justify-content:space-between;" data-core-index="${index}">
      <div>
        <strong>${escapeHtml(item.nombre)}</strong>
        <div class="field-help">${escapeHtml(item.series)} series · ${escapeHtml(item.reps)}</div>
      </div>
      <input class="series-check" type="checkbox" data-action="toggle-core" ${item.hecho ? 'checked' : ''} />
    </label>
  `).join('');

  return `
    <article class="dia-item ${open ? 'is-open' : ''}" role="listitem" data-dia-id="${day.id}" data-day-index="${dayIndex}">
      <button class="dia-header" type="button" aria-expanded="${open ? 'true' : 'false'}" aria-controls="dia-body-${day.id}">
        <span class="dia-chevron" aria-hidden="true">▸</span>
        <div class="dia-header-text">
          <span class="dia-nombre">${escapeHtml(day.nombre)}</span>
          <span class="dia-meta">${escapeHtml(daySummary(day))}</span>
        </div>
        ${routineBadge(day, activeDayId)}
      </button>

      <div class="dia-body" id="dia-body-${day.id}" ${open ? '' : 'hidden'}>
        <div class="dia-fields">
          <div class="field">
            <label class="field-label">Nombre</label>
            <input type="text" class="input" data-day-field="nombre" value="${escapeHtml(day.nombre)}" />
          </div>
          <div class="field">
            <label class="field-label">Enfoque</label>
            <input type="text" class="input" data-day-field="enfoque" value="${escapeHtml(day.enfoque || '')}" />
          </div>
        </div>

        <label class="toggle-row">
          <input type="checkbox" data-day-field="esDescanso" ${day.esDescanso ? 'checked' : ''} />
          <span>Día de descanso</span>
        </label>

        <h3 class="ejercicios-title">Ejercicios</h3>
        <ul class="ejercicios-list">
          ${exerciseRows || '<li class="empty-state" style="padding:0;justify-items:start;text-align:left;"><p class="page-lead">No hay ejercicios en este día.</p></li>'}
        </ul>

        <button class="btn btn-secondary btn-full" type="button" data-action="add-exercise"><span aria-hidden="true">+</span> Agregar ejercicio</button>

        <div class="stack" style="margin-top:var(--sp-5);">
          <div class="helper-row"><strong>Core diario</strong><span class="field-help">Se guarda junto con la rutina</span></div>
          <div class="grid cols-1">
            ${coreRows || '<div class="empty-state" style="padding:0;justify-items:start;text-align:left;"><p class="page-lead">No hay core diario configurado.</p></div>'}
          </div>
        </div>
      </div>
    </article>
  `;
}

async function editExerciseDialog(exercise) {
  const nombre = await promptDialog({ title: 'Editar ejercicio', message: 'Nombre del ejercicio', defaultValue: exercise.nombre || 'Nuevo ejercicio', confirmText: 'Siguiente' });
  if (nombre == null) return null;
  const series = await promptDialog({ title: 'Editar ejercicio', message: 'Cantidad de series', defaultValue: String(exercise.series || 3), confirmText: 'Siguiente' });
  if (series == null) return null;
  const reps = await promptDialog({ title: 'Editar ejercicio', message: 'Rango de repeticiones', defaultValue: exercise.reps || '8-12', confirmText: 'Siguiente' });
  if (reps == null) return null;
  const nota = await promptDialog({ title: 'Editar ejercicio', message: 'Nota opcional', defaultValue: exercise.nota || '', confirmText: 'Guardar' });
  if (nota == null) return null;
  return { nombre, series: Math.max(1, Number(series || 1)), reps, nota };
}

function cerrarTodosLosDias(container) {
  container.querySelectorAll('.dia-item').forEach((item) => {
    item.querySelector('.dia-header')?.setAttribute('aria-expanded', 'false');
    const body = item.querySelector('.dia-body');
    if (body) body.setAttribute('hidden', '');
    item.classList.remove('is-open');
  });
}

function abrirDia(item, guardar = true) {
  const header = item?.querySelector('.dia-header');
  const body = item?.querySelector('.dia-body');
  if (!header || !body) return;
  header.setAttribute('aria-expanded', 'true');
  body.removeAttribute('hidden');
  item.classList.add('is-open');
  if (guardar) setOpenDayId(item.dataset.diaId || '');
}

function toggleDia(item, container) {
  if (!item) return;
  const header = item.querySelector('.dia-header');
  const wasOpen = header?.getAttribute('aria-expanded') === 'true';
  cerrarTodosLosDias(container);
  if (wasOpen) {
    setOpenDayId('');
    return;
  }
  abrirDia(item, true);
}

function inicializarAcordeon(container) {
  if (!container || container.dataset.acordeonInit === '1') return;
  container.dataset.acordeonInit = '1';

  cerrarTodosLosDias(container);

  const remembered = getOpenDayId();
  if (remembered) {
    const item = container.querySelector(`.dia-item[data-dia-id="${remembered}"]`);
    if (item) abrirDia(item, false);
  }

  container.addEventListener('click', (event) => {
    const header = event.target.closest('.dia-header');
    if (!header || !container.contains(header)) return;
    event.preventDefault();
    toggleDia(header.closest('.dia-item'), container);
  });
}

export async function renderRoutinePage(container, context = {}) {
  const routines = await listRoutines();
  let activeRoutine = await getActiveRoutine();
  if (!activeRoutine && routines.length) activeRoutine = routines[0];
  if (!activeRoutine) activeRoutine = buildDefaultRoutine();

  const todayDay = getRoutineDayForDate(activeRoutine, new Date());
  const openDayId = getOpenDayId();
  const renderedDays = (activeRoutine.dias || []).map((day, dayIndex) => dayCardMarkup(day, dayIndex, todayDay?.id, openDayId)).join('');

  container.innerHTML = `
    <section class="module page-enter stack">
      <header class="module-header">
        <div>
          <h1 class="page-title">Rutina</h1>
          <p class="module-subtitle">Edita días, ejercicios y la rutina activa.</p>
        </div>
        <div class="module-actions">
          <button class="btn btn-secondary" type="button" data-action="create-routine"><span aria-hidden="true">+</span> Crear nueva rutina</button>
          <button class="btn btn-secondary" type="button" data-action="duplicate-routine"><span aria-hidden="true">📋</span> Duplicar actual</button>
          <button class="btn btn-primary" type="button" data-action="restore-default"><span aria-hidden="true">✓</span> Restaurar por defecto</button>
        </div>
      </header>

      <div class="card">
        <div class="rutina-selector-row">
          <div class="field">
            <label class="field-label" for="routine-select">Rutina activa</label>
            <select id="routine-select" class="input">
              ${routines.map((routine) => `<option value="${routine.id}" ${routine.id === activeRoutine.id ? 'selected' : ''}>${escapeHtml(routine.nombre)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Estado</label>
            <span class="badge badge-success">${activeRoutine.esDefault ? 'Rutina por defecto' : 'Rutina personalizada'}</span>
          </div>
        </div>
      </div>

      <h2 class="section-title">Días de la rutina</h2>

      <div class="dias-list" role="list">${renderedDays}</div>
    </section>
  `;

  container.querySelector('#routine-select')?.addEventListener('change', async (event) => {
    await setActiveRoutine(event.target.value);
    toast('Rutina activa', 'La selección se guardó correctamente.', 'success');
    await renderRoutinePage(container, context);
  });

  container.querySelector('[data-action="restore-default"]')?.addEventListener('click', async () => {
    const accepted = await confirmDialog({ title: 'Restaurar rutina por defecto', message: 'Se reemplazará la rutina actual por el seed de Gym Wolf.', confirmText: 'Restaurar', danger: true });
    if (!accepted) return;
    await restoreDefaultRoutine();
    setOpenDayId('');
    toast('Rutina restaurada', 'Volvió la plantilla original.', 'success');
    await renderRoutinePage(container, context);
  });

  container.querySelector('[data-action="duplicate-routine"]')?.addEventListener('click', async () => {
    const copy = await duplicateRoutine(activeRoutine.id);
    if (!copy) return;
    const name = await promptDialog({ title: 'Nombre de la nueva rutina', message: 'Puedes renombrarla antes de seguir.', defaultValue: copy.nombre, confirmText: 'Guardar nombre' });
    if (name) {
      copy.nombre = name;
      await saveRoutine(copy);
    }
    await setActiveRoutine(copy.id);
    setOpenDayId('');
    toast('Rutina duplicada', 'Se creó una copia editable.', 'success');
    await renderRoutinePage(container, context);
  });

  container.querySelector('[data-action="create-routine"]')?.addEventListener('click', async () => {
    const name = await promptDialog({ title: 'Nueva rutina', message: 'Se duplicará la rutina actual para empezar con una base similar.', defaultValue: `${activeRoutine.nombre} (nueva)` });
    if (!name) return;
    const copy = await duplicateRoutine(activeRoutine.id);
    if (!copy) return;
    copy.nombre = name;
    await saveRoutine(copy);
    await setActiveRoutine(copy.id);
    setOpenDayId('');
    toast('Rutina creada', 'Ya quedó como rutina activa.', 'success');
    await renderRoutinePage(container, context);
  });

  inicializarAcordeon(container);

  container.querySelectorAll('.dia-item').forEach((item) => {
    const dayIndex = Number(item.getAttribute('data-day-index'));
    const day = activeRoutine.dias[dayIndex];

    item.querySelectorAll('[data-day-field]').forEach((input) => {
      input.addEventListener('input', async (event) => {
        const field = event.target.getAttribute('data-day-field');
        if (field === 'esDescanso') {
          day.esDescanso = event.target.checked;
        } else {
          day[field] = event.target.value;
        }
        await saveRoutine(activeRoutine);
      });
    });

    item.querySelector('[data-action="add-exercise"]')?.addEventListener('click', async () => {
      const name = await promptDialog({ title: 'Nuevo ejercicio', message: 'Escribe el nombre del ejercicio para este día.', defaultValue: 'Nuevo ejercicio' });
      if (!name) return;
      const exercise = blankExercise();
      exercise.nombre = name;
      day.ejercicios.push(exercise);
      await saveRoutine(activeRoutine);
      setOpenDayId(day.id);
      await renderRoutinePage(container, context);
    });

    item.querySelectorAll('.ejercicio-row').forEach((row) => {
      const exerciseIndex = Number(row.getAttribute('data-exercise-index'));
      const exercise = day.ejercicios[exerciseIndex];

      row.querySelector('[data-action="edit-exercise"]')?.addEventListener('click', async () => {
        const result = await editExerciseDialog(exercise);
        if (!result) return;
        Object.assign(exercise, result);
        await saveRoutine(activeRoutine);
        await renderRoutinePage(container, context);
      });

      row.querySelector('[data-action="duplicate-exercise"]')?.addEventListener('click', async () => {
        const copy = cloneExercise(exercise);
        copy.nombre = `${copy.nombre} (copia)`;
        copy.orden = day.ejercicios.length + 1;
        day.ejercicios.splice(exerciseIndex + 1, 0, copy);
        await saveRoutine(activeRoutine);
        await renderRoutinePage(container, context);
      });

      row.querySelector('[data-action="delete-exercise"]')?.addEventListener('click', async () => {
        const accepted = await confirmDialog({ title: 'Eliminar ejercicio', message: `Vas a quitar ${exercise.nombre} de este día.`, confirmText: 'Eliminar', danger: true });
        if (!accepted) return;
        day.ejercicios.splice(exerciseIndex, 1);
        await saveRoutine(activeRoutine);
        await renderRoutinePage(container, context);
      });
    });

    item.querySelectorAll('[data-core-index]').forEach((label) => {
      const coreIndex = Number(label.getAttribute('data-core-index'));
      label.querySelector('[data-action="toggle-core"]')?.addEventListener('change', async (event) => {
        day.core[coreIndex].hecho = event.target.checked;
        await saveRoutine(activeRoutine);
      });
    });
  });
}


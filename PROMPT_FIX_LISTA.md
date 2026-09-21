# FIX CRÍTICO · Lista de ejercicios en Hoy + botón "Iniciar serie" roto

## Diagnóstico visual de la captura

Analizando la imagen, hay **4 bugs** concretos:

### Bug A · Las series se muestran como "registradas" cuando en realidad están vacías

La captura muestra:
```
✓ S1 · — kg × — · RPE 8 · 00:00
✓ S2 · — kg × — · RPE 8 · 00:00
✓ S3 · — kg × — · RPE 8 · 00:00
✓ S4 · — kg × — · RPE 8 · 00:00
```

Todas tienen **checkmark ✓, RPE 8 y 00:00** con los valores vacíos. Esto
significa que el seed de la sesión está creando las 4 series con datos
por defecto (`rpe: 8`, `hecho: true`) en lugar de dejar el array de series
**vacío** hasta que el usuario las registre.

### Bug B · El botón dice "Iniciar serie 4" cuando no hay ninguna serie

Si las 4 series se cuentan como registradas, el botón calcula
`seriesRegistradas + 1 = 4 + 1 = 5`, pero como el máximo es 4, muestra "4".
El botón **nunca debería aparecer** si todas las series están completas, pero
aparece porque la lógica cuenta mal.

### Bug C · El botón "Iniciar serie" no hace nada al pulsar

Causas probables:
- El listener está registrado **antes** de que existan los elementos en el DOM
- El `data-action="iniciar-serie"` no coincide con el selector del listener
- La función `abrirModalSerie()` falla silenciosamente (no captura excepciones)
- El modal `#modal-serie` no existe en el HTML

### Bug D · La lista se ve como bullets nativos en lugar de cards

Se ve `•` en cada serie en vez de cards con fondo, borde y padding. Falta el
CSS de `.series-registradas` y `.serie-registrada`.

### Bug E · El número "1" está suelto arriba del ejercicio

Aparece "Ejercicios" → "1" → "Hip Thrust con Barra". El número debería estar
en un badge circular al lado del nombre, no en una línea suelta.

---

# 1. FIX DEL SEED · NO crear series vacías al iniciar la sesión

## Problema

Cuando se crea la sesión desde el modal de rutina, se está generando el array
`series` con N elementos vacíos:

```js
// ❌ BUG ACTUAL
series: Array.from({ length: 4 }, () => ({
  peso: null,
  reps: null,
  rpe: 8,        // ← esto hace que aparezca RPE 8
  hecho: true,   // ← esto hace que aparezca ✓
  tiempoSeg: 0,  // ← esto hace que aparezca 00:00
}))
```

## Fix

**El array `series` debe empezar VACÍO.** La cantidad configurada vive en
`seriesConfiguradas`.

```js
// ✅ CORRECTO
{
  ejercicioId: "uuid",
  nombre: "Hip Thrust con Barra",
  tipo: "reps",
  prescripcion: "4 series × 8-10 reps",
  seriesConfiguradas: 4,   // ← aquí vive el número
  nota: "Pausa de 1 s arriba",
  estado: "en_curso",      // "pendiente" | "en_curso" | "completado" | "saltado"
  razonSalto: null,
  rpePromedio: null,
  series: [],              // ← EMPIEZA VACÍO
}
```

**Buscar en `js/sesion.js` la función `confirmarInicioSesion()` y aplicar:**

```js
const ejerciciosSesion = (dia.ejercicios || []).map((ej, idx) => {
  const seriesConfiguradas = Number(ej.series) || 3;
  return {
    ejercicioId: ej.id || `ej_${idx}_${Date.now()}`,
    nombre: ej.nombre,
    tipo: ej.tipo || 'reps',
    prescripcion: `${seriesConfiguradas} series × ${ej.reps} reps`,
    seriesConfiguradas,
    nota: ej.nota || '',
    estado: idx === 0 ? 'en_curso' : 'pendiente',  // el primero activo
    razonSalto: null,
    rpePromedio: null,
    series: [],   // ← VACÍO
  };
});

const coreSesion = (dia.core || []).map((c, idx) => {
  const seriesConfiguradas = Number(c.series) || 3;
  return {
    nombre: c.nombre,
    tipo: c.tipo || 'tiempo',   // el core por defecto es por tiempo
    prescripcion: `${seriesConfiguradas} series × ${c.reps}`,
    seriesConfiguradas,
    estado: 'pendiente',
    razonSalto: null,
    rpePromedio: null,
    series: [],   // ← VACÍO
  };
});
```

**Importante:** si el usuario ya tenía sesiones creadas con el bug, hay que
resetear IndexedDB:

```js
// En DevTools Console:
indexedDB.deleteDatabase('gymwolf');
location.reload();
```

---

# 2. FIX DEL RENDERIZADO · Solo mostrar series registradas

## Regla de oro

- **Series registradas:** las que están en `ejercicio.series` (array)
- **Series totales configuradas:** `ejercicio.seriesConfiguradas`
- **Series restantes:** `seriesConfiguradas - series.length`

## Render correcto de cada card de ejercicio

**Si el ejercicio está en curso y tiene series registradas:**
```
┌────────────────────────────────────────────┐
│ ① Hip Thrust con Barra           ⊘ No lo hice│
│   4 series × 8-10 reps · Pausa de 1 s arriba│
│                                            │
│   ✓ S1 · 60 kg × 10 · RPE 10 · 00:45      │
│   ✓ S2 · 65 kg × 8  · RPE 9  · 00:52      │
│                                            │
│   [ ▶ Iniciar serie 3 de 4 ]               │
└────────────────────────────────────────────┘
```

**Si el ejercicio está pendiente (sin series):**
```
┌────────────────────────────────────────────┐
│ ② Peso Muerto Rumano             ⊘ No lo hice│
│   4 series × 10-12 reps · Empujar cadera   │
│                                            │
│   Aún no has registrado ninguna serie.     │
│                                            │
│   [ ▶ Iniciar serie 1 de 4 ]               │
└────────────────────────────────────────────┘
```

**Si el ejercicio está completado:**
```
┌────────────────────────────────────────────┐
│ ① Hip Thrust con Barra          ✓ Completado│
│   4/4 series · RPE promedio 8.5            │
│                                            │
│   ✓ S1 · 60 kg × 10 · RPE 10 · 00:45      │
│   ✓ S2 · 65 kg × 8  · RPE 9  · 00:52      │
│   ✓ S3 · 65 kg × 8  · RPE 8  · 00:50      │
│   ✓ S4 · 70 kg × 7  · RPE 9  · 00:48      │
│                                            │
│   (sin botón de iniciar)                   │
└────────────────────────────────────────────┘
```

**Si el ejercicio está saltado:**
```
┌────────────────────────────────────────────┐
│ ⊘ Peso Muerto Rumano                        │
│   No realizado · Máquina ocupada           │
│   Registrado 17:48                          │
└────────────────────────────────────────────┘
```

---

# 3. FIX DEL BOTÓN "Iniciar serie" · Wiring correcto

## El problema

El botón no hace nada porque probablemente el listener se registra antes de
que exista el elemento en el DOM (al re-renderizar el módulo Hoy).

## Fix · Usar delegación de eventos global

En vez de registrar listeners por cada botón (que se pierden al re-renderizar),
usar **delegación sobre el documento**:

```js
// js/serie-modal.js

/**
 * Wiring global con delegación de eventos.
 * Llamar UNA VEZ al inicio de la app.
 */
export function inicializarModalSerie() {
  // Delegación sobre todo el documento
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case 'iniciar-serie':
      case 'iniciar-serie-core':
        e.preventDefault();
        manejarClickIniciarSerie(btn);
        break;

      case 'saltar-ejercicio':
        e.preventDefault();
        manejarClickSaltarEjercicio(btn);
        break;

      case 'empezar-serie':
        e.preventDefault();
        empezarSerie();
        break;

      case 'terminar-serie':
        e.preventDefault();
        terminarSerie();
        break;

      case 'guardar-serie':
        e.preventDefault();
        guardarSerie();
        break;

      case 'saltar-serie':
        e.preventDefault();
        saltarSerieActual();
        break;

      case 'cerrar-serie':
        e.preventDefault();
        detenerTimer();
        cerrarModal('modal-serie');
        break;

      case 'terminar-gym':
        e.preventDefault();
        manejarTerminarGym(btn);
        break;

      // ... otros actions
    }
  });
}

/**
 * Handler del botón "Iniciar serie".
 */
async function manejarClickIniciarSerie(btn) {
  try {
    const card = btn.closest('[data-ej-idx], [data-core-idx]');
    if (!card) {
      console.warn('[Iniciar serie] No se encontró la card padre');
      return;
    }

    const sesionId = card.dataset.sesionId;
    const esCore = card.hasAttribute('data-core-idx');
    const idx = Number(esCore ? card.dataset.coreIdx : card.dataset.ejIdx);
    const clave = esCore ? 'core' : 'ejercicios';

    console.log('[Iniciar serie]', { sesionId, clave, idx });

    // Verificar que la sesión existe
    const sesion = await db.sesiones.get(sesionId);
    if (!sesion) {
      toast('No se encontró la sesión activa', 'error');
      return;
    }

    // Verificar que el modal existe
    if (!document.getElementById('modal-serie')) {
      toast('Error: falta el modal de serie en el HTML', 'error');
      console.error('Falta #modal-serie en el HTML');
      return;
    }

    // Abrir el modal
    await abrirModalSerie(sesionId, clave, idx);
  } catch (err) {
    console.error('[Iniciar serie] Error:', err);
    toast('Error al abrir la serie: ' + err.message, 'error');
  }
}
```

**Regla clave:** cada card de ejercicio debe tener los `data-*` correctos:

```html
<article class="ejercicio-card"
         data-sesion-id="ses_2026-09-20"
         data-ej-idx="0"
         data-estado="en_curso">
  <!-- ... -->
</article>
```

Sin `data-sesion-id` el handler no puede resolver la sesión.

---

# 4. FIX DEL CSS · De bullets a cards reales

El usuario ve `•` porque falta la regla `list-style: none` en `.series-registradas`.

```css
/* ============================================
   SERIES REGISTRADAS · Cards, no bullets
   ============================================ */
.series-registradas {
  list-style: none !important;   /* ← quitar bullets */
  padding: 0;
  margin: 0 0 var(--sp-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.serie-registrada {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--success-soft);
  border-left: 3px solid var(--success);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
}

.serie-registrada .serie-check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--success);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.serie-registrada .serie-resumen {
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2px;
}

/* Estado vacío de series */
.series-vacio {
  padding: var(--sp-4);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  background: var(--bg-sunken);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
  margin-bottom: var(--sp-4);
}
```

---

# 5. REFACTOR COMPLETO DE `renderizarHoy()`

Reemplaza la función actual por esta versión:

```js
// js/sesion.js

export async function renderizarHoy() {
  const fecha = new Date().toISOString().slice(0, 10);
  const sesion = await db.sesiones.get(`ses_${fecha}`);
  const contenedor = document.getElementById('hoy');
  if (!contenedor) return;

  // Sin sesión
  if (!sesion) {
    contenedor.innerHTML = `
      <header class="module-header">
        <div>
          <h1>Hoy</h1>
          <p class="module-subtitle">Aún no has iniciado tu sesión</p>
        </div>
      </header>
      <div class="empty-state">
        <p class="empty-title">Sin sesión activa</p>
        <p class="empty-desc">Pulsa "Iniciar día" para seleccionar tu rutina.</p>
        <button class="btn btn-primary" data-action="iniciar-dia">
          <span aria-hidden="true">▶</span> Iniciar día
        </button>
      </div>
    `;
    return;
  }

  // Con sesión
  const ejerciciosHtml = (sesion.ejercicios || [])
    .map((ej, idx) => renderEjercicioCard(ej, idx, sesion.id))
    .join('');

  const coreHtml = (sesion.core || [])
    .map((c, idx) => renderCoreCard(c, idx, sesion.id))
    .join('');

  const duracionActual = sesion.horaFin
    ? `${sesion.duracionMin} min`
    : calcularDuracionEnVivo(sesion.horaInicio) + ' min';

  contenedor.innerHTML = `
    <header class="module-header">
      <div>
        <h1>Hoy · ${sesion.diaNombre || 'Sesión'}</h1>
        <p class="module-subtitle">
          ${sesion.horaInicio} ${sesion.horaFin ? '→ ' + sesion.horaFin : '· En curso'}
          · ${duracionActual}
        </p>
      </div>
      <div class="module-actions">
        <span class="badge badge-success">Guardado ✓</span>
        ${!sesion.horaFin ? `
          <button class="btn btn-danger" data-action="terminar-gym">
            <span aria-hidden="true">⏹</span> Terminar Gym
          </button>
        ` : ''}
      </div>
    </header>

    <div class="sesion-meta">
      <div class="meta-item">
        <span class="meta-label">Fecha</span>
        <span class="meta-valor">${sesion.fecha}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Tiempo</span>
        <span class="meta-valor">${duracionActual}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Inicio</span>
        <span class="meta-valor">${sesion.horaInicio}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Fin</span>
        <span class="meta-valor">${sesion.horaFin || '—'}</span>
      </div>
    </div>

    <h2 class="section-title">Ejercicios</h2>
    <div class="ejercicios-container">
      ${ejerciciosHtml || '<div class="empty-state-inline">Esta sesión no tiene ejercicios</div>'}
    </div>

    <h2 class="section-title">Core diario</h2>
    <div class="core-container">
      ${coreHtml || '<div class="empty-state-inline">Esta sesión no tiene core</div>'}
    </div>
  `;
}

/**
 * Renderiza una card de ejercicio con su estado actual.
 */
function renderEjercicioCard(ejercicio, ejIdx, sesionId) {
  const seriesRegistradas = ejercicio.series || [];
  const configuradas = ejercicio.seriesConfiguradas || 3;
  const estado = ejercicio.estado || 'pendiente';
  const puedeIniciar = estado !== 'completado' && estado !== 'saltado'
                     && seriesRegistradas.length < configuradas;

  // Si está saltado
  if (estado === 'saltado') {
    return `
      <article class="ejercicio-card ejercicio-saltado"
               data-sesion-id="${sesionId}"
               data-ej-idx="${ejIdx}"
               data-estado="saltado">
        <header class="ejercicio-card-header">
          <div class="ejercicio-card-title">
            <span class="ejercicio-num">${ejIdx + 1}</span>
            <div>
              <h3 class="ejercicio-card-nombre">${escapeHtml(ejercicio.nombre)}</h3>
              <p class="ejercicio-card-prescripcion">
                No realizado · ${escapeHtml(ejercicio.razonSalto || 'Sin razón')}
              </p>
            </div>
          </div>
        </header>
      </article>
    `;
  }

  // Series registradas
  const seriesHtml = seriesRegistradas.length
    ? `<ul class="series-registradas">
         ${seriesRegistradas.map(s => `
           <li class="serie-registrada">
             <span class="serie-check" aria-hidden="true">✓</span>
             <span class="serie-resumen">
               S${s.idx + 1} · ${s.peso != null ? s.peso + ' kg' : '—'} × ${s.reps != null ? s.reps + ' reps' : '—'} · RPE ${s.rpe ?? '—'} · ${formatearMMSS(s.tiempoSeg || 0)}
             </span>
           </li>
         `).join('')}
       </ul>`
    : `<div class="series-vacio">Aún no has registrado ninguna serie</div>`;

  // Botón iniciar
  const botonIniciar = puedeIniciar
    ? `<button class="btn btn-primary btn-full" data-action="iniciar-serie">
         <span aria-hidden="true">▶</span> Iniciar serie ${seriesRegistradas.length + 1} de ${configuradas}
       </button>`
    : estado === 'completado'
      ? `<div class="ejercicio-completado-badge">
           <span aria-hidden="true">✓</span> Ejercicio completado · RPE promedio ${ejercicio.rpePromedio ?? '—'}
         </div>`
      : '';

  // Botón saltar
  const botonSaltar = (estado === 'pendiente' || estado === 'en_curso')
    ? `<button class="btn btn-ghost btn-sm" data-action="saltar-ejercicio">
         ⊘ No lo hice
       </button>`
    : '';

  return `
    <article class="ejercicio-card"
             data-sesion-id="${sesionId}"
             data-ej-idx="${ejIdx}"
             data-estado="${estado}">
      <header class="ejercicio-card-header">
        <div class="ejercicio-card-title">
          <span class="ejercicio-num">${ejIdx + 1}</span>
          <div>
            <h3 class="ejercicio-card-nombre">${escapeHtml(ejercicio.nombre)}</h3>
            <p class="ejercicio-card-prescripcion">
              ${configuradas} series × ${escapeHtml(ejercicio.prescripcion?.split('×')[1]?.trim() || '')}
              ${ejercicio.nota ? ' · ' + escapeHtml(ejercicio.nota) : ''}
            </p>
          </div>
        </div>
        ${botonSaltar}
      </header>

      ${seriesHtml}
      ${botonIniciar}
    </article>
  `;
}

/**
 * Renderiza una card de core.
 */
function renderCoreCard(item, idx, sesionId) {
  const seriesRegistradas = item.series || [];
  const configuradas = item.seriesConfiguradas || 3;
  const estado = item.estado || 'pendiente';
  const puedeIniciar = estado !== 'completado' && estado !== 'saltado'
                     && seriesRegistradas.length < configuradas;

  const seriesHtml = seriesRegistradas.length
    ? `<ul class="series-registradas">
         ${seriesRegistradas.map(s => `
           <li class="serie-registrada">
             <span class="serie-check" aria-hidden="true">✓</span>
             <span class="serie-resumen">
               S${s.idx + 1} · ${formatearMMSS(s.tiempoSeg || 0)} · RPE ${s.rpe ?? '—'}
             </span>
           </li>
         `).join('')}
       </ul>`
    : `<div class="series-vacio">Aún no has registrado ninguna serie</div>`;

  const botonIniciar = puedeIniciar
    ? `<button class="btn btn-primary btn-full" data-action="iniciar-serie-core">
         <span aria-hidden="true">▶</span> Iniciar serie ${seriesRegistradas.length + 1} de ${configuradas}
       </button>`
    : estado === 'completado'
      ? `<div class="ejercicio-completado-badge">
           <span aria-hidden="true">✓</span> Completado
         </div>`
      : '';

  return `
    <article class="ejercicio-card core-card"
             data-sesion-id="${sesionId}"
             data-core-idx="${idx}"
             data-estado="${estado}">
      <header class="ejercicio-card-header">
        <div class="ejercicio-card-title">
          <span class="ejercicio-num">C${idx + 1}</span>
          <div>
            <h3 class="ejercicio-card-nombre">${escapeHtml(item.nombre)}</h3>
            <p class="ejercicio-card-prescripcion">${escapeHtml(item.prescripcion || '')}</p>
          </div>
        </div>
        ${estado !== 'saltado' ? `
          <button class="btn btn-ghost btn-sm" data-action="saltar-ejercicio">
            ⊘ No lo hice
          </button>
        ` : ''}
      </header>

      ${seriesHtml}
      ${botonIniciar}
    </article>
  `;
}

function calcularDuracionEnVivo(horaInicio) {
  if (!horaInicio) return 0;
  const [h, m] = horaInicio.split(':').map(Number);
  const ahora = new Date();
  const inicioMin = h * 60 + m;
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  return Math.max(0, ahoraMin - inicioMin);
}

function formatearMMSS(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
```

---

# 6. CSS COMPLETO · Lista limpia de ejercicios

```css
/* ============================================
   MÓDULO HOY · Lista de ejercicios
   ============================================ */
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sp-4);
  flex-wrap: wrap;
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--sp-5);
}
.module-subtitle {
  color: var(--text-muted);
  font-size: var(--fs-sm);
  margin: var(--sp-1) 0 0;
}
.module-actions {
  display: flex;
  gap: var(--sp-2);
  align-items: center;
  flex-wrap: wrap;
}

.section-title {
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text);
  margin: var(--sp-5) 0 var(--sp-3);
}

/* Meta de la sesión */
.sesion-meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
  margin-bottom: var(--sp-5);
}
@media (max-width: 640px) {
  .sesion-meta { grid-template-columns: repeat(2, 1fr); }
}
.meta-item {
  padding: var(--sp-3);
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  text-align: center;
}
.meta-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.meta-valor {
  display: block;
  font-size: var(--fs-base);
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* Cards de ejercicio */
.ejercicios-container,
.core-container {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}

.ejercicio-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-4) var(--sp-5);
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
}
.ejercicio-card[data-estado="en_curso"] {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
.ejercicio-card[data-estado="completado"] {
  border-left: 4px solid var(--success);
}
.ejercicio-card[data-estado="saltado"],
.ejercicio-saltado {
  opacity: 0.65;
  border-left: 4px solid var(--text-disabled);
  background: var(--bg-sunken);
}

.ejercicio-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}
.ejercicio-card-title {
  display: flex;
  gap: var(--sp-3);
  align-items: flex-start;
  min-width: 0;
  flex: 1;
}
.ejercicio-num {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  font-size: var(--fs-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ejercicio-card[data-estado="completado"] .ejercicio-num {
  background: var(--success);
  color: #fff;
}
.ejercicio-card-nombre {
  font-size: var(--fs-base);
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.2;
}
.ejercicio-card-prescripcion {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
  line-height: 1.4;
}

.series-registradas {
  list-style: none !important;
  padding: 0;
  margin: 0 0 var(--sp-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.serie-registrada {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--success-soft);
  border-left: 3px solid var(--success);
  border-radius: var(--r-md);
}
.serie-check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--success);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.serie-resumen {
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-sm);
  letter-spacing: 0.2px;
}

.series-vacio {
  padding: var(--sp-4);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  background: var(--bg-sunken);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
  margin-bottom: var(--sp-4);
}

.ejercicio-completado-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--success-soft);
  color: var(--success);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  font-weight: 700;
}

.btn-full { width: 100%; }
.btn-sm {
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-xs);
  min-height: auto;
  white-space: nowrap;
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover {
  background: var(--surface-hover);
  color: var(--text);
  border-color: var(--border-strong);
}

.empty-state-inline {
  padding: var(--sp-5);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  background: var(--bg-sunken);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
}
```

---

# 7. VERIFICACIÓN EN CONSOLA

Después de aplicar los fixes, abrir DevTools Console y ejecutar:

```js
// 1. Verificar que la sesión se creó con series VACÍAS
const { db } = await import('./js/db.js');
const fecha = new Date().toISOString().slice(0, 10);
const sesion = await db.sesiones.get(`ses_${fecha}`);
console.log('Ejercicio 1:', {
  nombre: sesion.ejercicios[0].nombre,
  seriesConfiguradas: sesion.ejercicios[0].seriesConfiguradas,
  seriesRegistradas: sesion.ejercicios[0].series.length,  // ← debe ser 0
  estado: sesion.ejercicios[0].estado,
});

// 2. Verificar que el modal existe
console.log('#modal-serie:', document.getElementById('modal-serie'));

// 3. Verificar que las cards tienen data-sesion-id
console.log('Cards:', document.querySelectorAll('[data-sesion-id]').length);
```

**Interpretación:**
- Si `seriesRegistradas` es 0 → ✅ el seed está bien
- Si `seriesRegistradas` es 4 → ❌ el seed sigue con el bug, hay que resetear IndexedDB
- Si `#modal-serie` es `null` → ❌ falta el modal en el HTML
- Si `Cards` es 0 → ❌ falta `data-sesion-id` en el render

---

# 8. ORDEN DE APLICACIÓN

1. **Fix 1** → actualizar `confirmarInicioSesion()` para que `series` empiece vacío
2. **Reset** → borrar IndexedDB para limpiar sesiones corruptas
3. **Fix 3** → reescribir `inicializarModalSerie()` con delegación de eventos
4. **Fix 5** → reescribir `renderizarHoy()` con la nueva estructura
5. **Fix 4** → agregar el CSS de cards y eliminar bullets
6. **Fix 2** → agregar `data-sesion-id` a cada card
7. **Verificar** con los comandos de la sección 7

---

# 9. CHECKLIST DE VERIFICACIÓN

## Seed
- [ ] Al crear la sesión, `seriesConfiguradas: 4` y `series: []`
- [ ] El primer ejercicio tiene `estado: "en_curso"`
- [ ] Los demás tienen `estado: "pendiente"`

## Lista
- [ ] Cada ejercicio es una **card** con borde y fondo
- [ ] El número del ejercicio está en un **badge circular**, no suelto
- [ ] No hay **bullets** (`•`) en las series
- [ ] Las series registradas se ven como **cards verdes**
- [ ] El botón dice "Iniciar serie 1 de 4" (dinámico)
- [ ] Cuando no hay series registradas, dice "Aún no has registrado ninguna serie"

## Botón "Iniciar serie"
- [ ] Al pulsar **abre el modal** sin errores
- [ ] El modal muestra el nombre del ejercicio
- [ ] El modal muestra "Serie 1 de 4"
- [ ] El Paso 1 pide el peso
- [ ] Se ve la referencia "Última vez" si existe sesión previa

## Console
- [ ] No hay errores al pulsar el botón
- [ ] El log `[Iniciar serie]` aparece con los datos correctos

---

# 10. INSTRUCCIONES PARA COPILOT

```
Lee PROMPT_FIX_HOY_LISTA.md y aplica los fixes en este orden estricto:

1. Fix 1: actualizar confirmarInicioSesion() para que series: [] (no crear
   objetos vacíos con rpe/hecho/tiempoSeg por defecto)

2. Fix 3: reescribir inicializarModalSerie() con DELEGACIÓN DE EVENTOS
   sobre document (no listeners directos por botón)

3. Fix 5: reescribir renderizarHoy() con las cards correctas, incluyendo
   data-sesion-id en cada card

4. Fix 4: agregar el CSS de .series-registradas con list-style: none

5. Fix 2: verificar que cada card tenga data-sesion-id

6. Verificar el checklist completo.

Reglas:
- NO toques otros módulos (Rutina, Historial, Medidas, Progreso, Ajustes)
- Si algún archivo no existe (ej. js/serie-modal.js), créalo
- Agrega console.log('[Iniciar serie]', ...) en el handler para debug
- Si abrirModalSerie() falla, capturar el error y mostrar toast con el mensaje
```

# FIN DEL FIX
# REFACTOR · Flujo de series con modal único + Bloqueo de edición

Este documento REEMPLAZA el flujo actual del módulo Hoy (series + core).
Aplica TODO lo descrito aquí sin excepción.

---

# 1. OBJETIVO

Transformar el registro de series para que sea:
1. **Guiado por modal** en 3 pasos (peso → timer → reps + RPE)
2. **Readonly** después de guardar (no se puede editar)
3. **Bloqueado**: no se pueden agregar/eliminar ejercicios ni series durante la sesión
4. **Auto-avanza** entre ejercicios cuando se completan todas las series configuradas
5. **Snapshot inmutable**: la sesión copia la rutina al crearse, no la referencia

---

# 2. NUEVO MODELO DE DATOS

## Ejercicio en la rutina (configuración)

```js
{
  id: "uuid",
  nombre: "Hip Thrust con Barra",
  tipo: "reps",              // "reps" | "tiempo" | "tiempo_reps"
  series: 4,                 // nº de series configuradas
  reps: "8-10",              // string descriptivo
  tiempoSeg: null,           // solo si tipo = "tiempo" | "tiempo_reps"
  nota: "Pausa de 1 s arriba",
  orden: 0
}
```

**Tipos:**
| Tipo | Pide peso | Pide reps | Pide tiempo | Ejemplos |
|------|-----------|-----------|-------------|----------|
| `reps` | ✅ | ✅ | ✅ (timer) | Hip Thrust, Sentadilla |
| `tiempo` | ❌ | ❌ | ✅ | Plancha, Vacíos |
| `tiempo_reps` | ✅ | ✅ | ✅ | Pallof Press |

## Sesión (snapshot inmutable)

```js
{
  id: "ses_2026-09-20",
  fecha: "2026-09-20",
  diaId: "lunes",
  diaNombre: "Lunes",
  rutinaId: "rutina_default",
  horaInicio: "20:04",
  horaFin: null,
  duracionMin: null,
  energia: 8,
  notas: "",
  cardio: "",
  estado: "activa",          // "activa" | "completada"
  indiceEjercicioActivo: 0,  // índice del ejercicio en curso
  ejercicios: [
    {
      ejercicioId: "uuid",
      nombre: "Hip Thrust con Barra",
      tipo: "reps",
      prescripcion: "4 series × 8-10 reps",
      seriesConfiguradas: 4,
      nota: "Pausa de 1 s arriba",
      estado: "en_curso",    // "pendiente" | "en_curso" | "completado" | "saltado"
      razonSalto: null,      // string si estado === "saltado"
      rpePromedio: null,     // promedio al completar
      series: [
        {
          idx: 0,
          peso: 60,
          reps: 10,
          rpe: 10,
          tiempoSeg: 45,
          horaInicio: "20:05",
          horaFin: "20:06",
          registradaEn: "2026-09-20T20:06:15Z"
        },
        // ...
      ]
    }
  ],
  core: [
    {
      nombre: "Vacíos Abdominales",
      tipo: "tiempo",
      seriesConfiguradas: 4,
      prescripcion: "4 series × 15-20 s",
      estado: "pendiente",
      razonSalto: null,
      series: []                // se llenan igual que los ejercicios
    }
  ]
}
```

---

# 3. FLUJO DE LA SERIE · Modal único en 3 pasos

## Vista previa del modal

```
┌──────────────────────────────────────────────┐
│  Hip Thrust con Barra                    ✕   │
│  Serie 2 de 4                                │
├──────────────────────────────────────────────┤
│                                              │
│  PASO 1 · Preparación                        │
│                                              │
│  ¿Con cuánto peso vas a hacer esta serie?   │
│  ┌───────────────────┐                       │
│  │ 60              kg│                       │
│  └───────────────────┘                       │
│                                              │
│  Última vez: 60 kg × 10 reps                │
│                                              │
│  [ ▶ Empezar serie ]                         │
│                                              │
├──────────────────────────────────────────────┤
│  PASO 2 · En curso                           │
│                                              │
│          ⏱  00:32                            │
│       (contador grande y animado)            │
│                                              │
│  Hip Thrust · Serie 2 · 60 kg               │
│                                              │
│  [ ⏸ Terminar serie ]                        │
│                                              │
├──────────────────────────────────────────────┤
│  PASO 3 · Registrar                          │
│                                              │
│  ¿Cuántas reps hiciste?                     │
│  [ 10 ]                                      │
│                                              │
│  ¿Cómo te sentiste?                         │
│  [1][2][3][4][5][6][7][8][9][10]           │
│                                              │
│  RPE 8 · Difícil                            │
│                                              │
│  [ 💾 Guardar serie ]                        │
│                                              │
└──────────────────────────────────────────────┘
```

## Comportamiento por paso

### PASO 1
- Input numérico grande para peso (solo si `tipo` incluye peso)
- Referencia "Última vez: X kg × Y reps" en gris
- Botón **▶ Empezar serie** grande y destacado
- Al pulsar: **guarda `horaInicio`** y avanza al PASO 2

### PASO 2
- Contador grande (fuente 48px mínimo, monoespaciada)
- Actualiza cada segundo con `setInterval`
- Botón **⏸ Terminar serie** grande
- Al pulsar: **guarda `horaFin`**, calcula `tiempoSeg` y avanza al PASO 3

### PASO 3
- Input de reps (solo si `tipo` incluye reps)
- Escala RPE 1–10 con botones
- Descripción dinámica ("Moderado", "Difícil", etc.)
- Botón **💾 Guardar serie**
- Al pulsar: guarda la serie, cierra modal, actualiza la vista

## Comportamiento especial por tipo

**Si `tipo === "tiempo"`** (plancha, vacíos):
- Paso 1: **NO** pide peso → salta directo al PASO 2
- Paso 3: **NO** pide reps → solo RPE

**Si `tipo === "tiempo_reps"`** (Pallof Press):
- Todos los pasos activos

**Si `tipo === "reps"`**:
- Paso 2 **opcional**: si el usuario no pulsa "Empezar serie" (porque hace la serie sin cronometrar), puede saltar directo del Paso 1 al Paso 3

---

# 4. REGLAS DE NEGOCIO

## R1 · Auto-avance entre ejercicios

Cuando **todas las series configuradas** de un ejercicio están registradas:
1. Marcar el ejercicio como `estado: "completado"`
2. Calcular `rpePromedio` = promedio de RPE de todas las series
3. Cambiar `indiceEjercicioActivo` al siguiente ejercicio con `estado: "pendiente"`
4. Toast: "Hip Thrust completado · RPE promedio 8.5"
5. En la vista, el ejercicio completado se muestra colapsado/readonly
6. El botón "Iniciar serie" **desaparece** del ejercicio completado
7. El botón "Iniciar serie" **aparece** en el siguiente ejercicio pendiente

## R2 · Bloqueo de edición

En el módulo Hoy, con sesión activa:
- ❌ **NO** mostrar botón "+ Agregar ejercicio"
- ❌ **NO** mostrar botón "+ Agregar serie"
- ❌ **NO** mostrar botón "🗑 Eliminar" en ejercicios o series
- ❌ **NO** permitir editar los inputs de series ya registradas
- ✅ **SÍ** permitir "Saltar serie" (si no es la última)
- ✅ **SÍ** permitir "Saltar ejercicio" (con razón)
- ✅ **SÍ** permitir eliminar la última serie registrada (solo 30 segundos)

## R3 · Eliminar última serie (30s)

Después de guardar una serie:
- Mostrar botón **↶ Deshacer** en la fila recién guardada
- El botón desaparece después de **30 segundos**
- Al pulsar: elimina la serie del array y vuelve a mostrar el botón "Iniciar serie"

## R4 · Saltar serie individual

Disponible en el PASO 1 del modal:
- Botón secundario "⊘ Saltar esta serie"
- Al pulsar: registra la serie como saltada sin razón y cierra el modal
- No cuenta para el auto-avance del ejercicio

## R5 · Saltar ejercicio completo

Disponible en cada card de ejercicio:
- Botón **⊘ No lo hice** (visible solo si `estado === "pendiente"` o `"en_curso"`)
- Al pulsar: abre modal de razones
- Razones predefinidas:
  1. Máquina ocupada
  2. Falta de tiempo
  3. Molestia o dolor
  4. Fatiga / sin energía
  5. Cambié de ejercicio
  6. Otro (con texto libre)
- Al confirmar: marca `estado: "saltado"`, guarda `razonSalto`
- La card se ve en gris tenue, con la razón visible
- El ejercicio saltado **NO** cuenta para el auto-avance (pasa al siguiente)

## R6 · Snapshot inmutable

Al crear la sesión desde el modal de rutina:
- Se **copian** todos los ejercicios, series configuradas, prescripciones y core
- La sesión no mantiene referencias a la rutina original
- Cambios futuros en la rutina **no afectan** sesiones pasadas

---

# 5. HTML · Modal de serie

```html
<div class="modal modal-serie" id="modal-serie" hidden role="dialog" aria-modal="true" aria-labelledby="modal-serie-titulo">
  <div class="modal-backdrop" data-action="cerrar-serie"></div>
  <div class="modal-panel modal-panel-serie">

    <header class="modal-header">
      <div>
        <h2 id="modal-serie-titulo" data-nombre-ej>Ejercicio</h2>
        <p class="modal-subtitle"><span data-serie-actual>Serie 1</span> de <span data-serie-total>4</span></p>
      </div>
      <button class="modal-close" data-action="cerrar-serie" aria-label="Cerrar">✕</button>
    </header>

    <!-- PASO 1 -->
    <div class="modal-body paso paso-1" data-paso="1">
      <div class="paso-titulo">Preparación</div>

      <div class="campo-grande campo-peso" data-campo="peso">
        <label for="input-peso">¿Con cuánto peso vas a hacer esta serie?</label>
        <div class="input-grande-wrap">
          <input type="number" inputmode="decimal" id="input-peso"
                 class="input-grande" placeholder="0" step="0.5" min="0" />
          <span class="input-unidad">kg</span>
        </div>
        <p class="referencia-ultima-vez" data-ultima-vez hidden>
          Última vez: <strong data-ultimo-peso>—</strong> × <strong data-ultimas-reps>—</strong>
        </p>
      </div>

      <button class="btn btn-primary btn-grande" data-action="empezar-serie">
        <span aria-hidden="true">▶</span> Empezar serie
      </button>

      <button class="btn btn-ghost btn-full" data-action="saltar-serie">
        <span aria-hidden="true">⊘</span> Saltar esta serie
      </button>
    </div>

    <!-- PASO 2 -->
    <div class="modal-body paso paso-2" data-paso="2" hidden>
      <div class="paso-titulo">Serie en curso</div>

      <div class="timer-gigante">
        <span class="timer-display" aria-live="polite">00:00</span>
      </div>

      <p class="timer-contexto">
        <span data-nombre-ej>Hip Thrust</span> · <span data-serie-actual>Serie 1</span> · <span data-peso-actual>—</span>
      </p>

      <button class="btn btn-danger btn-grande" data-action="terminar-serie">
        <span aria-hidden="true">⏸</span> Terminar serie
      </button>
    </div>

    <!-- PASO 3 -->
    <div class="modal-body paso paso-3" data-paso="3" hidden>
      <div class="paso-titulo">Registrar</div>

      <div class="campo-grande campo-reps" data-campo="reps">
        <label for="input-reps">¿Cuántas reps hiciste?</label>
        <div class="input-grande-wrap">
          <input type="number" inputmode="numeric" id="input-reps"
                 class="input-grande" placeholder="0" min="0" />
        </div>
      </div>

      <div class="campo-grande campo-rpe" data-campo="rpe">
        <label>¿Cómo te sentiste?</label>
        <div class="rpe-escala" role="radiogroup" aria-label="Esfuerzo percibido"></div>
        <p class="rpe-descripcion" data-rpe-desc>Selecciona un valor</p>
      </div>

      <button class="btn btn-primary btn-grande" data-action="guardar-serie">
        <span aria-hidden="true">💾</span> Guardar serie
      </button>
    </div>

  </div>
</div>
```

---

# 6. CSS · Modal de serie

```css
/* ============================================
   MODAL DE SERIE · 3 pasos
   ============================================ */
.modal-panel-serie {
  max-width: 520px;
  width: calc(100% - 32px);
  max-height: 92vh;
  overflow-y: auto;
}

.modal-serie .modal-header {
  border-bottom: 1px solid var(--border);
}
.modal-subtitle {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
}

.paso-titulo {
  font-size: var(--fs-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--primary);
  margin-bottom: var(--sp-4);
}

.campo-grande {
  margin-bottom: var(--sp-5);
}
.campo-grande label {
  display: block;
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--sp-3);
}

.input-grande-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-grande {
  width: 100%;
  font-size: 32px;
  font-weight: 700;
  padding: var(--sp-4) var(--sp-5);
  padding-right: 60px;
  background: var(--bg-sunken);
  color: var(--text);
  border: 2px solid var(--border);
  border-radius: var(--r-md);
  text-align: center;
  font-variant-numeric: tabular-nums;
  transition: border-color var(--t-fast);
}
.input-grande:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.input-unidad {
  position: absolute;
  right: var(--sp-5);
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text-muted);
  pointer-events: none;
}

.referencia-ultima-vez {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: var(--sp-2) 0 0;
  text-align: center;
}
.referencia-ultima-vez strong { color: var(--text); }

.btn-grande {
  width: 100%;
  padding: var(--sp-4) var(--sp-5);
  font-size: var(--fs-md);
  font-weight: 700;
  min-height: 56px;
}

/* Timer gigante */
.timer-gigante {
  text-align: center;
  padding: var(--sp-6) 0;
}
.timer-display {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 56px;
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}
@media (max-width: 480px) {
  .timer-display { font-size: 44px; }
}

.timer-contexto {
  text-align: center;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  margin-bottom: var(--sp-5);
}

/* RPE */
.rpe-escala {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.rpe-btn {
  aspect-ratio: 1;
  border-radius: var(--r-md);
  border: 2px solid var(--border);
  background: var(--bg-sunken);
  color: var(--text);
  font-size: var(--fs-md);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--t-fast);
}
.rpe-btn:hover { border-color: var(--primary); }
.rpe-btn.activo {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-on-primary);
  transform: scale(1.05);
}
.rpe-descripcion {
  text-align: center;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-muted);
}

/* Ocultar paso */
.paso[hidden] { display: none !important; }
```

---

# 7. JS · Lógica del modal de serie

```js
// js/serie-modal.js

import { db } from './db.js';
import { toast, abrirModal, cerrarModal } from './ui.js';

const estadoModal = {
  sesionId: null,
  ejerciciosKey: null,  // "ejercicios" | "core"
  ejIdx: null,
  serieIdx: null,
  peso: null,
  horaInicio: null,
  intervalId: null,
  tiempoSeg: 0,
};

/**
 * Abre el modal para registrar una nueva serie.
 */
export async function abrirModalSerie(sesionId, ejerciciosKey, ejIdx) {
  const sesion = await db.sesiones.get(sesionId);
  if (!sesion) return;

  const lista = sesion[ejerciciosKey];
  const ejercicio = lista[ejIdx];
  if (!ejercicio) return;

  const seriesConfiguradas = ejercicio.seriesConfiguradas || ejercicio.series;
  const seriesRegistradas = ejercicio.series?.length || 0;

  if (seriesRegistradas >= seriesConfiguradas) {
    toast('Este ejercicio ya está completo', 'info');
    return;
  }

  // Configurar estado
  estadoModal.sesionId = sesionId;
  estadoModal.ejerciciosKey = ejerciciosKey;
  estadoModal.ejIdx = ejIdx;
  estadoModal.serieIdx = seriesRegistradas;
  estadoModal.peso = null;
  estadoModal.horaInicio = null;
  estadoModal.tiempoSeg = 0;

  // Actualizar UI del modal
  const modal = document.getElementById('modal-serie');
  modal.querySelector('[data-nombre-ej]').textContent = ejercicio.nombre;
  modal.querySelectorAll('[data-serie-actual]').forEach(el => {
    el.textContent = `Serie ${seriesRegistradas + 1}`;
  });
  modal.querySelector('[data-serie-total]').textContent = seriesConfiguradas;

  // Configurar campos según tipo
  const tipo = ejercicio.tipo || 'reps';
  modal.querySelector('[data-campo="peso"]').hidden = !tipo.includes('reps') && tipo === 'tiempo';
  modal.querySelector('[data-campo="reps"]').hidden = tipo === 'tiempo';

  // Referencia "Última vez"
  await mostrarUltimaVez(sesionId, ejercicio);

  // Reset pasos
  mostrarPaso(1);
  modal.querySelector('#input-peso').value = '';
  modal.querySelector('#input-reps').value = '';
  modal.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('activo'));
  modal.querySelector('[data-rpe-desc]').textContent = 'Selecciona un valor';

  // Render RPE
  renderizarRPE();

  abrirModal('modal-serie');
}

/**
 * Muestra la referencia "Última vez" del ejercicio.
 */
async function mostrarUltimaVez(sesionId, ejercicioActual) {
  const sesiones = await db.sesiones.orderBy('fecha').reverse().toArray();
  const anterior = sesiones.find(s =>
    s.id !== sesionId &&
    s.ejercicios?.some(e => e.nombre === ejercicioActual.nombre && e.series?.length > 0)
  );

  const contenedor = document.querySelector('.referencia-ultima-vez');
  if (!anterior) { contenedor.hidden = true; return; }

  const ejAnt = anterior.ejercicios.find(e => e.nombre === ejercicioActual.nombre);
  const ultimaSerie = ejAnt.series[ejAnt.series.length - 1];

  document.querySelector('[data-ultimo-peso]').textContent = `${ultimaSerie.peso || '—'} kg`;
  document.querySelector('[data-ultimas-reps]').textContent = `${ultimaSerie.reps || '—'} reps`;
  contenedor.hidden = false;
}

/**
 * Cambia de paso en el modal.
 */
function mostrarPaso(n) {
  document.querySelectorAll('.modal-serie .paso').forEach(p => {
    p.hidden = p.dataset.paso !== String(n);
  });
}

/**
 * Renderiza la escala RPE 1-10.
 */
function renderizarRPE() {
  const escala = document.querySelector('.modal-serie .rpe-escala');
  if (escala.dataset.renderizado === '1') return;
  escala.dataset.renderizado = '1';
  escala.innerHTML = '';

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rpe-btn';
    btn.dataset.valor = i;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      escala.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      document.querySelector('[data-rpe-desc]').textContent = descripcionRPE(i);
    });
    escala.appendChild(btn);
  }
}

function descripcionRPE(n) {
  if (n <= 3) return 'Muy fácil';
  if (n <= 5) return 'Fácil';
  if (n <= 7) return 'Moderado';
  if (n <= 8) return 'Difícil';
  if (n <= 9) return 'Muy difícil';
  return 'Máximo esfuerzo';
}

/**
 * PASO 1 → PASO 2: captura el peso y arranca el timer.
 */
export async function empezarSerie() {
  const pesoInput = document.querySelector('#input-peso');
  const peso = pesoInput.value ? Number(pesoInput.value) : null;

  estadoModal.peso = peso;
  estadoModal.horaInicio = new Date().toISOString();
  estadoModal.tiempoSeg = 0;

  document.querySelector('[data-peso-actual]').textContent = peso ? `${peso} kg` : 'Sin peso';
  document.querySelector('.timer-display').textContent = '00:00';

  mostrarPaso(2);
  iniciarTimer();
}

function iniciarTimer() {
  detenerTimer();
  const inicio = Date.now();
  const display = document.querySelector('.timer-display');

  estadoModal.intervalId = setInterval(() => {
    const seg = Math.floor((Date.now() - inicio) / 1000);
    estadoModal.tiempoSeg = seg;
    display.textContent = formatearMMSS(seg);
  }, 250);
}

function detenerTimer() {
  if (estadoModal.intervalId) {
    clearInterval(estadoModal.intervalId);
    estadoModal.intervalId = null;
  }
}

/**
 * PASO 2 → PASO 3: detiene el timer y muestra el formulario.
 */
export function terminarSerie() {
  detenerTimer();
  mostrarPaso(3);
}

/**
 * PASO 3 → Guardar: guarda la serie y cierra el modal.
 */
export async function guardarSerie() {
  const repsInput = document.querySelector('#input-reps');
  const rpeBtn = document.querySelector('.rpe-btn.activo');

  const reps = repsInput.value ? Number(repsInput.value) : null;
  const rpe = rpeBtn ? Number(rpeBtn.dataset.valor) : null;

  if (!rpe) {
    toast('Selecciona tu nivel de esfuerzo', 'warning');
    return;
  }

  const sesion = await db.sesiones.get(estadoModal.sesionId);
  const ejercicio = sesion[estadoModal.ejerciciosKey][estadoModal.ejIdx];

  const nuevaSerie = {
    idx: estadoModal.serieIdx,
    peso: estadoModal.peso,
    reps,
    rpe,
    tiempoSeg: estadoModal.tiempoSeg,
    horaInicio: estadoModal.horaInicio?.slice(11, 16) || null,
    horaFin: new Date().toISOString().slice(11, 16),
    registradaEn: new Date().toISOString(),
  };

  ejercicio.series = ejercicio.series || [];
  ejercicio.series.push(nuevaSerie);

  // ¿Se completó el ejercicio?
  const total = ejercicio.seriesConfiguradas || ejercicio.series;
  if (ejercicio.series.length >= total) {
    ejercicio.estado = 'completado';
    const sum = ejercicio.series.reduce((a, s) => a + (s.rpe || 0), 0);
    ejercicio.rpePromedio = Math.round((sum / ejercicio.series.length) * 10) / 10;

    // Avanzar al siguiente ejercicio
    await avanzarAlSiguiente(sesion);
  } else {
    ejercicio.estado = 'en_curso';
  }

  await db.sesiones.put(sesion);
  cerrarModal('modal-serie');

  // Toast y re-render
  toast(`Serie ${nuevaSerie.idx + 1} guardada · ${nuevaSerie.peso || '—'} kg × ${reps || '—'} reps`, 'success');
  document.dispatchEvent(new CustomEvent('gw:sesion-actualizada', { detail: { sesionId: sesion.id } }));
}

/**
 * Marca el siguiente ejercicio como activo.
 */
async function avanzarAlSiguiente(sesion) {
  const lista = sesion.ejercicios;
  const actualIdx = estadoModal.ejIdx;

  for (let i = actualIdx + 1; i < lista.length; i++) {
    if (lista[i].estado === 'pendiente' || lista[i].estado === 'en_curso') {
      sesion.indiceEjercicioActivo = i;
      if (lista[i].estado === 'pendiente') lista[i].estado = 'en_curso';
      return;
    }
  }

  // Si no hay más pendientes, marcar sesión como lista para terminar
  const todosListos = lista.every(e => ['completado', 'saltado'].includes(e.estado));
  if (todosListos) {
    toast('¡Todos los ejercicios listos! Puedes terminar el gym', 'success');
  }
}

/**
 * Saltar la serie actual sin registrarla.
 */
export function saltarSerieActual() {
  detenerTimer();
  cerrarModal('modal-serie');
  toast('Serie saltada', 'info');
  document.dispatchEvent(new CustomEvent('gw:sesion-actualizada'));
}

function formatearMMSS(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Wiring del modal · llamar UNA VEZ al iniciar la app.
 */
export function inicializarModalSerie() {
  document.querySelectorAll('[data-action="cerrar-serie"]').forEach(el => {
    el.addEventListener('click', () => {
      detenerTimer();
      cerrarModal('modal-serie');
    });
  });
  document.querySelector('[data-action="empezar-serie"]')?.addEventListener('click', empezarSerie);
  document.querySelector('[data-action="terminar-serie"]')?.addEventListener('click', terminarSerie);
  document.querySelector('[data-action="guardar-serie"]')?.addEventListener('click', guardarSerie);
  document.querySelector('[data-action="saltar-serie"]')?.addEventListener('click', saltarSerieActual);
}
```

---

# 8. VISTA DEL MÓDULO HOY · Renderizado

## Estructura de cada card

**Ejercicio activo (con series registradas):**
```
┌────────────────────────────────────────────┐
│  1. Hip Thrust con Barra         ⊘ No lo hice│
│     4 series × 8-10 reps                    │
│                                            │
│  ✓ S1 · 60 kg × 10 · RPE 10 · 00:45       │
│  ✓ S2 · 65 kg × 8  · RPE 9  · 00:52       │
│                                            │
│  [ ▶ Iniciar serie 3 ]                     │
└────────────────────────────────────────────┘
```

**Ejercicio completado:**
```
┌────────────────────────────────────────────┐
│  ✓ Hip Thrust con Barra                     │
│     4/4 series · RPE promedio 8.5          │
│                                            │
│  ✓ S1 · 60 kg × 10 · RPE 10 · 00:45       │
│  ✓ S2 · 65 kg × 8  · RPE 9  · 00:52       │
│  ✓ S3 · 65 kg × 8  · RPE 8  · 00:50       │
│  ✓ S4 · 70 kg × 7  · RPE 9  · 00:48       │
└────────────────────────────────────────────┘
```

**Ejercicio saltado:**
```
┌────────────────────────────────────────────┐
│  ⊘ Peso Muerto Rumano                       │
│     No realizado · Máquina ocupada         │
│     Registrado 17:48                        │
└────────────────────────────────────────────┘
```

**Ejercicio pendiente:**
```
┌────────────────────────────────────────────┐
│  3. Sentadilla Búlgara          ⊘ No lo hice│
│     3 series × 10 / pierna                 │
│                                            │
│  [ ▶ Iniciar serie 1 ]                     │
└────────────────────────────────────────────┘
```

## HTML de la card

```html
<article class="ejercicio-card" data-ej-idx="0" data-estado="en_curso">
  <header class="ejercicio-card-header">
    <div class="ejercicio-card-title">
      <span class="ejercicio-num">1</span>
      <div>
        <h3 class="ejercicio-card-nombre">Hip Thrust con Barra</h3>
        <p class="ejercicio-card-prescripcion">4 series × 8-10 reps · Pausa de 1 s arriba</p>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm" data-action="saltar-ejercicio">
      ⊘ No lo hice
    </button>
  </header>

  <ul class="series-registradas">
    <li class="serie-registrada">
      <span class="serie-check">✓</span>
      <span class="serie-resumen">S1 · 60 kg × 10 · RPE 10 · 00:45</span>
    </li>
    <li class="serie-registrada">
      <span class="serie-check">✓</span>
      <span class="serie-resumen">S2 · 65 kg × 8 · RPE 9 · 00:52</span>
    </li>
  </ul>

  <button class="btn btn-primary btn-full" data-action="iniciar-serie">
    <span aria-hidden="true">▶</span> Iniciar serie 3
  </button>
</article>
```

## CSS de la card y las series registradas

```css
.series-registradas {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.serie-registrada {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: var(--success-soft);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
}
.serie-check {
  color: var(--success);
  font-weight: 700;
}
.serie-resumen {
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* Ejercicio completado */
.ejercicio-card[data-estado="completado"] {
  border-left: 3px solid var(--success);
  opacity: 0.92;
}
.ejercicio-card[data-estado="completado"] .ejercicio-card-nombre {
  color: var(--success);
}

/* Ejercicio saltado */
.ejercicio-card[data-estado="saltado"] {
  opacity: 0.6;
  border-left: 3px solid var(--text-disabled);
}
.ejercicio-card[data-estado="saltado"] .ejercicio-card-nombre {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Botón saltar ejercicio */
.btn-sm {
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-xs);
  min-height: auto;
}
```

---

# 9. MODAL · Saltar ejercicio con razón

```html
<div class="modal" id="modal-saltar-ejercicio" hidden role="dialog" aria-modal="true">
  <div class="modal-backdrop" data-action="cerrar-saltar"></div>
  <div class="modal-panel">
    <header class="modal-header">
      <h2>¿Por qué no hiciste este ejercicio?</h2>
      <button class="modal-close" data-action="cerrar-saltar" aria-label="Cerrar">✕</button>
    </header>
    <div class="modal-body">
      <p class="text-muted" data-nombre-ej-saltar></p>
      <div class="razones-list">
        <button class="razon-btn" data-razon="Máquina ocupada">Máquina ocupada</button>
        <button class="razon-btn" data-razon="Falta de tiempo">Falta de tiempo</button>
        <button class="razon-btn" data-razon="Molestia o dolor">Molestia o dolor</button>
        <button class="razon-btn" data-razon="Fatiga / sin energía">Fatiga / sin energía</button>
        <button class="razon-btn" data-razon="Cambié de ejercicio">Cambié de ejercicio</button>
        <button class="razon-btn razon-otro" data-razon="otro">Otro…</button>
      </div>
      <div class="razon-otro-campo" hidden>
        <label for="razon-libre">Escribe el motivo:</label>
        <textarea id="razon-libre" class="input" rows="3"
                  placeholder="Ej. No encontré la máquina en buen estado"></textarea>
      </div>
    </div>
    <footer class="modal-footer">
      <button class="btn btn-secondary" data-action="cerrar-saltar">Cancelar</button>
      <button class="btn btn-primary" data-action="confirmar-saltar">Confirmar</button>
    </footer>
  </div>
</div>
```

**CSS:**
```css
.razones-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: var(--sp-4) 0;
}
.razon-btn {
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-sunken);
  border: 2px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text);
  font-size: var(--fs-base);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all var(--t-fast);
}
.razon-btn:hover {
  border-color: var(--primary);
  background: var(--surface-hover);
}
.razon-btn.activo {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-on-primary);
}
.razon-otro-campo {
  margin-top: var(--sp-3);
}
.razon-otro-campo label {
  display: block;
  font-size: var(--fs-sm);
  font-weight: 600;
  margin-bottom: var(--sp-2);
}
```

---

# 10. CORE DIARIO · Mismo flujo

El core diario usa **exactamente** el mismo modal de serie que los ejercicios.
La única diferencia es que la clave es `core` en vez de `ejercicios`.

**Render del core:**
```html
<article class="ejercicio-card core-card" data-core-idx="0" data-estado="pendiente">
  <header class="ejercicio-card-header">
    <div class="ejercicio-card-title">
      <span class="ejercicio-num">C1</span>
      <div>
        <h3 class="ejercicio-card-nombre">Vacíos Abdominales</h3>
        <p class="ejercicio-card-prescripcion">4 series × 15-20 s</p>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm" data-action="saltar-ejercicio">
      ⊘ No lo hice
    </button>
  </header>

  <ul class="series-registradas"><!-- generado dinámicamente --></ul>

  <button class="btn btn-primary btn-full" data-action="iniciar-serie-core">
    <span aria-hidden="true">▶</span> Iniciar serie 1
  </button>
</article>
```

**JS:** misma función `abrirModalSerie(sesionId, 'core', idx)`.

---

# 11. MODAL · Resumen al terminar el gym

```html
<div class="modal" id="modal-resumen-sesion" hidden role="dialog" aria-modal="true">
  <div class="modal-backdrop" data-action="cerrar-resumen"></div>
  <div class="modal-panel">
    <header class="modal-header">
      <h2>🎉 Sesión terminada</h2>
    </header>
    <div class="modal-body">
      <div class="resumen-grid">
        <div class="resumen-item">
          <span class="resumen-label">Duración</span>
          <span class="resumen-valor" data-resumen-duracion>—</span>
        </div>
        <div class="resumen-item">
          <span class="resumen-label">Ejercicios completados</span>
          <span class="resumen-valor" data-resumen-ejercicios>—</span>
        </div>
        <div class="resumen-item">
          <span class="resumen-label">Series totales</span>
          <span class="resumen-valor" data-resumen-series>—</span>
        </div>
        <div class="resumen-item">
          <span class="resumen-label">Volumen (kg)</span>
          <span class="resumen-valor" data-resumen-volumen>—</span>
        </div>
        <div class="resumen-item">
          <span class="resumen-label">RPE promedio</span>
          <span class="resumen-valor" data-resumen-rpe>—</span>
        </div>
        <div class="resumen-item">
          <span class="resumen-label">Ejercicios saltados</span>
          <span class="resumen-valor" data-resumen-saltados>—</span>
        </div>
      </div>
    </div>
    <footer class="modal-footer">
      <button class="btn btn-primary btn-full" data-action="cerrar-resumen">Listo</button>
    </footer>
  </div>
</div>
```

**Cálculo de volumen:**
```js
const volumen = sesion.ejercicios.reduce((total, ej) => {
  return total + (ej.series || []).reduce((sub, s) => {
    return sub + ((s.peso || 0) * (s.reps || 0));
  }, 0);
}, 0);
```

**CSS del resumen:**
```css
.resumen-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.resumen-item {
  padding: var(--sp-3);
  background: var(--bg-sunken);
  border-radius: var(--r-md);
  text-align: center;
}
.resumen-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--sp-1);
}
.resumen-valor {
  display: block;
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
```

---

# 12. EXPORTACIÓN ACTUALIZADA

## CSV de sesiones

Nuevas columnas: `estado`, `razon_salto`, `tipo`, `rpe_promedio`:

```
fecha,dia,ejercicio,tipo,serie,peso,reps,rpe,tiempo_seg,estado,razon_salto,rpe_promedio,hora_inicio,hora_fin,duracion_min
2026-09-20,Lunes,Hip Thrust con Barra,reps,1,60,10,10,45,completado,,8.5,20:04,21:16,72
2026-09-20,Lunes,Hip Thrust con Barra,reps,2,65,8,9,52,completado,,8.5,20:04,21:16,72
2026-09-20,Lunes,Peso Muerto Rumano,reps,,,,,saltado,Máquina ocupada,,20:04,21:16,72
2026-09-20,Lunes,Vacíos Abdominales,tiempo,1,,,6,20,completado,,6.0,20:04,21:16,72
```

## XLSX

Agregar las mismas columnas en la hoja "Sesiones". En la hoja "Rutina" agregar la columna `tipo`.

---

# 13. CHECKLIST DE VERIFICACIÓN

## Modal de serie
- [ ] Al pulsar "Iniciar serie" se abre el modal centrado
- [ ] Paso 1 pide peso (solo si `tipo` incluye reps)
- [ ] Se muestra "Última vez: X kg × Y reps"
- [ ] Al pulsar "Empezar serie" avanza al Paso 2 con timer corriendo
- [ ] El timer actualiza cada segundo
- [ ] Al pulsar "Terminar serie" avanza al Paso 3
- [ ] El Paso 3 pide reps y RPE
- [ ] La escala RPE muestra la descripción al pulsar
- [ ] Al guardar, el modal cierra y aparece la serie en la lista de abajo
- [ ] La serie registrada es **readonly** (no se puede editar)

## Auto-avance
- [ ] Al completar la última serie del ejercicio → se marca como completado
- [ ] El botón "Iniciar serie" desaparece del ejercicio completado
- [ ] El siguiente ejercicio muestra "Iniciar serie 1" automáticamente
- [ ] El ejercicio completado muestra el RPE promedio

## Bloqueo
- [ ] En el módulo Hoy **NO** aparece "+ Agregar ejercicio"
- [ ] **NO** aparece "+ Agregar serie"
- [ ] **NO** aparece "🗑 Eliminar"
- [ ] Los inputs de series registradas están readonly

## Saltar
- [ ] Botón "⊘ No lo hice" en cada ejercicio pendiente
- [ ] Al pulsarlo abre el modal de razones
- [ ] Las 6 razones predefinidas están visibles
- [ ] "Otro" abre textarea libre
- [ ] Al confirmar → el ejercicio se ve gris con la razón
- [ ] El ejercicio saltado no cuenta para el auto-avance

## Core
- [ ] Cada item de core tiene su propio botón "Iniciar serie"
- [ ] Usa el mismo modal de serie
- [ ] El bloqueo aplica igual

## Resumen
- [ ] Al pulsar "Terminar gym" se muestra el modal de resumen
- [ ] Los 6 datos están calculados correctamente
- [ ] El volumen se calcula con peso × reps

## Eliminar última serie
- [ ] Después de guardar una serie → aparece "↶ Deshacer" por 30s
- [ ] Al pulsar → elimina la serie
- [ ] Después de 30s el botón desaparece

## Persistencia
- [ ] Recargar la app → la sesión mantiene todas las series
- [ ] El índice del ejercicio activo se conserva

---

# 14. ORDEN DE APLICACIÓN

1. **Modelo de datos** → agregar `tipo`, `estado`, `razonSalto` en `db.js` seed
2. **HTML del modal de serie** → al final del `<body>`
3. **CSS del modal** → agregar a `styles.css`
4. **JS del modal** → crear `js/serie-modal.js`
5. **HTML del modal saltar** → al final del `<body>`
6. **CSS del modal saltar** → agregar a `styles.css`
7. **JS del saltar** → dentro de `serie-modal.js` o `sesion.js`
8. **HTML del modal resumen** → al final del `<body>`
9. **CSS del resumen** → agregar a `styles.css`
10. **JS del resumen** → dentro de `sesion.js`
11. **Refactor `renderizarHoy()`** → quitar botones de edición, agregar "Iniciar serie"
12. **Refactor Core** → usar el mismo flujo
13. **Wire en `app.js`** → `inicializarModalSerie()` al arrancar
14. **Exportación** → agregar columnas nuevas
15. **Probar checklist completo**

---

# 15. REGLAS INQUEBRANTABLES

- ❌ **NO** permitir editar series ya guardadas
- ❌ **NO** permitir agregar ejercicios/series durante la sesión
- ❌ **NO** permitir eliminar ejercicios durante la sesión
- ✅ **SÍ** permitir saltar series y ejercicios con razón
- ✅ **SÍ** permitir eliminar la última serie por 30 segundos
- ✅ **SÍ** auto-avanzar al terminar todas las series configuradas
- ✅ **SÍ** copiar la rutina como snapshot inmutable al crear la sesión
- ✅ **SÍ** mostrar "Última vez" como referencia (no pre-rellenar)
- ✅ **SÍ** guardar `tiempoSeg` por serie

# FIN DEL PROMPT
# REFACTOR UI · Módulo Rutina + Módulo Hoy (Sesión activa)

Este documento REEMPLAZA el diseño actual del módulo Rutina y del módulo Hoy.
Aplica TODO lo descrito aquí, sin excepción.

---

# 1. MÓDULO RUTINA · REDISEÑO COMPLETO

## Problema actual

La vista de Rutina muestra todos los días en acordeón abierto con formularios
gigantes de Nombre / Enfoque / Ejercicios visibles al mismo tiempo. Es abrumador,
ocupa mucho scroll y no permite ver rápido qué días están configurados.

## Nuevo diseño · Vista de lista colapsable

### Estructura

```
┌────────────────────────────────────────────────────┐
│  Rutina                                            │
│  Edita días, ejercicios y la rutina activa.        │
│                                                    │
│  [+ Crear nueva]  [Duplicar actual]  [Restaurar]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Rutina activa                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Gym Wolf 5 Días                          ▾   │  │
│  └──────────────────────────────────────────────┘  │
│  Estado: [Rutina por defecto]                      │
│                                                    │
│  Días de la rutina                                 │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶  Lunes                        [Activo]  ▸ │  │
│  │    Glúteo Mayor & Femorales · 5 ejercicios   │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶  Martes                                ▸  │  │
│  │    Torso Estratégico · 5 ejercicios          │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶  Miércoles                             ▸  │  │
│  │    Cuádriceps & Glúteo · 5 ejercicios        │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶  Jueves                                ▸  │  │
│  │    Torso & Detalle · 5 ejercicios            │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶  Viernes                               ▸  │  │
│  │    Glúteo Hipertrofia & Bombeo · 5 ejercicios│  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Comportamiento

1. **Por defecto: TODOS los días están colapsados.** Se ven como tarjetas de una
   sola línea + subtítulo con enfoque y nº de ejercicios.
2. **Al pulsar una tarjeta** → se expande mostrando:
   - Nombre editable del día
   - Enfoque editable
   - Lista compacta de ejercicios (solo lectura visual)
   - Botones de acción por ejercicio: ✎ Editar · 📋 Duplicar · 🗑 Eliminar
   - Botón **+ Agregar ejercicio** al final de la lista
   - Toggle **Día de descanso**
3. **Solo UN día expandido a la vez** (tipo acordeón exclusivo).
4. **Al expandir otro, se colapsa el anterior.**
5. **Persistir cuál día está expandido** en `sessionStorage` para no perderlo
   al recargar.

### HTML · Estructura del módulo Rutina

```html
<section id="rutina" class="module" hidden>
  <header class="module-header">
    <div>
      <h1>Rutina</h1>
      <p class="module-subtitle">Edita días, ejercicios y la rutina activa.</p>
    </div>
    <div class="module-actions">
      <button class="btn btn-secondary" data-action="crear-rutina">
        <span aria-hidden="true">+</span> Crear nueva rutina
      </button>
      <button class="btn btn-secondary" data-action="duplicar-rutina">
        <span aria-hidden="true">✎</span> Duplicar actual
      </button>
      <button class="btn btn-primary" data-action="restaurar-rutina">
        <span aria-hidden="true">✓</span> Restaurar por defecto
      </button>
    </div>
  </header>

  <div class="card">
    <div class="rutina-selector-row">
      <div class="field">
        <label class="field-label" for="rutina-activa">Rutina activa</label>
        <select id="rutina-activa" class="input"></select>
      </div>
      <div class="field">
        <label class="field-label">Estado</label>
        <span class="badge badge-success">Rutina por defecto</span>
      </div>
    </div>
  </div>

  <h2 class="section-title">Días de la rutina</h2>

  <div class="dias-list" role="list">
    <!-- Tarjetas generadas dinámicamente con JS -->
    <!-- Ejemplo de una colapsada: -->
    <div class="dia-item" role="listitem" data-dia-id="lunes">
      <button class="dia-header" aria-expanded="false" aria-controls="dia-body-lunes">
        <span class="dia-chevron" aria-hidden="true">▸</span>
        <div class="dia-header-text">
          <span class="dia-nombre">Lunes</span>
          <span class="dia-meta">Glúteo Mayor & Femorales · 5 ejercicios</span>
        </div>
        <span class="badge badge-active">Activo</span>
      </button>

      <div class="dia-body" id="dia-body-lunes" hidden>
        <div class="dia-fields">
          <div class="field">
            <label class="field-label">Nombre</label>
            <input type="text" class="input" value="Lunes" />
          </div>
          <div class="field">
            <label class="field-label">Enfoque</label>
            <input type="text" class="input" value="Glúteo Mayor & Femorales" />
          </div>
        </div>

        <label class="toggle-row">
          <input type="checkbox" />
          <span>Día de descanso</span>
        </label>

        <h3 class="ejercicios-title">Ejercicios</h3>
        <ul class="ejercicios-list">
          <!-- Ejercicios generados con JS -->
        </ul>

        <button class="btn btn-secondary btn-full" data-action="agregar-ejercicio">
          <span aria-hidden="true">+</span> Agregar ejercicio
        </button>
      </div>
    </div>
  </div>
</section>
```

### CSS · Vista de lista colapsable

```css
/* ============================================
   MÓDULO RUTINA · Lista colapsable
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
  flex-wrap: wrap;
}

.rutina-selector-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sp-4);
  align-items: end;
}
@media (max-width: 640px) {
  .rutina-selector-row { grid-template-columns: 1fr; }
}

.section-title {
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text);
  margin: var(--sp-5) 0 var(--sp-3);
}

/* Lista de días */
.dias-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.dia-item {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
}
.dia-item:has(.dia-header[aria-expanded="true"]) {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.dia-header {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-4) var(--sp-5);
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  color: var(--text);
  transition: background var(--t-fast);
}
.dia-header:hover { background: var(--surface-hover); }
.dia-header:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.dia-chevron {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  transition: transform var(--t-base);
}
.dia-header[aria-expanded="true"] .dia-chevron {
  transform: rotate(90deg);
  color: var(--primary);
}

.dia-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dia-nombre {
  font-size: var(--fs-base);
  font-weight: 700;
  color: var(--text);
}
.dia-meta {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--sp-3);
  border-radius: var(--r-full);
  font-size: var(--fs-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.badge-active {
  background: var(--primary-soft);
  color: var(--primary);
}
.badge-success {
  background: var(--success-soft);
  color: var(--success);
}

/* Cuerpo expandido */
.dia-body {
  padding: var(--sp-4) var(--sp-5) var(--sp-5);
  border-top: 1px solid var(--border);
  background: var(--bg-sunken);
  animation: expand-in 240ms ease;
}
@keyframes expand-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dia-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}
@media (max-width: 640px) {
  .dia-fields { grid-template-columns: 1fr; }
}

.ejercicios-title {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text);
  margin: var(--sp-4) 0 var(--sp-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ejercicios-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ejercicio-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.ejercicio-row .drag-handle {
  color: var(--text-muted);
  cursor: grab;
  font-size: 16px;
  line-height: 1;
}
.ejercicio-info {
  flex: 1;
  min-width: 0;
}
.ejercicio-nombre {
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--text);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ejercicio-detalle {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin-top: 2px;
}
.ejercicio-actions {
  display: flex;
  gap: var(--sp-1);
}
.ejercicio-actions button {
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.ejercicio-actions button:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.ejercicio-actions button[data-action="eliminar"]:hover {
  background: rgba(198, 40, 40, 0.1);
  color: var(--danger);
  border-color: var(--danger);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--bg-elev);
  border-radius: var(--r-md);
  margin-bottom: var(--sp-4);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-weight: 600;
}

.btn-full { width: 100%; }
```

### JS · Acordeón exclusivo

```js
// En js/rutinas.js

export function inicializarAcordeon() {
  const items = document.querySelectorAll('.dia-item');

  items.forEach(item => {
    const header = item.querySelector('.dia-header');
    const body = item.querySelector('.dia-body');

    header.addEventListener('click', () => {
      const estabaAbierto = header.getAttribute('aria-expanded') === 'true';

      // Cerrar todos
      document.querySelectorAll('.dia-header').forEach(h => {
        h.setAttribute('aria-expanded', 'false');
        const b = h.parentElement.querySelector('.dia-body');
        if (b) b.hidden = true;
      });

      // Si estaba cerrado, abrirlo
      if (!estabaAbierto) {
        header.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        sessionStorage.setItem('gw_dia_abierto', item.dataset.diaId);
      } else {
        sessionStorage.removeItem('gw_dia_abierto');
      }
    });
  });

  // Restaurar el último abierto
  const ultimo = sessionStorage.getItem('gw_dia_abierto');
  if (ultimo) {
    const item = document.querySelector(`.dia-item[data-dia-id="${ultimo}"]`);
    item?.querySelector('.dia-header')?.click();
  }
}
```

---

# 2. MÓDULO HOY · SELECCIÓN DE RUTINA + REGISTRO POR SERIE CON TIMER

## Problema actual

Al entrar a "Hoy" con una sesión nueva, pide **agregar ejercicios uno por uno**.
Es tedioso. Además no hay forma de:
- Cronometrar cada serie individualmente
- Registrar el tiempo real de cada serie
- Preguntar el nivel de cansancio al terminar un ejercicio

## Nuevo flujo esperado

### Paso 1 · Selección de rutina al iniciar

Cuando el usuario pulsa **"▶ Iniciar día"** (o cuando entra a "Hoy" sin sesión):

1. Abre el **modal de selección de rutina** (ver `PROMPT_FLUJO_RUTINA.md`)
2. El usuario elige el día de la rutina (o acepta el sugerido)
3. Se cargan **TODOS los ejercicios automáticamente** con sus series predefinidas
4. Redirige a "Hoy" con la sesión ya lista

### Paso 2 · Vista de la sesión (nueva)

```
┌────────────────────────────────────────────────────┐
│  Hoy · Lunes                                       │
│  Glúteo Mayor & Femorales                          │
│                                                    │
│  [⏹ Terminar gym]  [✓ Guardado]                    │
├────────────────────────────────────────────────────┤
│  Fecha: 2026-09-20   Tiempo: 12 min                │
│  Inicio: 20:04       Fin: —                        │
│                                                    │
│  Energía [8 ▾]   Cardio [____]   Unidad [kg]       │
│  Notas: [_________________________]                │
├────────────────────────────────────────────────────┤
│  Ejercicios                                        │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  1. Hip Thrust con Barra                     │  │
│  │     4 series × 8-10 reps                     │  │
│  │                                              │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ S1   [80] kg   [10] reps   ▶ 00:45    │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ S2   [   ] kg  [   ] reps  ▶ 00:00    │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ S3   [   ] kg  [   ] reps  ▶ 00:00    │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ S4   [   ] kg  [   ] reps  ▶ 00:00    │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  2. Peso Muerto Rumano                       │  │
│  │     4 series × 10-12 reps                    │  │
│  │     ...                                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [+ Agregar ejercicio extra]                       │
├────────────────────────────────────────────────────┤
│  Core diario                                       │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

## Estructura de cada serie

Cada serie tiene su propia fila con:

- **Etiqueta** `S1`, `S2`, `S3`, `S4`
- **Input de peso** (`kg` o `lb` según configuración)
- **Input de reps**
- **Botón ▶** (play) · **Botón ⏸** (stop) · **Botón ✓** (completada)
- **Contador de tiempo** en formato `MM:SS` que corre mientras está activo

### Estados de una serie

| Estado | Botón visible | Qué hace |
|--------|--------------|----------|
| **Inactiva** | ▶ (play) | Al pulsar → empieza a contar tiempo |
| **Activa (corriendo)** | ⏸ (stop) | Al pulsar → detiene el cronómetro, guarda tiempo |
| **Completada** | ✓ verde | Bloqueada, se puede re-editar pulsando el ✎ |

### Flujo de una serie

1. Usuario abre la serie, ve `S1 [80] kg [10] reps ▶ 00:00`
2. Pulsa **▶** → el cronómetro empieza a correr
3. El botón cambia a **⏸**
4. Cuando termina la serie → pulsa **⏸**
5. El cronómetro se detiene, se guarda el tiempo en `tiempoSeg`
6. La fila se marca con ✓ verde
7. Pasa automáticamente a la siguiente serie (opcional)

### Flujo del ejercicio completo

1. Cuando **TODAS las series están completadas** (✓ en todas)
2. Aparece un **modal de feedback**:
   ```
   ┌────────────────────────────────────┐
   │  ¡Hip Thrust completado! 🎉        │
   │                                    │
   │  ¿Cómo te sientes?                 │
   │                                    │
   │  Fácil  [1] [2] [3] [4] [5] [6]    │
   │         [7] [8] [9] [10] Agotada   │
   │                                    │
   │  RPE: 7 · Esfuerzo moderado        │
   │                                    │
   │  [Saltar]  [Guardar]               │
   └────────────────────────────────────┘
   ```
3. El usuario elige 1–10 (escala de cansancio percibido)
4. Se guarda como `rpe` del ejercicio completo
5. Toast: "Ejercicio guardado · RPE 7"

## HTML · Card de ejercicio

```html
<article class="ejercicio-card" data-ejercicio-id="uuid">
  <header class="ejercicio-card-header">
    <div class="ejercicio-card-title">
      <span class="ejercicio-num">1</span>
      <div>
        <h3 class="ejercicio-card-nombre">Hip Thrust con Barra</h3>
        <p class="ejercicio-card-prescripcion">4 series × 8-10 reps</p>
      </div>
    </div>
    <button class="btn-icon-sm" data-action="menu-ejercicio" aria-label="Más opciones">⋯</button>
  </header>

  <div class="series-list">
    <div class="serie-row" data-serie-idx="0">
      <span class="serie-label">S1</span>
      <div class="serie-input-group">
        <input type="number" class="input serie-peso" inputmode="decimal"
               placeholder="kg" aria-label="Peso serie 1" />
        <span class="input-suffix">kg</span>
      </div>
      <div class="serie-input-group">
        <input type="number" class="input serie-reps" inputmode="numeric"
               placeholder="reps" aria-label="Reps serie 1" />
      </div>
      <button class="serie-timer-btn" data-action="toggle-timer" aria-label="Iniciar serie 1">
        <span class="icon-play" aria-hidden="true">▶</span>
        <span class="icon-stop" aria-hidden="true" hidden>⏸</span>
      </button>
      <span class="serie-timer" aria-live="off">00:00</span>
    </div>

    <div class="serie-row" data-serie-idx="1">
      <span class="serie-label">S2</span>
      <!-- ... mismo patrón ... -->
    </div>
  </div>
</article>
```

## CSS · Estilos de la serie

```css
/* ============================================
   MÓDULO HOY · Card de ejercicio y series
   ============================================ */
.ejercicio-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-4);
  margin-bottom: var(--sp-4);
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
}
.ejercicio-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  font-size: var(--fs-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ejercicio-card-nombre {
  font-size: var(--fs-base);
  font-weight: 700;
  color: var(--text);
  margin: 0;
}
.ejercicio-card-prescripcion {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
}

/* Serie individual */
.series-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.serie-row {
  display: grid;
  grid-template-columns: 32px 1fr 1fr auto auto;
  gap: var(--sp-2);
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  transition: border-color var(--t-fast), background var(--t-fast);
}

.serie-row[data-estado="activa"] {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.serie-row[data-estado="completada"] {
  border-color: var(--success);
  background: var(--success-soft);
}

.serie-label {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text-muted);
  text-align: center;
}
.serie-row[data-estado="completada"] .serie-label {
  color: var(--success);
}

.serie-input-group {
  position: relative;
  display: flex;
  align-items: center;
}
.serie-input-group .input {
  width: 100%;
  padding-right: 32px;
  font-size: var(--fs-base);
  font-weight: 600;
  text-align: center;
}
.input-suffix {
  position: absolute;
  right: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  pointer-events: none;
}

/* Botón timer */
.serie-timer-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  background: var(--bg-elev);
  color: var(--primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all var(--t-fast);
}
.serie-timer-btn:hover {
  border-color: var(--primary);
  transform: scale(1.05);
}
.serie-row[data-estado="activa"] .serie-timer-btn {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-on-primary);
  animation: pulse-timer 1.5s ease-in-out infinite;
}
@keyframes pulse-timer {
  0%, 100% { box-shadow: 0 0 0 0 var(--primary-soft); }
  50%      { box-shadow: 0 0 0 6px var(--primary-soft); }
}

.serie-row[data-estado="completada"] .serie-timer-btn {
  background: var(--success);
  border-color: var(--success);
  color: white;
}

/* Contador de tiempo */
.serie-timer {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text-muted);
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.serie-row[data-estado="activa"] .serie-timer {
  color: var(--primary);
}
.serie-row[data-estado="completada"] .serie-timer {
  color: var(--success);
}

/* Móvil: apilar en 2 filas */
@media (max-width: 480px) {
  .serie-row {
    grid-template-columns: 28px 1fr 40px;
    grid-template-rows: auto auto;
    row-gap: var(--sp-2);
  }
  .serie-input-group:nth-of-type(1) { grid-column: 2; }
  .serie-input-group:nth-of-type(2) { grid-column: 2; grid-row: 2; }
  .serie-timer-btn { grid-row: 1 / 3; grid-column: 3; }
  .serie-timer { grid-column: 3; grid-row: 2; font-size: 11px; }
}
```

## JS · Lógica del timer por serie

```js
// En js/sesion.js

const timersActivos = new Map(); // serieKey -> { start, intervalId }

/**
 * Alterna el estado de una serie: inicia o detiene el cronómetro.
 */
export async function toggleSerieTimer(sesionId, ejercicioIdx, serieIdx) {
  const serieKey = `${sesionId}::${ejercicioIdx}::${serieIdx}`;
  const row = document.querySelector(
    `.serie-row[data-sesion="${sesionId}"][data-ej="${ejercicioIdx}"][data-serie="${serieIdx}"]`
  );
  if (!row) return;

  const estado = row.dataset.estado || 'inactiva';

  if (estado === 'inactiva' || estado === 'completada') {
    // INICIAR
    row.dataset.estado = 'activa';
    row.querySelector('.icon-play').hidden = true;
    row.querySelector('.icon-stop').hidden = false;

    const start = Date.now();
    const timerEl = row.querySelector('.serie-timer');
    const intervalId = setInterval(() => {
      const seg = Math.floor((Date.now() - start) / 1000);
      timerEl.textContent = formatearMMSS(seg);
    }, 250);

    timersActivos.set(serieKey, { start, intervalId, timerEl });

  } else if (estado === 'activa') {
    // DETENER
    const data = timersActivos.get(serieKey);
    if (!data) return;
    clearInterval(data.intervalId);
    timersActivos.delete(serieKey);

    const seg = Math.floor((Date.now() - data.start) / 1000);
    data.timerEl.textContent = formatearMMSS(seg);

    row.dataset.estado = 'completada';
    row.querySelector('.icon-play').hidden = false;
    row.querySelector('.icon-stop').hidden = true;

    // Guardar en IndexedDB
    await guardarTiempoSerie(sesionId, ejercicioIdx, serieIdx, seg);

    // Verificar si todas las series están completadas
    await verificarEjercicioCompletado(sesionId, ejercicioIdx);
  }
}

function formatearMMSS(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function guardarTiempoSerie(sesionId, ejIdx, serIdx, seg) {
  const sesion = await db.sesiones.get(sesionId);
  if (!sesion) return;
  const serie = sesion.ejercicios[ejIdx]?.series[serIdx];
  if (!serie) return;
  serie.tiempoSeg = seg;
  serie.hecho = true;
  await db.sesiones.put(sesion);
}

/**
 * Si todas las series de un ejercicio están completadas,
 * abre el modal de RPE / nivel de cansancio.
 */
async function verificarEjercicioCompletado(sesionId, ejIdx) {
  const sesion = await db.sesiones.get(sesionId);
  const ejercicio = sesion.ejercicios[ejIdx];
  if (!ejercicio) return;

  const todasCompletas = ejercicio.series.every(s => s.hecho);
  if (todasCompletas && !ejercicio.rpe) {
    abrirModalRPE(sesionId, ejIdx, ejercicio.nombre);
  }
}

/**
 * Modal de RPE al terminar un ejercicio.
 */
export function abrirModalRPE(sesionId, ejIdx, nombreEjercicio) {
  const modal = document.getElementById('modal-rpe');
  modal.querySelector('[data-nombre-ej]').textContent = nombreEjercicio;
  modal.dataset.sesionId = sesionId;
  modal.dataset.ejIdx = ejIdx;

  // Renderizar escala 1-10
  const escala = modal.querySelector('.rpe-escala');
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
      modal.querySelector('.rpe-descripcion').textContent = descripcionRPE(i);
    });
    escala.appendChild(btn);
  }

  abrirModal('modal-rpe');
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
 * Guarda el RPE elegido y cierra el modal.
 */
export async function guardarRPE() {
  const modal = document.getElementById('modal-rpe');
  const sesionId = modal.dataset.sesionId;
  const ejIdx = Number(modal.dataset.ejIdx);
  const activo = modal.querySelector('.rpe-btn.activo');
  if (!activo) { cerrarModal('modal-rpe'); return; }

  const rpe = Number(activo.dataset.valor);
  const sesion = await db.sesiones.get(sesionId);
  if (sesion?.ejercicios[ejIdx]) {
    sesion.ejercicios[ejIdx].rpe = rpe;
    await db.sesiones.put(sesion);
    toast(`Ejercicio guardado · RPE ${rpe}`, 'success');
  }
  cerrarModal('modal-rpe');
}
```

## HTML · Modal de RPE

```html
<div class="modal" id="modal-rpe" hidden role="dialog" aria-modal="true" aria-labelledby="modal-rpe-title">
  <div class="modal-backdrop" data-action="close"></div>
  <div class="modal-panel">
    <header class="modal-header">
      <h2 id="modal-rpe-title">¡Ejercicio completado!</h2>
      <button class="modal-close" data-action="close" aria-label="Cerrar">✕</button>
    </header>
    <div class="modal-body">
      <p class="modal-subtitle">
        <strong data-nombre-ej>Hip Thrust con Barra</strong>
      </p>
      <p class="text-muted">¿Cómo te sientes después de este ejercicio?</p>

      <div class="rpe-escala" role="radiogroup" aria-label="Nivel de esfuerzo 1 a 10"></div>

      <p class="rpe-descripcion text-muted">Selecciona un valor</p>
    </div>
    <footer class="modal-footer">
      <button class="btn btn-secondary" data-action="saltar-rpe">Saltar</button>
      <button class="btn btn-primary" data-action="guardar-rpe">Guardar</button>
    </footer>
  </div>
</div>
```

## CSS · Escala RPE

```css
.rpe-escala {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--sp-2);
  margin: var(--sp-4) 0;
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
  margin-top: var(--sp-2);
}
```

---

# 3. ESTRUCTURA DE DATOS ACTUALIZADA

## Sesión con series y tiempos

```js
{
  id: "ses_2026-09-20",
  fecha: "2026-09-20",
  diaId: "lunes",
  diaNombre: "Lunes",
  horaInicio: "20:04",
  horaFin: null,
  duracionMin: null,
  energia: 8,
  notas: "",
  cardio: "",
  ejercicios: [
    {
      ejercicioId: "uuid",
      nombre: "Hip Thrust con Barra",
      prescripcion: "4 series × 8-10 reps",
      nota: "Pausa de 1 s arriba",
      rpe: 7,                    // se llena al terminar todas las series
      series: [
        { peso: 80, reps: 10, tiempoSeg: 45, hecho: true },
        { peso: 85, reps: 9,  tiempoSeg: 52, hecho: true },
        { peso: 90, reps: 8,  tiempoSeg: 48, hecho: false },
        { peso: null, reps: null, tiempoSeg: null, hecho: false },
      ]
    }
  ],
  core: [
    { nombre: "Vacíos Abdominales", hecho: false }
  ]
}
```

**Nota sobre exportación:** incluir `tiempoSeg` en el CSV/XLSX exportado:

```
fecha,dia,ejercicio,serie,peso,reps,rpe,tiempo_seg,hora_inicio,hora_fin,duracion_min
2026-09-20,Lunes,Hip Thrust con Barra,1,80,10,,45,20:04,,
```

---

# 4. CAMBIOS EN EL FLUJO DEL MÓDULO HOY

## Al entrar a "Hoy"

```
Si NO existe sesión para hoy:
   → Mostrar estado vacío con botón grande "▶ Iniciar sesión"
   → Al pulsar → abre modal de selección de rutina
   → Al confirmar → carga todos los ejercicios + core
   → Muestra la vista de sesión con las cards de ejercicios

Si existe sesión abierta hoy (sin horaFin):
   → Mostrar la vista de sesión directamente
   → El botón dice "⏹ Terminar gym"

Si existe sesión cerrada hoy (con horaFin):
   → Mostrar la sesión ya registrada en modo lectura
   → Botón "Editar sesión" si quiere corregir algo
```

## Al pulsar "Agregar ejercicio extra"

**Ya NO debe ser el flujo principal.** Solo aparece como botón secundario
al final de la lista de ejercicios, dentro de la sesión activa.

Al pulsarlo:
1. Abre un mini-modal con `<select>` de ejercicios de la rutina activa
2. O permite "Crear nuevo ejercicio"
3. Al agregar → se añade al final de la sesión con series vacías

---

# 5. CHECKLIST DE VERIFICACIÓN

Después de aplicar el refactor, verifica:

## Módulo Rutina
- [ ] Los días se ven como lista de tarjetas colapsadas
- [ ] Solo se ve Nombre + Enfoque + nº ejercicios en la tarjeta
- [ ] Al pulsar una tarjeta → se expande y muestra el detalle
- [ ] Solo UN día expandido a la vez (acordeón exclusivo)
- [ ] Al expandir otro, el anterior se colapsa
- [ ] El chevron ▸ rota a 90° cuando está expandido
- [ ] Los ejercicios dentro del día se ven compactos (una línea)
- [ ] Cada ejercicio tiene acciones: ✎ 📋 🗑
- [ ] Al recargar la app, el día abierto se mantiene

## Módulo Hoy
- [ ] Al pulsar "Iniciar día" → abre modal de selección de rutina
- [ ] El modal muestra los días de la rutina activa
- [ ] Preselecciona el día sugerido por la fecha actual
- [ ] Al confirmar → TODOS los ejercicios se cargan automáticamente
- [ ] Cada ejercicio tiene sus series con inputs de peso y reps
- [ ] Cada serie tiene botón ▶ / ⏸
- [ ] Al pulsar ▶ → el cronómetro empieza a correr
- [ ] El botón cambia a ⏸ y se ve un pulso animado
- [ ] Al pulsar ⏸ → se detiene el cronómetro y guarda el tiempo
- [ ] La fila se marca con color verde (completada)
- [ ] Al completar TODAS las series → aparece modal de RPE
- [ ] El modal de RPE tiene escala 1-10 clicable
- [ ] Al elegir un valor → se ve la descripción ("Moderado", "Difícil")
- [ ] Al guardar → toast de confirmación
- [ ] El tiempo de cada serie se guarda en IndexedDB
- [ ] El tiempo se incluye al exportar CSV/XLSX

## Responsive
- [ ] En móvil (360-430px) las series se apilan en 2 filas
- [ ] En tablet/desktop las series se ven en una sola fila
- [ ] El modal de RPE se ve bien en ambos

## Persistencia
- [ ] Si cierro la app a mitad de sesión y la vuelvo a abrir,
      los tiempos y pesos se mantienen
- [ ] Si estoy en medio de un cronómetro y cierro la app,
      al reabrir se puede continuar (opcional: pausar el timer al cerrar)

---

# 6. ORDEN DE APLICACIÓN

Ejecuta EXACTAMENTE en este orden:

1. **Módulo Rutina · HTML** → reemplazar la estructura por la lista colapsable
2. **Módulo Rutina · CSS** → agregar los estilos del acordeón y cards
3. **Módulo Rutina · JS** → implementar `inicializarAcordeon()` con exclusividad
4. **Módulo Hoy · Modal selección** → reusar el `PROMPT_FLUJO_RUTINA.md`
5. **Módulo Hoy · Card de ejercicio** → reemplazar la tabla por cards
6. **Módulo Hoy · Serie row** → agregar inputs + botón timer + contador
7. **Módulo Hoy · CSS** → aplicar los estilos de la sección 2
8. **Módulo Hoy · JS Timer** → `toggleSerieTimer()` y `formatearMMSS()`
9. **Modal RPE · HTML + CSS** → agregar al final del `<body>`
10. **Modal RPE · JS** → `abrirModalRPE()` y `guardarRPE()`
11. **Exportación** → incluir `tiempoSeg` en CSV/XLSX
12. **Probar** con el checklist de la sección 5

---

# 7. NO ROMPER LO QUE FUNCIONA

- No toques los módulos Historial, Medidas, Progreso ni Ajustes.
- No cambies el sistema de temas (Monocromo, Rosa, Morado, Azul, Verde).
- No cambies el sistema de toasts (ya corregido para aparecer arriba).
- No cambies el sistema de capitalización.
- Si Copilot sugiere refactorizar todo, **rechaza** y aplica solo lo pedido.

# BUG CRÍTICO · Scroll infinito en el módulo Progreso

## Síntoma

Al entrar a la sección **Progreso**, la página crece indefinidamente o el
scroll no tiene fin. Los gráficos se redimensionan en bucle, la memoria sube
y el rendimiento cae.

## Causas más probables (verificar en este orden)

### Causa 1 · Chart.js en bucle de resize (la más común)

Chart.js dispara su propio evento `resize` al redimensionarse. Si tienes un
`ResizeObserver` o un listener de `resize` que llama `chart.resize()` o
`chart.update()` → **bucle infinito**.

**Busca en `js/progreso.js`:**

```js
// ❌ ESTO CAUSA SCROLL INFINITO
window.addEventListener('resize', () => {
  grafica.resize();  // ← dispara resize otra vez
});
```

**Fix:**
```js
// ✅ Solo actualizar datos, no la geometría
let resizeRAF = null;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    graficas.forEach(g => g.update('none'));  // 'none' evita animación y resize
  });
});
```

### Causa 2 · `maintainAspectRatio: false` + contenedor sin altura fija

Chart.js con `maintainAspectRatio: false` **requiere** que el contenedor padre
tenga altura definida. Si no, crece indefinidamente.

**Fix CSS:**
```css
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 280px;          /* altura EXPLÍCITA en px, no % */
  min-height: 280px;
  max-height: 280px;
}
.chart-wrapper canvas {
  position: absolute !important;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  display: block;
}

/* NO usar aspect-ratio con maintainAspectRatio:false */
/* NO usar height: 100% si el padre no tiene altura fija */
```

**Fix JS en la creación de cada Chart:**
```js
new Chart(ctx, {
  type: 'line',
  data: { ... },
  options: {
    responsive: true,
    maintainAspectRatio: false,   // OK si el wrapper tiene altura fija
    animation: { duration: 300 }, // nunca > 600ms
    // ...
  }
});
```

### Causa 3 · IntersectionObserver que re-renderiza

Si tienes un observer que renderiza gráficos al entrar en viewport y el
render **modifica el DOM** → el observer se vuelve a disparar.

**Busca y elimina:**
```js
// ❌ Esto puede generar bucles
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) renderizarGrafica(); });
});
```

**Fix:** renderiza **una sola vez** al abrir el módulo, sin observer:
```js
export function renderizarProgreso() {
  if (progresoYaRenderizado) return;
  progresoYaRenderizado = true;
  // ... crear gráficos
}
```

### Causa 4 · MutationObserver sobre todo el `<body>`

Si tienes algo como:
```js
// ❌ MUY PELIGROSO
new MutationObserver(() => actualizarProgreso())
  .observe(document.body, { childList: true, subtree: true });
```

Elimínalo. Si necesitas reactividad, hazlo por eventos explícitos
(`hashchange`, `click`, `db.on('change')`), no por observación del DOM.

### Causa 5 · CSS con `min-height: 100vh` en el contenedor scrolleable

```css
/* ❌ Provoca crecimiento vertical no controlado */
.module { min-height: 100vh; }
```

**Fix:**
```css
.module {
  min-height: auto;
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
}
```

### Causa 6 · Router SPA que re-monta el módulo en cada scroll

Si el `hashchange` o algún listener de scroll vuelve a llamar `render()`
del módulo Progreso sin limpiar los gráficos previos → se acumulan.

**Fix en `app.js`:**
```js
function navegarA(hash) {
  // Destruir gráficos anteriores ANTES de cambiar de módulo
  if (typeof destruirGraficos === 'function') destruirGraficos();
  // ... resto de la navegación
}

// En progreso.js
let chartsInstancia = [];
export function destruirGraficos() {
  chartsInstancia.forEach(c => c.destroy());
  chartsInstancia = [];
}
```

## Instrucciones exactas para Copilot

1. **Abre `js/progreso.js`** y localiza todos los usos de:
   - `new Chart(...)`
   - `addEventListener('resize', ...)`
   - `new ResizeObserver(...)`
   - `new MutationObserver(...)`
   - `new IntersectionObserver(...)`

2. **Aplica los fixes en este orden:**
   - **a)** Envuelve cada `<canvas>` en un `<div class="chart-wrapper">` con
     `height` fija en px y `position: relative`.
   - **b)** Al crear cada Chart, usa `maintainAspectRatio: false` y
     `animation: { duration: 300 }`.
   - **c)** Reemplaza cualquier `addEventListener('resize')` que llame a
     `.resize()` por el patrón con `requestAnimationFrame` + `.update('none')`.
   - **d)** Elimina cualquier `MutationObserver` sobre `document.body`.
   - **e)** Si hay `IntersectionObserver` renderizando gráficos, reemplázalo
     por renderizado único al entrar al módulo (flag `progresoYaRenderizado`).
   - **f)** Implementa `destruirGraficos()` y llámalo en `app.js` antes de
     cambiar de módulo.

3. **Guarda las instancias de Chart** en un array `chartsInstancia` para
   poder destruirlas limpiamente.

4. **Verifica el CSS** de `.module` y `.chart-wrapper` según lo indicado arriba.

## Estructura correcta de un gráfico

```html
<div class="card">
  <h3 class="card-title">Peso corporal</h3>
  <div class="chart-wrapper">
    <canvas id="chart-peso"></canvas>
  </div>
</div>
```

```css
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 260px;
  min-height: 260px;
  max-height: 260px;
  overflow: hidden;
}
.chart-wrapper canvas {
  position: absolute !important;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  display: block;
}
```

```js
import { Chart } from 'chart.js/auto'; // o como lo tengas cargado por CDN

let chartsInstancia = [];

export function renderizarProgreso() {
  if (progresoYaRenderizado) return;
  progresoYaRenderizado = true;

  const ctx = document.getElementById('chart-peso');
  const chart = new Chart(ctx, {
    type: 'line',
    data: { /* ... */ },
    options: {
      responsive: true,
      maintainAspectRatio: false,     // ✔ wrapper tiene altura fija
      animation: { duration: 300 },   // ✔ corta
      resizeDelay: 200,               // ✔ evita re-render en cada pixel
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false },
        x: { grid: { display: false } }
      }
    }
  });
  chartsInstancia.push(chart);
}

export function destruirGraficos() {
  chartsInstancia.forEach(c => { try { c.destroy(); } catch(e){} });
  chartsInstancia = [];
  progresoYaRenderizado = false;
}
```

## Reglas de prevención (agregar al prompt maestro)

- **Nunca** anidar `ResizeObserver` con `chart.resize()`.
- **Nunca** observar `document.body` con `MutationObserver`.
- **Nunca** usar `height: 100%` en un contenedor de Chart.js sin altura fija
  en el padre.
- **Nunca** dejar que múltiples instancias de Chart se acumulen sin destruirlas.
- **Siempre** destruir gráficos al cambiar de módulo (`destruirGraficos()`).
- **Siempre** usar `resizeDelay: 200` en las opciones de Chart.js.
- **Siempre** limitar `animation.duration` a ≤ 300ms en gráficos.

## Checklist de verificación

- [ ] Entrar a Progreso → la página NO crece sola
- [ ] El scroll tiene fin claro
- [ ] Los gráficos se ven con altura fija (no gigantes ni diminutos)
- [ ] Al cambiar el tamaño de la ventana, los gráficos se ajustan una sola vez
- [ ] Al salir y volver a Progreso, no se duplican gráficos
- [ ] DevTools → Performance → no hay llamadas en bucle a `resize()`
- [ ] DevTools → Memory → el uso de memoria se mantiene estable
- [ ] En móvil rotando la pantalla no se rompe ni crece infinitamente

## Búsqueda rápida en el código (comandos)

```bash
# Buscar posibles causas del bug
grep -rn "new Chart" js/
grep -rn "addEventListener('resize'" js/
grep -rn "new ResizeObserver" js/
grep -rn "new MutationObserver" js/
grep -rn "new IntersectionObserver" js/
grep -rn "\.resize()" js/
grep -rn "min-height: 100vh" css/
```

Cualquier coincidencia en los 4 primeros comandos es candidata a fix.

# FIN DEL FIX

## REGLAS DE GRÁFICAS (Chart.js) · PREVENCIÓN DE BUCLES

Toda gráfica debe cumplir OBLIGATORIAMENTE:

1. Estar envuelta en un `.chart-wrapper` con altura fija en px.
2. Usar `maintainAspectRatio: false`.
3. Usar `resizeDelay: 200` y `animation.duration ≤ 300`.
4. Nunca escuchar `resize` para llamar `.resize()` — solo `.update('none')` con RAF.
5. Nunca usar `MutationObserver` sobre `document.body`.
6. Guardar las instancias en un array y destruirlas al salir del módulo.
7. Implementar `destruirGraficos()` y llamarla en el router antes de cambiar de módulo.
8. No usar `min-height: 100vh` en contenedores scrolleables.

# FIN DEL PROMPT
# FIX · Modales inconsistentes + Lógica del Core incorrecta

## Diagnóstico visual de las 3 capturas

### Captura 1 · Modal "Eliminar sesión" ❌ ROTO
- El texto "Esta sesión se quitará del historia" aparece **fragmentado** en
  varias líneas (una palabra por línea)
- Los botones "Cancelar" y "Eliminar" aparecen **encima/lado** del texto
- El panel no tiene ancho definido, todo se colapsa
- Falta el contenedor `.modal-panel` estructurado

### Captura 2 · Modal "Elegir rutina de hoy" ❌ ROTO
- La lista de rutinas (Lunes, Martes, Miércoles...) se ve **detrás** del
  contenido, sin fondo propio
- El texto "Selecciona la rutina que quieres realizar" queda oculto
- Los botones "Cancelar" e "Iniciar" aparecen encima de las tarjetas
- Mismo problema: falta estructura `.modal-panel`

### Captura 3 · Modal "Vacíos Abdominales" ✅ BIEN PERO con bug de lógica
- El diseño se ve correcto (header, título, serie, campo, botones)
- **PERO pide peso cuando NO debería**
- Vacíos Abdominales es tipo `tiempo` (4 series × 15-20 s)
- No debería pedir peso ni reps, solo tiempo + RPE

**Conclusión:** El modal de serie ya está bien maquetado. Los otros modales
(Eliminar sesión, Elegir rutina) no fueron migrados a la nueva estructura.

---

# 1. CAUSA RAÍZ

## Para los modales rotos

Los modales `#modal-eliminar-sesion` y `#modal-seleccion-rutina` fueron
creados con una estructura **vieja** que no usa `.modal-panel` o usa uno
incompleto. Probablemente se ven así:

```html
<!-- ❌ ESTRUCTURA VIEJA (rota) -->
<div class="modal" id="modal-eliminar-sesion">
  <div class="modal-header">
    <h2>Eliminar sesión</h2>
    <button>✕</button>
  </div>
  <p>Esta sesión se quitará del historial</p>
  <button>Cancelar</button>
  <button>Eliminar</button>
</div>
```

Sin `.modal-backdrop` ni `.modal-panel`, el CSS no aplica correctamente.

## Para el Core pidiendo peso

El modal de serie consulta el `tipo` del ejercicio para decidir si pide peso.
Pero los items del core **no tienen el campo `tipo` seteado** o el default
está mal. La lógica actual probablemente es:

```js
// ❌ LÓGICA ACTUAL
modal.querySelector('[data-campo="peso"]').hidden =
  !tipo.includes('reps') && tipo === 'tiempo';
```

Si el tipo no está seteado (`undefined`), `tipo.includes` falla o la condición
da `false` → el campo de peso se muestra.

---

# 2. FIX · Unificar TODOS los modales con la misma estructura

## Regla de oro

**Todos los modales del proyecto deben usar EXACTAMENTE la misma estructura:**

```html
<div class="modal" id="MODAL_ID" hidden role="dialog" aria-modal="true" aria-labelledby="MODAL_ID_TITULO">
  <div class="modal-backdrop" data-action="cerrar-MODAL_ID"></div>
  <div class="modal-panel">
    <header class="modal-header">
      <div class="modal-title-group">
        <h2 id="MODAL_ID_TITULO">Título del modal</h2>
        <p class="modal-subtitle">Subtítulo opcional</p>
      </div>
      <button class="modal-close" data-action="cerrar-MODAL_ID" aria-label="Cerrar">✕</button>
    </header>
    <div class="modal-body">
      <!-- contenido -->
    </div>
    <footer class="modal-footer">
      <!-- botones de acción -->
    </footer>
  </div>
</div>
```

## Estructura exacta de cada modal

### Modal "Eliminar sesión"

```html
<div class="modal" id="modal-eliminar-sesion" hidden role="dialog" aria-modal="true" aria-labelledby="modal-eliminar-titulo">
  <div class="modal-backdrop" data-action="cerrar-eliminar"></div>
  <div class="modal-panel modal-panel-sm">
    <header class="modal-header">
      <div class="modal-title-group">
        <h2 id="modal-eliminar-titulo">Eliminar sesión</h2>
      </div>
      <button class="modal-close" data-action="cerrar-eliminar" aria-label="Cerrar">✕</button>
    </header>

    <div class="modal-body">
      <p class="modal-text">
        Esta sesión se quitará del historial. Esta acción no se puede deshacer.
      </p>
    </div>

    <footer class="modal-footer">
      <button class="btn btn-secondary" data-action="cerrar-eliminar">Cancelar</button>
      <button class="btn btn-danger" data-action="confirmar-eliminar">Eliminar</button>
    </footer>
  </div>
</div>
```

### Modal "Elegir rutina de hoy"

```html
<div class="modal" id="modal-seleccion-rutina" hidden role="dialog" aria-modal="true" aria-labelledby="modal-rutina-titulo">
  <div class="modal-backdrop" data-action="cerrar-rutina"></div>
  <div class="modal-panel">
    <header class="modal-header">
      <div class="modal-title-group">
        <h2 id="modal-rutina-titulo">Elegir rutina de hoy</h2>
        <p class="modal-subtitle">Selecciona la rutina que quieres realizar</p>
      </div>
      <button class="modal-close" data-action="cerrar-rutina" aria-label="Cerrar">✕</button>
    </header>

    <div class="modal-body">
      <div class="rutina-list" role="radiogroup" aria-label="Rutinas disponibles">
        <!-- Tarjetas generadas dinámicamente con JS -->
      </div>
    </div>

    <footer class="modal-footer">
      <button class="btn btn-secondary" data-action="cerrar-rutina">Cancelar</button>
      <button class="btn btn-primary" data-action="confirmar-rutina">Iniciar</button>
    </footer>
  </div>
</div>
```

**Importante:** Todos los modales deben estar **justo antes de `</body>`**, uno
después de otro, como hijos directos de `<body>`.

---

# 3. FIX · CSS unificado para los modales

Reemplaza TODO el CSS relacionado a modales con este bloque único.
**Elimina cualquier regla previa de `.modal`, `.modal-panel`, `.modal-header`,
`.modal-body`, `.modal-footer`** para evitar conflictos.

```css
/* ============================================
   SISTEMA DE MODALES · Unificado
   ============================================ */

/* --- Contenedor raíz --- */
.modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
  pointer-events: auto;
}
.modal[hidden] { display: none !important; }

/* --- Backdrop --- */
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 1;
  cursor: pointer;
}

/* --- Panel --- */
.modal-panel {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background: var(--bg-elev);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  animation: modal-in 200ms cubic-bezier(0.2, 0.9, 0.3, 1);
}

/* Panel más angosto para confirmaciones */
.modal-panel-sm {
  max-width: 400px;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Móvil: bottom-sheet */
@media (max-width: 480px) {
  .modal {
    padding: 0;
    align-items: flex-end;
  }
  .modal-panel,
  .modal-panel-sm {
    max-width: 100%;
    max-height: 88vh;
    border-radius: var(--r-xl) var(--r-xl) 0 0;
    border-bottom: none;
  }
}

/* --- Header --- */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.modal-title-group {
  flex: 1;
  min-width: 0;
}
.modal-header h2 {
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.25;
}
.modal-subtitle {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
  line-height: 1.35;
}
.modal-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  font-family: inherit;
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}
.modal-close:hover {
  background: var(--surface-hover);
  color: var(--text);
  border-color: var(--border-strong);
}

/* --- Body --- */
.modal-body {
  padding: var(--sp-5);
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.modal-text {
  font-size: var(--fs-base);
  color: var(--text);
  line-height: 1.5;
  margin: 0;
}

/* --- Footer --- */
.modal-footer {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-5);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg-elev);
}
.modal-footer .btn {
  flex: 1;
  padding: var(--sp-3) var(--sp-4);
  min-height: 44px;
  font-size: var(--fs-base);
  justify-content: center;
}

/* --- Bloqueo de scroll del body --- */
body.modal-abierto { overflow: hidden; }

/* --- Preferencia de movimiento reducido --- */
@media (prefers-reduced-motion: reduce) {
  .modal-panel { animation: none; }
}
```

**Con este CSS:**
- Todos los modales quedan centrados, con backdrop, y estructura consistente
- En móvil se comportan como bottom-sheet
- Los botones respetan el tamaño correcto (44px min-height)
- El scroll del body se bloquea mientras hay modal abierto

---

# 4. FIX · Lógica del Core · NO pedir peso en ejercicios de tiempo

## El problema

Cuando abres el modal de una serie del core (Vacíos Abdominales, Plancha),
el campo de peso se muestra aunque no debería, porque el `tipo` del item no
está definido o el check está mal.

## Fix 1 · Asegurar que el core tenga `tipo: "tiempo"` en el seed

En `js/db.js`, la constante `RUTINA_DEFAULT` debe declarar los items de core
con su tipo:

```js
const CORE_DEFAULT = [
  { nombre: 'Vacíos Abdominales', tipo: 'tiempo', series: 4, reps: '15-20 s' },
  { nombre: 'Plancha Prona sobre Codos', tipo: 'tiempo', series: 3, reps: '30-45 s' },
  { nombre: 'Pallof Press en Polea', tipo: 'tiempo_reps', series: 3, reps: '10-12 / lado' },
];
```

**Nota:** Pallof Press tiene `tiempo_reps` porque aunque sea core, el ejercicio
tiene reps (10-12 por lado) y opcionalmente peso. Si prefieres que tampoco
pida peso, cámbialo a `reps`.

## Fix 2 · Reforzar el core con `tipo` al crear la sesión

En `js/sesion.js`, al construir la sesión desde el modal de rutina:

```js
const coreSesion = (dia.core || []).map((c, idx) => {
  const seriesConfiguradas = Number(c.series) || 3;
  // Determinar tipo: si no está definido, inferir del nombre o reps
  let tipo = c.tipo;
  if (!tipo) {
    // Si las reps contienen "s" (segundos), es de tiempo
    tipo = /seg|s\b/i.test(c.reps || '') ? 'tiempo' : 'reps';
  }
  return {
    nombre: c.nombre,
    tipo,                          // ← garantizado
    prescripcion: `${seriesConfiguradas} series × ${c.reps}`,
    seriesConfiguradas,
    estado: 'pendiente',
    razonSalto: null,
    rpePromedio: null,
    series: [],
  };
});
```

## Fix 3 · Reescribir la lógica del modal de serie

En `js/serie-modal.js`, en `abrirModalSerie()`, reemplazar el bloque que
decide qué campos mostrar:

```js
// ❌ Lógica anterior (confusa)
// modal.querySelector('[data-campo="peso"]').hidden = !tipo.includes('reps') && tipo === 'tiempo';

// ✅ Lógica correcta y explícita
function configurarCamposPorTipo(modal, tipo) {
  // Normalizar el tipo
  const t = (tipo || 'reps').toLowerCase();

  const config = {
    'reps':        { peso: true,  reps: true,  tiempo: true  },
    'tiempo':      { peso: false, reps: false, tiempo: true  },
    'tiempo_reps': { peso: true,  reps: true,  tiempo: true  },
  };

  const campos = config[t] || config['reps'];

  // Peso
  const campoPeso = modal.querySelector('[data-campo="peso"]');
  if (campoPeso) {
    campoPeso.hidden = !campos.peso;
  }

  // Reps
  const campoReps = modal.querySelector('[data-campo="reps"]');
  if (campoReps) {
    campoReps.hidden = !campos.reps;
  }

  // Guardar config en el estado del modal para usarla al guardar
  modal.dataset.tipo = t;
}

// Usar dentro de abrirModalSerie():
const tipo = ejercicio.tipo || 'reps';
configurarCamposPorTipo(modal, tipo);
```

## Fix 4 · Reforzar la lógica en `empezarSerie()` y `guardarSerie()`

Para evitar que se guarden campos vacíos en el Core:

```js
export async function empezarSerie() {
  const modal = document.getElementById('modal-serie');
  const tipo = modal.dataset.tipo || 'reps';

  // Solo leer peso si el tipo lo permite
  let peso = null;
  if (tipo !== 'tiempo') {
    const pesoInput = document.querySelector('#input-peso');
    peso = pesoInput?.value ? Number(pesoInput.value) : null;
  }

  estadoModal.peso = peso;
  // ...
}

export async function guardarSerie() {
  const modal = document.getElementById('modal-serie');
  const tipo = modal.dataset.tipo || 'reps';

  // Solo leer reps si el tipo lo permite
  let reps = null;
  if (tipo === 'reps' || tipo === 'tiempo_reps') {
    const repsInput = document.querySelector('#input-reps');
    reps = repsInput?.value ? Number(repsInput.value) : null;
  }

  const rpeBtn = document.querySelector('.rpe-btn.activo');
  const rpe = rpeBtn ? Number(rpeBtn.dataset.valor) : null;

  if (!rpe) {
    toast('Selecciona tu nivel de esfuerzo', 'warning');
    return;
  }

  // ...
}
```

---

# 5. FIX · Bloquear scroll del body correctamente

Verificar que `abrirModal()` y `cerrarModal()` en `js/ui.js` manejen bien la
clase `modal-abierto`:

```js
// js/ui.js

export function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-abierto');
}

export function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');

  // Solo quitar el bloqueo si no hay otro modal abierto
  const otrosAbiertos = document.querySelectorAll('.modal:not([hidden])');
  if (otrosAbiertos.length === 0) {
    document.body.classList.remove('modal-abierto');
  }
}
```

---

# 6. FIX · Registro de estilo de las tarjetas de rutina

Para que las tarjetas del modal "Elegir rutina" se vean bien dentro del body:

```css
/* ============================================
   MODAL ELEGIR RUTINA · Lista
   ============================================ */
.rutina-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.rutina-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: var(--sp-4);
  background: var(--bg-sunken);
  border: 2px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  font-family: inherit;
  color: var(--text);
  transition: border-color var(--t-fast), background var(--t-fast);
  width: 100%;
}
.rutina-card:hover { background: var(--surface-hover); }
.rutina-card[aria-checked="true"] {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.rutina-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-2);
}
.rutina-card-dia {
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.rutina-card-nombre {
  font-size: var(--fs-base);
  font-weight: 700;
  color: var(--text);
  margin: 0 0 var(--sp-1);
}
.rutina-card-meta {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: 0;
}
```

---

# 7. CHECKLIST DE VERIFICACIÓN

## Modal "Eliminar sesión"
- [ ] Se ve centrado en pantalla
- [ ] Fondo oscurecido con blur
- [ ] Título "Eliminar sesión" arriba a la izquierda
- [ ] Botón ✕ arriba a la derecha
- [ ] Texto completo en una sola línea o párrafo continuo (no fragmentado)
- [ ] Botones "Cancelar" y "Eliminar" en fila, al fondo del modal
- [ ] No hay que hacer scroll para ver el modal

## Modal "Elegir rutina"
- [ ] Se ve centrado en pantalla
- [ ] Las 5 tarjetas de rutinas se ven limpias, con fondo y borde
- [ ] La rutina sugerida está preseleccionada (borde primario)
- [ ] Los botones "Cancelar" e "Iniciar" están al fondo, en fila
- [ ] No hay superposición de contenido

## Modal "Vacíos Abdominales" (Core)
- [ ] Ya NO pide peso (campo oculto)
- [ ] Ya NO pide reps (campo oculto)
- [ ] Solo pide tiempo (timer) y RPE
- [ ] El header dice "Vacíos Abdominales"
- [ ] El subtítulo dice "Serie 1 de 4"

## Modal "Plancha Prona sobre Codos"
- [ ] Tampoco pide peso ni reps
- [ ] Solo tiempo + RPE

## Modal "Pallof Press en Polea"
- [ ] Si tiene `tipo: "tiempo_reps"` → pide peso y reps (correcto)
- [ ] Si tiene `tipo: "reps"` → pide peso y reps (correcto)

## General
- [ ] Todos los modales se ven consistentes entre sí
- [ ] En móvil se comportan como bottom-sheet
- [ ] Al abrir un modal, el body no scrollea
- [ ] Escape cierra el modal activo
- [ ] Click en el backdrop cierra el modal

---

# 8. ORDEN DE APLICACIÓN

1. **Fix 2** → Reemplazar el HTML de los modales `#modal-eliminar-sesion` y `#modal-seleccion-rutina` con la estructura unificada
2. **Fix 3** → Reemplazar el CSS de modales con el bloque unificado
3. **Fix 6** → Agregar el CSS de `.rutina-list` y `.rutina-card`
4. **Fix 4.1** → Actualizar el seed en `db.js` para que el core tenga `tipo`
5. **Fix 4.2** → Actualizar `coreSesion` en `sesion.js` para garantizar `tipo`
6. **Fix 4.3** → Reescribir `configurarCamposPorTipo()` en `serie-modal.js`
7. **Fix 4.4** → Actualizar `empezarSerie()` y `guardarSerie()` para respetar tipo
8. **Reset** → Borrar IndexedDB para regenerar el seed con los tipos correctos
9. **Verificar** con el checklist

---

# 9. INSTRUCCIONES PARA COPILOT

```
Lee PROMPT_FIX_MODALES_Y_CORE.md y aplica los fixes en el orden de la sección 8.

Puntos críticos:
1. TODOS los modales deben usar la estructura `.modal > .modal-backdrop + .modal-panel`
2. El modal "Eliminar sesión" y "Elegir rutina" deben migrar a esa estructura
3. Eliminar reglas CSS conflictivas de modales, dejar SOLO el bloque unificado
4. El core debe tener `tipo` en el seed (`tiempo` o `tiempo_reps`)
5. La función `configurarCamposPorTipo()` debe decidir explícitamente qué campos mostrar según el tipo
6. Los items de core tipo "tiempo" NO deben pedir peso NI reps
7. Bloquear el scroll del body con `body.modal-abierto`

Verifica con DevTools Console:
- Todos los modales son hijos directos de BODY
- getComputedStyle(modal).position === 'fixed'
- El modal de Vacíos Abdominales tiene el campo peso oculto
```

# FIN DEL FIX
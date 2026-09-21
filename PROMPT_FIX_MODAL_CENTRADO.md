# FIX CRÍTICO · Modal de serie mal posicionado

## Diagnóstico visual de la captura

Analizando la imagen, hay **4 bugs** claros:

### Bug A · El modal NO está centrado — aparece al final del DOM

Se ve el modal "Hip Thrust con Barra" al final de la página, después del
contenido. Esto significa que el `<div class="modal">` **NO tiene
`position: fixed` aplicado** o el CSS no se está cargando.

### Bug B · El overlay tapa el modal (z-index invertido)

El usuario reporta que el modal está **por detrás** del overlay. El
`.modal-backdrop` tiene `z-index` mayor que el `.modal-panel` o el panel
no está dentro del stacking context correcto.

### Bug C · Los botones son enormes

"▶ Empezar serie" y "⊘ Saltar esta serie" ocupan casi el ancho completo y
son gigantes. La clase `.btn-grande` no está respetando las proporciones
del sistema de diseño.

### Bug D · El modal no se muestra como overlay flotante

Se ve el modal en el flujo normal del documento (scrolleable) en lugar de
aparecer centrado sobre toda la pantalla con el fondo oscurecido.

### Bug E · El modal aparece parcialmente sin backdrop oscurecido

El fondo sigue siendo visible, no se ve el `backdrop` cubriendo toda la
pantalla.

---

# 1. CAUSA RAÍZ

El problema principal es que el **CSS del modal NO se está aplicando** o está
incompleto. Específicamente:

1. Falta `position: fixed` + `inset: 0` en `.modal`
2. Falta `z-index` correcto en `.modal` y `.modal-backdrop`
3. Falta el cálculo de centrado (`display: flex; align-items: center; justify-content: center`)
4. Los `.btn-grande` tienen `padding` y `min-height` desproporcionados
5. El HTML del modal probablemente está mal estructurado

---

# 2. FIX · HTML del modal correcto

**El modal debe estar JUSTO antes del cierre de `</body>`, después de TODO el contenido:**

```html
<!-- index.html · al final del body, antes de </body> -->

<!-- Modal de serie -->
<div class="modal" id="modal-serie" hidden role="dialog" aria-modal="true"
     aria-labelledby="modal-serie-titulo">
  <div class="modal-backdrop" data-action="cerrar-serie"></div>
  <div class="modal-panel">
    <header class="modal-header">
      <div class="modal-title-group">
        <h2 id="modal-serie-titulo" data-nombre-ej>Ejercicio</h2>
        <p class="modal-subtitle">
          <span data-serie-actual>Serie 1</span> de <span data-serie-total>4</span>
        </p>
      </div>
      <button class="modal-close" data-action="cerrar-serie" aria-label="Cerrar">✕</button>
    </header>

    <!-- PASO 1 -->
    <div class="modal-body paso" data-paso="1">
      <div class="paso-titulo">Preparación</div>

      <div class="campo-grande" data-campo="peso">
        <label for="input-peso">¿Con cuánto peso vas a hacer esta serie?</label>
        <div class="input-grande-wrap">
          <input type="number" inputmode="decimal" id="input-peso"
                 class="input-grande" placeholder="0" step="0.5" min="0" />
          <span class="input-unidad">kg</span>
        </div>
        <p class="referencia-ultima-vez" data-ultima-vez hidden>
          Última vez: <strong data-ultimo-peso>—</strong> ×
          <strong data-ultimas-reps>—</strong>
        </p>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" data-action="empezar-serie">
          <span aria-hidden="true">▶</span> Empezar serie
        </button>
        <button class="btn btn-ghost" data-action="saltar-serie">
          <span aria-hidden="true">⊘</span> Saltar esta serie
        </button>
      </div>
    </div>

    <!-- PASO 2 -->
    <div class="modal-body paso" data-paso="2" hidden>
      <div class="paso-titulo">Serie en curso</div>
      <div class="timer-gigante">
        <span class="timer-display" aria-live="polite">00:00</span>
      </div>
      <p class="timer-contexto">
        <span data-nombre-ej>Ejercicio</span> ·
        <span data-serie-actual>Serie 1</span> ·
        <span data-peso-actual>—</span>
      </p>
      <div class="modal-actions">
        <button class="btn btn-danger" data-action="terminar-serie">
          <span aria-hidden="true">⏸</span> Terminar serie
        </button>
      </div>
    </div>

    <!-- PASO 3 -->
    <div class="modal-body paso" data-paso="3" hidden>
      <div class="paso-titulo">Registrar</div>

      <div class="campo-grande" data-campo="reps">
        <label for="input-reps">¿Cuántas reps hiciste?</label>
        <div class="input-grande-wrap">
          <input type="number" inputmode="numeric" id="input-reps"
                 class="input-grande" placeholder="0" min="0" />
        </div>
      </div>

      <div class="campo-grande">
        <label>¿Cómo te sentiste?</label>
        <div class="rpe-escala" role="radiogroup" aria-label="Esfuerzo percibido"></div>
        <p class="rpe-descripcion" data-rpe-desc>Selecciona un valor</p>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" data-action="guardar-serie">
          <span aria-hidden="true">💾</span> Guardar serie
        </button>
      </div>
    </div>
  </div>
</div>
```

**Puntos clave:**
- `.modal` **contiene** a `.modal-backdrop` y `.modal-panel`
- El `hidden` va en `.modal` (el contenedor), no en el panel
- Los botones están agrupados en `.modal-actions` para que se apilen limpios

---

# 3. FIX · CSS del modal COMPLETO

**Reemplaza TODO el CSS del modal con este bloque. Elimina cualquier regla
previa de `.modal` para evitar conflictos.**

```css
/* ============================================
   MODAL · Overlay centrado, flotante
   ============================================ */

/* Contenedor raíz: cubre toda la pantalla */
.modal {
  position: fixed;
  inset: 0;                        /* top:0 right:0 bottom:0 left:0 */
  z-index: 9999;                    /* por encima de TODO */
  display: flex;
  align-items: center;              /* centrado vertical */
  justify-content: center;          /* centrado horizontal */
  padding: var(--sp-4);
  pointer-events: auto;
}

/* Cuando está oculto, no bloquea clicks */
.modal[hidden] {
  display: none !important;
}

/* Backdrop oscurece el fondo */
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 1;                       /* debajo del panel */
  cursor: pointer;
}

/* Panel del modal: el contenido real */
.modal-panel {
  position: relative;
  z-index: 2;                       /* POR ENCIMA del backdrop */
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: var(--bg-elev);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  animation: modal-in 200ms cubic-bezier(0.2, 0.9, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .modal-panel { animation: none; }
}

/* Móvil: modal ocupa casi todo el ancho */
@media (max-width: 480px) {
  .modal {
    padding: var(--sp-3);
    align-items: flex-end;          /* se pega abajo tipo bottom-sheet */
  }
  .modal-panel {
    max-width: 100%;
    max-height: 85vh;
    border-radius: var(--r-xl) var(--r-xl) 0 0;
  }
}

/* ============================================
   HEADER DEL MODAL
   ============================================ */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg-elev);
  z-index: 1;
  border-radius: var(--r-lg) var(--r-lg) 0 0;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.modal-subtitle {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: 2px 0 0;
  font-weight: 600;
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
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}
.modal-close:hover {
  background: var(--surface-hover);
  color: var(--text);
  border-color: var(--border-strong);
}

/* ============================================
   BODY DEL MODAL
   ============================================ */
.modal-body {
  padding: var(--sp-5);
  flex: 1;
  overflow-y: auto;
}

.paso-titulo {
  font-size: var(--fs-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--primary);
  margin-bottom: var(--sp-4);
}

/* ============================================
   CAMPOS DE ENTRADA DEL MODAL
   ============================================ */
.campo-grande {
  margin-bottom: var(--sp-5);
}
.campo-grande label {
  display: block;
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--sp-3);
  line-height: 1.3;
}

.input-grande-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-grande {
  width: 100%;
  font-size: 28px;
  font-weight: 700;
  padding: var(--sp-3) var(--sp-4);
  padding-right: 56px;
  background: var(--bg-sunken);
  color: var(--text);
  border: 2px solid var(--border);
  border-radius: var(--r-md);
  text-align: center;
  font-variant-numeric: tabular-nums;
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
  font-family: inherit;
}
.input-grande:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.input-unidad {
  position: absolute;
  right: var(--sp-4);
  font-size: var(--fs-base);
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
.referencia-ultima-vez strong { color: var(--text); font-weight: 700; }

/* ============================================
   TIMER GIGANTE (paso 2)
   ============================================ */
.timer-gigante {
  text-align: center;
  padding: var(--sp-6) 0;
}
.timer-display {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 52px;
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  display: block;
}
@media (max-width: 480px) {
  .timer-display { font-size: 42px; }
}

.timer-contexto {
  text-align: center;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  margin-bottom: var(--sp-4);
}

/* ============================================
   ACCIONES DEL MODAL (botones)
   ============================================ */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

/* En el modal, los botones son de tamaño NORMAL, no "grande" */
.modal-actions .btn {
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--fs-base);
  font-weight: 600;
  min-height: 44px;                 /* accesible para tap, no gigante */
  border-radius: var(--r-md);
  width: 100%;
  justify-content: center;
}

/* ============================================
   ESCALA RPE
   ============================================ */
.rpe-escala {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.rpe-btn {
  aspect-ratio: 1;
  max-height: 52px;
  border-radius: var(--r-md);
  border: 2px solid var(--border);
  background: var(--bg-sunken);
  color: var(--text);
  font-size: var(--fs-base);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--t-fast);
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  margin: var(--sp-2) 0 0;
}

/* ============================================
   PASO OCULTO
   ============================================ */
.paso[hidden] { display: none !important; }

/* ============================================
   BLOQUEO DE SCROLL DEL BODY
   ============================================ */
body.modal-abierto {
  overflow: hidden;
}
```

---

# 4. FIX · Eliminar clases antiguas

Busca en `styles.css` y **ELIMINA** todas estas reglas (causan conflictos):

```css
/* ❌ ELIMINAR si existen */
.btn-grande { padding: 20px; font-size: 20px; min-height: 72px; }
.modal-serie .modal-header { ... }
.modal-panel-serie { max-width: 520px; }
.modal { padding-top: 20vh; }        /* ❌ este rompe el centrado */
.modal-body .btn { width: 100%; height: 80px; }  /* ❌ */
```

Comando para encontrar conflictos:

```bash
grep -n "btn-grande\|modal-panel-serie\|modal-serie" css/styles.css
```

---

# 5. FIX · JS de apertura/cierre del modal

Verificar que `abrirModal()` y `cerrarModal()` funcionen correctamente:

```js
// js/ui.js

export function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) {
    console.error(`No existe el modal con id: ${id}`);
    return;
  }
  modal.hidden = false;
  modal.removeAttribute('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-abierto');

  // Foco en el primer input si existe
  setTimeout(() => {
    const primerInput = modal.querySelector('input:not([type="hidden"]), button:not(.modal-close)');
    primerInput?.focus();
  }, 100);
}

export function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-abierto');
}

// Cerrar con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal:not([hidden])').forEach(m => {
      cerrarModal(m.id);
    });
  }
});
```

---

# 6. FIX · Revisar el HTML generado por JS

Si el modal se renderiza dinámicamente con `innerHTML`, hay que asegurar que
**NO se inserte dentro de otro contenedor con `position` o `transform`**.

**Regla:** el `<div class="modal">` debe estar como hijo directo de `<body>`.

Si en `js/serie-modal.js` hay algo como:

```js
// ❌ MAL — el modal queda anidado dentro del módulo Hoy
document.querySelector('#hoy').innerHTML += modalHtml;
```

**Cambiar a:**

```js
// ✅ BIEN — el modal va al body
let modalExistente = document.getElementById('modal-serie');
if (!modalExistente) {
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}
```

O mejor aún, tener el modal **estático en `index.html`** y solo mostrarlo/ocultarlo.

---

# 7. VERIFICACIÓN EN DEVTOOLS

Después de aplicar los fixes, abrir DevTools y verificar:

## Inspeccionar el modal

```js
// En la consola:
const modal = document.getElementById('modal-serie');

// 1. Verificar que existe
console.log('Modal existe:', !!modal);

// 2. Verificar que es hijo directo de body
console.log('Padre del modal:', modal.parentElement.tagName);  // debe ser "BODY"

// 3. Verificar estilos computados
const estilos = getComputedStyle(modal);
console.log('position:', estilos.position);       // debe ser "fixed"
console.log('z-index:', estilos.zIndex);          // debe ser "9999"
console.log('display:', estilos.display);         // debe ser "flex" cuando está abierto
console.log('align-items:', estilos.alignItems);  // debe ser "center"

// 4. Verificar el panel
const panel = modal.querySelector('.modal-panel');
const estilosPanel = getComputedStyle(panel);
console.log('Panel z-index:', estilosPanel.zIndex);  // debe ser "2"
console.log('Panel max-width:', estilosPanel.maxWidth); // "480px"
```

## Si algo falla

- Si `position` no es `fixed` → el CSS no se cargó o hay conflicto
- Si `parentElement` no es `BODY` → el modal está anidado mal, hay que moverlo
- Si `z-index` del panel es menor al backdrop → revisar stacking
- Si `display` es `block` cuando abierto → revisar que `.modal` use `flex`

---

# 8. CHECKLIST DE VERIFICACIÓN

## Posicionamiento
- [ ] Al pulsar "Iniciar serie", el modal aparece **centrado en la pantalla**
- [ ] El fondo (overlay) se ve oscurecido con blur
- [ ] El modal está **por encima** del overlay
- [ ] No hay que hacer scroll para ver el modal
- [ ] El modal se ve completo sin cortes
- [ ] Al redimensionar la ventana, el modal se mantiene centrado

## Contenido
- [ ] El header muestra el nombre del ejercicio y "Serie X de Y"
- [ ] El botón ✕ cierra el modal
- [ ] El botón "Empezar serie" tiene tamaño **normal** (44px de alto)
- [ ] El botón "Saltar esta serie" es más pequeño (ghost)
- [ ] El input de peso es grande pero **no desproporcionado**
- [ ] Los botones respetan el ancho del modal con padding

## Interacción
- [ ] El body no se puede scrollear detrás del modal
- [ ] Click en el backdrop cierra el modal
- [ ] Escape cierra el modal
- [ ] El foco del teclado entra al modal al abrirlo
- [ ] Al guardar la serie, el modal se cierra y aparece en la lista

## Móvil
- [ ] En móvil, el modal aparece tipo bottom-sheet (pegado abajo)
- [ ] En móvil, el contenido se ve completo sin scroll
- [ ] El botón ✕ es fácil de pulsar (mínimo 32x32px)
- [ ] Los inputs abren el teclado numérico correcto

---

# 9. ORDEN DE APLICACIÓN

1. **Fix 1** → Reemplazar el HTML del modal en `index.html` (al final del body)
2. **Fix 3** → Reemplazar el CSS del modal COMPLETO en `styles.css`
3. **Fix 4** → Eliminar reglas antiguas conflictivas (`.btn-grande` fuera del modal, `.modal-panel-serie`, etc.)
4. **Fix 5** → Verificar `abrirModal()` y `cerrarModal()` en `js/ui.js`
5. **Fix 6** → Verificar que el modal sea hijo directo de `<body>`
6. **Verificar** con los comandos de DevTools de la sección 7

---

# 10. INSTRUCCIONES PARA COPILOT

```
Lee PROMPT_FIX_MODAL_CENTRADO.md y aplica los fixes en el orden de la sección 9.

Reglas estrictas:
- El modal DEBE ser hijo directo de <body>, no de un módulo
- .modal DEBE tener position:fixed; inset:0; z-index:9999
- .modal-backdrop debe tener z-index:1, el panel z-index:2
- Los botones del modal usan tamaño NORMAL (44px min-height), NO btn-grande
- En móvil el modal es bottom-sheet (align-items: flex-end)
- Eliminar cualquier .btn-grande aplicado a botones del modal
- El body debe bloquearse con overflow:hidden al abrir el modal

Verifica en DevTools Console:
- getComputedStyle(modal).position === 'fixed'
- getComputedStyle(modal).zIndex === '9999'
- modal.parentElement.tagName === 'BODY'
- getComputedStyle(panel).zIndex === '2'
```

# FIN DEL FIX
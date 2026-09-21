# FIX · Bug de renderizado en el módulo Rutina

## Síntomas visuales observados

Analizando la captura, se ven los siguientes bugs concretos:

1. **Tarjetas de ejercicio rotas:** Aparecen óvalos grises gigantes flotando
   dentro de un card enorme con mucho espacio en blanco. No se ven ni el nombre
   del ejercicio, ni los inputs de series/reps, ni los botones de acción.

2. **Layout colapsado mal implementado:** Se ve un solo día ("Lunes") expandido,
   pero los ejercicios no se renderizan como filas compactas, sino como bloques
   sueltos.

3. **Sidebar footer con texto mal ajustado:** "Gym Wolf 5 Días" se rompe en dos
   líneas, con espaciado inconsistente y jerarquía visual confusa.

4. **Header duplicado:** Aparece "Rutina activa: Gym Wolf 5 Días" en el header
   superior Y en el footer del sidebar. Redundante.

5. **Contenido recortado:** "Hip Thrust con Barra" aparece cortado al final de
   la vista sin estructura de card.

6. **Colores inconsistentes en dark mode:** El fondo es negro puro en algunas
   zonas y gris en otras; los elementos grises claros (óvalos) no pertenecen a
   ninguna paleta definida.

7. **Falta de estructura visual:** No hay separación clara entre "Día",
   "Ejercicios", y las acciones por ejercicio.

---

# 1. DIAGNÓSTICO TÉCNICO PROBABLE

## Bug A · Los "óvalos grises" son drag handles rotos

Los `.drag-handle` (los 6 puntitos `⠿`) probablemente se renderizan sin el
carácter correcto o con un `<span>` vacío que toma dimensiones enormes por
falta de estilos base.

**Causa probable:**
```html
<span class="drag-handle">⠿</span> <!-- sin estilos → 0 contenido → colapsa mal -->
```
o el glifo no existe en la fuente y se renderiza un placeholder.

**Fix:** Reemplazar por SVG inline con dimensiones fijas.

## Bug B · Ejercicio renderizado como tarjeta gigante sin contenido

El layout de `.ejercicio-row` está tomando `width: 100%` + `height: 100%`
del padre sin definir `display: flex` correctamente. El resultado: inputs
y textos quedan colapsados a 0 y solo se ven los placeholders del
drag handle.

**Causa probable:** el `<ul class="ejercicios-list">` no tiene `list-style: none`
o el `<li>` no tiene `display: flex` y los hijos se apilan mal.

## Bug C · Padding / altura excesiva

Los cards tienen `min-height` heredada o `padding` desproporcionado por
algún `aspect-ratio` mal aplicado. Esto genera el espacio vacío gigante.

## Bug D · Sidebar footer

`.brand-name` con `white-space: normal` en un contenedor angosto → wrap feo.

## Bug E · Colores fuera de paleta

Los grises de los óvalos (`#B8B8B8` aprox) no coinciden con ningún token
de la paleta activa. Están hardcodeados en algún CSS viejo.

---

# 2. FIX PASO A PASO

## Fix 1 · Drag handle como SVG con tamaño fijo

**Reemplazar en `js/rutinas.js` donde se genera cada ejercicio:**

```js
// ❌ Antes (probablemente)
// `<span class="drag-handle">⠿</span>`

// ✅ Ahora — SVG inline con dimensiones controladas
const dragHandle = `
  <button class="drag-handle" type="button" aria-label="Reordenar ejercicio">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="4" cy="3"  r="1.4"/>
      <circle cx="10" cy="3" r="1.4"/>
      <circle cx="4" cy="7"  r="1.4"/>
      <circle cx="10" cy="7" r="1.4"/>
      <circle cx="4" cy="11" r="1.4"/>
      <circle cx="10" cy="11" r="1.4"/>
    </svg>
  </button>
`;
```

**CSS:**
```css
.drag-handle {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-disabled);
  cursor: grab;
  padding: 0;
  border-radius: var(--r-sm);
  transition: background var(--t-fast), color var(--t-fast);
}
.drag-handle:hover {
  background: var(--surface-hover);
  color: var(--text-muted);
}
.drag-handle:active { cursor: grabbing; }
.drag-handle svg { display: block; }
```

## Fix 2 · Estructura correcta de `.ejercicio-row`

**HTML esperado para cada ejercicio (dentro del `<li>`):**

```html
<li class="ejercicio-row" data-ejercicio-id="uuid">
  <button class="drag-handle" type="button" aria-label="Reordenar">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="4" cy="3" r="1.4"/>
      <circle cx="10" cy="3" r="1.4"/>
      <circle cx="4" cy="7" r="1.4"/>
      <circle cx="10" cy="7" r="1.4"/>
      <circle cx="4" cy="11" r="1.4"/>
      <circle cx="10" cy="11" r="1.4"/>
    </svg>
  </button>

  <div class="ejercicio-info">
    <span class="ejercicio-nombre">Hip Thrust con Barra</span>
    <span class="ejercicio-detalle">4 series × 8-10 reps · Pausa de 1 s arriba</span>
  </div>

  <div class="ejercicio-actions">
    <button type="button" data-action="editar" aria-label="Editar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    </button>
    <button type="button" data-action="duplicar" aria-label="Duplicar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </button>
    <button type="button" data-action="eliminar" aria-label="Eliminar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      </svg>
    </button>
  </div>
</li>
```

**CSS corregido (reemplaza cualquier estilo previo):**
```css
.ejercicios-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ejercicio-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: var(--sp-3);
  align-items: center;
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  min-height: 56px;
  transition: border-color var(--t-fast), background var(--t-fast);
}
.ejercicio-row:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}

.ejercicio-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ejercicio-nombre {
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ejercicio-detalle {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ejercicio-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.ejercicio-actions button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}
.ejercicio-actions button:hover {
  background: var(--surface-hover);
  border-color: var(--border);
  color: var(--text);
}
.ejercicio-actions button[data-action="eliminar"]:hover {
  background: rgba(198, 40, 40, 0.12);
  border-color: var(--danger);
  color: var(--danger);
}
.ejercicio-actions svg { display: block; }

/* Móvil: reducir padding */
@media (max-width: 480px) {
  .ejercicio-row {
    grid-template-columns: 24px 1fr auto;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3);
  }
  .ejercicio-actions button {
    width: 28px;
    height: 28px;
  }
}
```

## Fix 3 · Eliminar el espacio vertical gigante del card

**Busca en `styles.css` cualquier regla que cause el problema:**

```css
/* ❌ Eliminar TODAS estas si existen */
.card { min-height: 400px; }        /* ❌ */
.card { aspect-ratio: 1; }           /* ❌ */
.ejercicios-list { min-height: 300px; }  /* ❌ */
.ejercicio-row { height: 100%; }     /* ❌ */
.dia-body { min-height: 500px; }     /* ❌ */
```

**Regla correcta:**
```css
.card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  box-shadow: var(--shadow-sm);
  /* NO min-height, NO aspect-ratio */
}

.dia-body {
  padding: var(--sp-4) var(--sp-5) var(--sp-5);
  border-top: 1px solid var(--border);
  background: var(--bg-sunken);
  /* NO min-height */
}
```

## Fix 4 · Sidebar footer limpio

**Estructura del sidebar footer:**
```html
<div class="sidebar-footer">
  <div class="rutina-activa-info">
    <span class="rutina-activa-label">Rutina activa</span>
    <span class="rutina-activa-nombre">Gym Wolf 5 Días</span>
  </div>
</div>
```

**CSS:**
```css
.sidebar-footer {
  padding: var(--sp-4);
  border-top: 1px solid var(--border);
  background: var(--bg-elev);
}

.rutina-activa-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--sp-3);
  background: var(--bg-sunken);
  border-radius: var(--r-md);
  border: 1px solid var(--border);
}

.rutina-activa-label {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.rutina-activa-nombre {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  /* NO forzar wrap feo */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Resultado:** "Gym Wolf 5 Días" en una línea, con elipsis si no cabe
(nunca salto de línea raro).

## Fix 5 · Quitar la redundancia del header

El header dice: `Rutina activa: Gym Wolf 5 Días`. Eso ya está en el sidebar.
**Eliminar del header** esa segunda línea. El header solo debe mostrar:
- Logo/avatar `GW`
- Nombre `Gym Wolf`
- (Opcional) nada más

```html
<header class="app-header">
  <div class="brand">
    <span class="brand-logo">GW</span>
    <div class="brand-text">
      <span class="brand-name">Gym Wolf</span>
    </div>
  </div>
  <!-- ... resto del header -->
</header>
```

**Y en móvil** el sidebar no se ve, así que la info de rutina activa
debe estar en el módulo **Inicio** o como badge en el header móvil.

## Fix 6 · Dark mode: usar SOLO tokens

**Busca y elimina** cualquier color hardcodeado:
```css
/* ❌ Eliminar */
background: #B8B8B8;
background: #ccc;
background: #ddd;
color: #000;
color: #fff;
background: white;
background: black;
```

**Reemplazar por tokens:**
```css
/* ✅ */
background: var(--bg-sunken);
background: var(--bg-elev);
background: var(--surface-hover);
color: var(--text);
color: var(--text-muted);
```

Comando de búsqueda:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" css/ | grep -v "var(--"
grep -rn "background: *white" css/
grep -rn "background: *black" css/
grep -rn "color: *white" css/
grep -rn "color: *black" css/
```

Todo lo que salga debe reemplazarse por tokens.

## Fix 7 · Asegurar el acordeón exclusivo

Verificar que `inicializarAcordeon()` cierra TODOS los días antes de abrir uno:

```js
export function inicializarAcordeon() {
  const items = document.querySelectorAll('.dia-item');

  items.forEach(item => {
    const header = item.querySelector('.dia-header');
    const body = item.querySelector('.dia-body');

    header.addEventListener('click', () => {
      const estabaAbierto = header.getAttribute('aria-expanded') === 'true';

      // Cerrar TODOS (incluido él mismo si estaba abierto)
      document.querySelectorAll('.dia-header').forEach(h => {
        h.setAttribute('aria-expanded', 'false');
        h.closest('.dia-item')?.querySelector('.dia-body')?.setAttribute('hidden', '');
      });

      // Si estaba cerrado, abrirlo
      if (!estabaAbierto) {
        header.setAttribute('aria-expanded', 'true');
        body.removeAttribute('hidden');
        sessionStorage.setItem('gw_dia_abierto', item.dataset.diaId);
      } else {
        sessionStorage.removeItem('gw_dia_abierto');
      }
    });
  });

  // Restaurar
  const ultimo = sessionStorage.getItem('gw_dia_abierto');
  if (ultimo) {
    const item = document.querySelector(`.dia-item[data-dia-id="${ultimo}"]`);
    item?.querySelector('.dia-header')?.click();
  }
}
```

## Fix 8 · Función de renderizado de ejercicios completa

Asegurar que al expandir un día se rendericen los ejercicios como filas:

```js
function renderizarEjercicios(dia, contenedor) {
  const lista = contenedor.querySelector('.ejercicios-list');
  lista.innerHTML = '';

  if (!dia.ejercicios?.length) {
    lista.innerHTML = `
      <li class="empty-state-inline">
        Sin ejercicios todavía. Agrega el primero abajo.
      </li>
    `;
    return;
  }

  dia.ejercicios.forEach((ej, idx) => {
    const li = document.createElement('li');
    li.className = 'ejercicio-row';
    li.dataset.ejercicioId = ej.id;
    li.dataset.idx = idx;

    li.innerHTML = `
      <button class="drag-handle" type="button" aria-label="Reordenar">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="3" r="1.4"/>
          <circle cx="10" cy="3" r="1.4"/>
          <circle cx="4" cy="7" r="1.4"/>
          <circle cx="10" cy="7" r="1.4"/>
          <circle cx="4" cy="11" r="1.4"/>
          <circle cx="10" cy="11" r="1.4"/>
        </svg>
      </button>
      <div class="ejercicio-info">
        <span class="ejercicio-nombre">${escapeHtml(ej.nombre)}</span>
        <span class="ejercicio-detalle">
          ${ej.series} series × ${ej.reps} reps
          ${ej.nota ? ' · ' + escapeHtml(ej.nota) : ''}
        </span>
      </div>
      <div class="ejercicio-actions">
        <button type="button" data-action="editar" aria-label="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
        </button>
        <button type="button" data-action="duplicar" aria-label="Duplicar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button type="button" data-action="eliminar" aria-label="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
    `;

    // Wire actions
    li.querySelector('[data-action="editar"]').addEventListener('click', () => editarEjercicio(dia, ej));
    li.querySelector('[data-action="duplicar"]').addEventListener('click', () => duplicarEjercicio(dia, ej));
    li.querySelector('[data-action="eliminar"]').addEventListener('click', () => eliminarEjercicio(dia, ej));

    lista.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
```

**CSS para el estado vacío inline:**
```css
.empty-state-inline {
  list-style: none;
  padding: var(--sp-4);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  background: var(--bg-sunken);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
}
```

---

# 3. CHECKLIST DE VERIFICACIÓN

Después de aplicar los 8 fixes, verifica:

## Rutina · Vista colapsada
- [ ] Al entrar, los 5 días se ven como tarjetas de UNA LÍNEA
- [ ] Cada tarjeta muestra: nombre + enfoque + "N ejercicios"
- [ ] Al pulsar una → se expande y muestra el detalle
- [ ] Al pulsar otra → la primera se colapsa
- [ ] El chevron ▸ rota a 90°

## Rutina · Día expandido
- [ ] Se ven los campos "Nombre" y "Enfoque" editables
- [ ] Se ve el toggle "Día de descanso"
- [ ] Se ven los ejercicios como filas compactas de 56px de alto
- [ ] Cada fila tiene: drag handle + nombre + detalle + 3 botones
- [ ] Los óvalos grises gigantes **YA NO EXISTEN**
- [ ] El card NO tiene espacio vacío enorme
- [ ] Al final hay botón "+ Agregar ejercicio"

## Sidebar
- [ ] "Gym Wolf 5 Días" se ve en UNA línea (con elipsis si no cabe)
- [ ] El bloque "Rutina activa" tiene fondo y borde propio
- [ ] No se ve "Sin sesión abierta" raro (o está bien formateado)

## Header
- [ ] NO muestra "Rutina activa: Gym Wolf 5 Días" duplicado
- [ ] Solo muestra "GW Gym Wolf" + botones de acción

## Dark mode
- [ ] Todos los colores vienen de tokens `var(--*)`
- [ ] No hay grises random (`#B8B8B8`, `#ccc`, etc.)
- [ ] El contraste es legible en todas las zonas

## General
- [ ] No hay scroll infinito en ningún módulo
- [ ] La consola del navegador no muestra errores
- [ ] Al recargar, el día abierto se mantiene

---

# 4. ORDEN DE APLICACIÓN

Ejecuta EXACTAMENTE en este orden:

1. **Fix 1** → drag handle como SVG con tamaño fijo
2. **Fix 2** → estructura `.ejercicio-row` con grid 3 columnas
3. **Fix 3** → eliminar `min-height` y `aspect-ratio` de cards
4. **Fix 4** → sidebar footer limpio sin wrap
5. **Fix 5** → quitar redundancia del header
6. **Fix 6** → auditar y reemplazar colores hardcodeados
7. **Fix 7** → acordeón exclusivo correcto
8. **Fix 8** → `renderizarEjercicios()` completa

---

# 5. COMANDOS DE AUDITORÍA

Ejecuta estos comandos en la raíz del proyecto para encontrar problemas:

```bash
# Buscar drag handles mal implementados
grep -rn "drag-handle" js/ css/

# Buscar min-height/aspect-ratio sospechosos
grep -rn "min-height" css/
grep -rn "aspect-ratio" css/

# Buscar colores hardcodeados
grep -rn "#[0-9a-fA-F]\{3,6\}" css/ | grep -v "var(--"

# Buscar background/color sin tokens
grep -rn "background:.*white\|background:.*black\|color:.*white\|color:.*black" css/

# Buscar aspect-ratio: 1
grep -rn "aspect-ratio: 1" css/

# Buscar height 100% en contenedores sospechosos
grep -rn "height: 100%" css/
```

Cualquier coincidencia es candidata a fix.

---

# 6. INSTRUCCIONES PARA COPILOT

```
Lee PROMPT_FIX_RUTINA_RENDER.md y aplica los 8 fixes en el orden exacto 
de la sección 4. Empieza por el Fix 1 (drag handle SVG).

Reglas:
- NO refactorices módulos que funcionan (Historial, Medidas, Ajustes).
- Aplica los fixes uno por uno, sin agrupar.
- Después de cada fix, verifica visualmente.
- Si algún estilo está duplicado, ELIMÍNALO, no lo dejes.
- Si algún color está hardcodeado, REEMPLÁZALO por tokens.
```

# FIN DEL FIX
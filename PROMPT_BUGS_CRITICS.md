# FIX · Dos bugs críticos en Rutina y Hoy

## Bug 1 · El acordeón de días no se puede colapsar

### Síntoma
Todos los días aparecen expandidos al entrar a Rutina, y al pulsar el header
de un día abierto **no se cierra**. El toggle está roto.

### Causas probables

**Causa A · El atributo `hidden` no se está aplicando o removiendo bien**

Si el HTML inicial tiene `<div class="dia-body">` sin `hidden`, todos se ven
abiertos. Y si el JS solo hace `body.hidden = false` pero nunca `true`, no se
cierran.

**Causa B · El listener se registra múltiples veces**

Si `inicializarAcordeon()` se llama cada vez que se entra al módulo sin
limpiar los listeners previos, cada click dispara el handler N veces
(toggle → toggle → toggle) y el resultado neto es que "no pasa nada".

**Causa C · El estado se lee mal**

Si el toggle consulta `body.hidden` pero el CSS usa `display: none` o
`max-height: 0`, el estado real no coincide.

**Causa D · Se aplica `aria-expanded` pero no el atributo `hidden`**

El chevron rota pero el contenido sigue visible.

### Fix · Acordeón robusto y desacoplado

**Paso 1 · Asegurar el estado inicial en el HTML**

Todos los `.dia-body` deben tener `hidden` en el HTML **excepto** el que
esté guardado en `sessionStorage` (y si no hay ninguno, ninguno se muestra).

```html
<div class="dia-body" id="dia-body-lunes" hidden>
  <!-- ... contenido ... -->
</div>
```

Y en el CSS, **eliminar** cualquier regla que pueda estar mostrando estos
elementos por encima del atributo `hidden`:

```css
/* ✅ Regla global que refuerza el atributo hidden */
[hidden] { display: none !important; }

/* ❌ ELIMINAR cualquier regla así si existe */
/* .dia-body { display: block !important; } */
/* .dia-body { max-height: 9999px; } */
/* .dia-item .dia-body { display: flex; } */
```

**Paso 2 · Reemplazar la función `inicializarAcordeon` completa**

En `js/rutinas.js`, sustituir la implementación actual por esta versión
que **usa delegación de eventos** (evita listeners duplicados):

```js
// js/rutinas.js

/**
 * Inicializa el acordeón exclusivo de días.
 * Usa delegación de eventos para evitar listeners duplicados
 * aunque se llame varias veces.
 */
export function inicializarAcordeon() {
  const contenedor = document.querySelector('.dias-list');
  if (!contenedor) return;

  // Evitar registrar el listener más de una vez
  if (contenedor.dataset.acordeonInit === '1') return;
  contenedor.dataset.acordeonInit = '1';

  // Delegación de eventos: un solo listener para todos los headers
  contenedor.addEventListener('click', (e) => {
    const header = e.target.closest('.dia-header');
    if (!header) return;
    e.preventDefault();
    toggleDia(header.closest('.dia-item'));
  });

  // Restaurar el último día abierto
  const ultimo = sessionStorage.getItem('gw_dia_abierto');
  if (ultimo) {
    const item = contenedor.querySelector(`.dia-item[data-dia-id="${ultimo}"]`);
    if (item) abrirDia(item, false); // false = no guardar en sessionStorage de nuevo
  }
}

/**
 * Alterna el estado de un día (abre/cierra).
 */
function toggleDia(item) {
  if (!item) return;
  const header = item.querySelector('.dia-header');
  const body = item.querySelector('.dia-body');
  if (!header || !body) return;

  const estaAbierto = header.getAttribute('aria-expanded') === 'true';

  // Cerrar TODOS los días
  document.querySelectorAll('.dia-item').forEach(it => {
    const h = it.querySelector('.dia-header');
    const b = it.querySelector('.dia-body');
    if (h) h.setAttribute('aria-expanded', 'false');
    if (b) b.setAttribute('hidden', '');
  });

  // Si estaba cerrado, abrirlo. Si estaba abierto, queda cerrado (toggle real).
  if (!estaAbierto) {
    abrirDia(item, true);
  } else {
    sessionStorage.removeItem('gw_dia_abierto');
  }
}

/**
 * Abre un día específico.
 */
function abrirDia(item, guardar) {
  const header = item.querySelector('.dia-header');
  const body = item.querySelector('.dia-body');
  if (!header || !body) return;

  header.setAttribute('aria-expanded', 'true');
  body.removeAttribute('hidden');

  if (guardar) {
    sessionStorage.setItem('gw_dia_abierto', item.dataset.diaId);
  }
}
```

**Paso 3 · Revisar el HTML generado**

Cada `.dia-item` **debe** tener `data-dia-id` y el `.dia-header` **debe** tener
`aria-expanded="false"` por defecto:

```html
<div class="dia-item" data-dia-id="lunes">
  <button class="dia-header" aria-expanded="false" aria-controls="dia-body-lunes">
    ...
  </button>
  <div class="dia-body" id="dia-body-lunes" hidden>
    ...
  </div>
</div>
```

**Paso 4 · Refuerzo en CSS**

Agregar al final de `styles.css`:

```css
/* Refuerzo: el atributo hidden siempre gana */
[hidden] { display: none !important; }

/* El chevron rota solo cuando el header está expandido */
.dia-header[aria-expanded="false"] .dia-chevron { transform: rotate(0deg); }
.dia-header[aria-expanded="true"]  .dia-chevron { transform: rotate(90deg); }
```

**Paso 5 · Si los días se siguen viendo abiertos al entrar**

Añadir esta llamada defensiva al inicio de `inicializarAcordeon()`:

```js
// Cerrar todos por defecto antes de restaurar
document.querySelectorAll('.dia-item').forEach(it => {
  it.querySelector('.dia-header')?.setAttribute('aria-expanded', 'false');
  it.querySelector('.dia-body')?.setAttribute('hidden', '');
});
```

---

## Bug 2 · Al iniciar Gym y seleccionar rutina, no carga los ejercicios del día

### Síntoma
Al pulsar "Iniciar día" → seleccionar "Lunes" en el modal → la sesión se crea
pero el módulo "Hoy" aparece **vacío** ("Hoy no tienes ejercicios cargados").

### Causas probables

**Causa A · El índice del día no coincide con el array `dias`**

Si el modal usa `data-dia-id="lunes"` pero la búsqueda se hace por índice
(`rutina.dias[0]`), y el orden del array no es Lun–Vie, se carga el día equivocado
o ninguno.

**Causa B · Los ejercicios no se están copiando del día a la sesión**

Al crear la sesión, probablemente se guarda `diaId` pero no se copian los
ejercicios del día a `sesion.ejercicios`.

**Causa C · El módulo Hoy lee de un lugar distinto**

El módulo Hoy probablemente lee de `sesion.ejercicios` pero al crearse la
sesión ese array quedó vacío o `undefined`.

**Causa D · Se guarda el id del día pero al leerlo no se resuelve**

Si la sesión guarda `diaId: "lunes"` pero el código busca por índice numérico,
no encuentra nada.

### Fix · Carga robusta de ejercicios al crear sesión

**Paso 1 · Reescribir `confirmarInicioSesion()` en `js/sesion.js`**

```js
// js/sesion.js
import { db } from './db.js';
import { toast, cerrarModal } from './ui.js';

/**
 * Confirma la rutina seleccionada en el modal y crea la sesión de hoy
 * con TODOS los ejercicios del día precargados.
 */
export async function confirmarInicioSesion() {
  const seleccionada = document.querySelector('.rutina-card[aria-checked="true"]');
  if (!seleccionada) {
    toast('Selecciona una rutina primero', 'warning');
    return;
  }

  const diaId = seleccionada.dataset.diaId; // "lunes"
  if (!diaId) {
    toast('Día no identificado', 'error');
    return;
  }

  // 1. Obtener rutina activa
  const rutinas = await db.rutinas.toArray();
  if (!rutinas.length) {
    toast('No hay rutinas guardadas', 'error');
    return;
  }
  const rutinaActiva = rutinas.find(r => r.esActivo) || rutinas[0];

  // 2. Buscar el día por ID (no por índice)
  const dia = rutinaActiva.dias.find(d => d.id === diaId);
  if (!dia) {
    toast(`Día "${diaId}" no encontrado en la rutina`, 'error');
    console.error('Días disponibles:', rutinaActiva.dias.map(d => d.id));
    return;
  }

  // 3. Validar que tenga ejercicios
  if (!dia.ejercicios || dia.ejercicios.length === 0) {
    toast('Este día no tiene ejercicios configurados', 'warning');
    // Aun así continuamos: se crea la sesión vacía
  }

  // 4. Construir la sesión con los ejercicios COPIADOS del día
  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const horaInicio = ahora.toTimeString().slice(0, 5);
  const idSesion = `ses_${fecha}`;

  const ejerciciosSesion = (dia.ejercicios || []).map(ej => ({
    ejercicioId: ej.id || crypto.randomUUID(),
    nombre: ej.nombre,
    nota: ej.nota || '',
    prescripcion: `${ej.series} series × ${ej.reps} reps`,
    rpe: null,
    series: Array.from({ length: Number(ej.series) || 3 }, () => ({
      peso: null,
      reps: null,
      tiempoSeg: null,
      hecho: false,
    })),
  }));

  const coreSesion = (dia.core || []).map(c => ({
    nombre: c.nombre,
    series: c.series,
    reps: c.reps,
    hecho: false,
  }));

  const sesion = {
    id: idSesion,
    fecha,
    diaId: dia.id,
    diaNombre: dia.nombre,
    rutinaId: rutinaActiva.id,
    horaInicio,
    horaFin: null,
    duracionMin: null,
    energia: null,
    notas: '',
    cardio: '',
    ejercicios: ejerciciosSesion,
    core: coreSesion,
  };

  // 5. Reemplazar si ya existe una sesión del mismo día sin cerrar
  const existente = await db.sesiones.get(idSesion);
  if (existente && !existente.horaFin) {
    // Sobrescribir con la nueva selección
    await db.sesiones.put(sesion);
  } else {
    await db.sesiones.put(sesion);
  }

  // 6. Cerrar modal, toast y navegar
  cerrarModal('modal-seleccion-rutina');
  toast(`Sesión iniciada · ${dia.nombre} · ${ejerciciosSesion.length} ejercicios`, 'success');

  // 7. Navegar a Hoy y forzar re-render
  location.hash = '#/hoy';
  // Disparar renderizado después del cambio de hash
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent('gw:sesion-creada', { detail: { sesionId: idSesion } }));
  }, 50);
}
```

**Paso 2 · Asegurar que el módulo Hoy re-renderiza al recibir el evento**

En `js/sesion.js` (o donde se monte el módulo Hoy):

```js
/**
 * Renderiza el módulo Hoy leyendo la sesión actual.
 */
export async function renderizarHoy() {
  const fecha = new Date().toISOString().slice(0, 10);
  const sesion = await db.sesiones.get(`ses_${fecha}`);

  const contenedor = document.getElementById('hoy');
  if (!contenedor) return;

  // Si no hay sesión, mostrar estado vacío
  if (!sesion) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <p class="empty-title">Aún no has iniciado tu sesión de hoy</p>
        <p class="empty-desc">Pulsa "Iniciar día" para seleccionar tu rutina.</p>
        <button class="btn btn-primary" data-action="iniciar-dia">
          ▶ Iniciar día
        </button>
      </div>
    `;
    // Wire del botón
    contenedor.querySelector('[data-action="iniciar-dia"]')
      ?.addEventListener('click', () => {
        import('./rutinas.js').then(m => m.abrirSelectorRutina?.());
      });
    return;
  }

  // Hay sesión → renderizar ejercicios
  const ejerciciosHtml = sesion.ejercicios.length
    ? sesion.ejercicios.map((ej, ejIdx) => renderEjercicioCard(ej, ejIdx, sesion.id)).join('')
    : `<div class="empty-state-inline">
         Esta sesión no tiene ejercicios cargados.
       </div>`;

  contenedor.innerHTML = `
    <header class="module-header">
      <h1>Hoy · ${sesion.diaNombre}</h1>
      <button class="btn ${sesion.horaFin ? 'btn-secondary' : 'btn-danger'}"
              data-action="${sesion.horaFin ? 'editar-sesion' : 'terminar-gym'}">
        ${sesion.horaFin ? '✎ Editar sesión' : '⏹ Terminar gym'}
      </button>
    </header>

    <div class="sesion-meta"> <!-- fecha, hora inicio/fin, etc. --> </div>

    <h2 class="section-title">Ejercicios</h2>
    <div class="ejercicios-container">
      ${ejerciciosHtml}
    </div>

    <button class="btn btn-secondary btn-full" data-action="agregar-ejercicio">
      + Agregar ejercicio extra
    </button>
  `;

  // Wire de acciones
  wireAccionesHoy(sesion);
}

/**
 * Renderiza una card de ejercicio con sus series.
 */
function renderEjercicioCard(ej, ejIdx, sesionId) {
  const seriesHtml = ej.series.map((s, sIdx) => `
    <div class="serie-row"
         data-sesion="${sesionId}"
         data-ej="${ejIdx}"
         data-serie="${sIdx}"
         data-estado="${s.hecho ? 'completada' : 'inactiva'}">
      <span class="serie-label">S${sIdx + 1}</span>
      <div class="serie-input-group">
        <input type="number" inputmode="decimal"
               class="input serie-peso"
               value="${s.peso ?? ''}"
               placeholder="kg" aria-label="Peso serie ${sIdx + 1}" />
        <span class="input-suffix">kg</span>
      </div>
      <div class="serie-input-group">
        <input type="number" inputmode="numeric"
               class="input serie-reps"
               value="${s.reps ?? ''}"
               placeholder="reps" aria-label="Reps serie ${sIdx + 1}" />
      </div>
      <button class="serie-timer-btn" data-action="toggle-timer"
              aria-label="Iniciar serie ${sIdx + 1}">
        <span class="icon-play" ${s.hecho ? 'hidden' : ''}>▶</span>
        <span class="icon-stop" ${s.hecho ? '' : 'hidden'}>⏸</span>
      </button>
      <span class="serie-timer">
        ${s.tiempoSeg != null ? formatearMMSS(s.tiempoSeg) : '00:00'}
      </span>
    </div>
  `).join('');

  return `
    <article class="ejercicio-card" data-ejercicio-id="${ej.ejercicioId}" data-ej-idx="${ejIdx}">
      <header class="ejercicio-card-header">
        <div class="ejercicio-card-title">
          <span class="ejercicio-num">${ejIdx + 1}</span>
          <div>
            <h3 class="ejercicio-card-nombre">${escapeHtml(ej.nombre)}</h3>
            <p class="ejercicio-card-prescripcion">${escapeHtml(ej.prescripcion || '')}</p>
          </div>
        </div>
      </header>
      <div class="series-list">${seriesHtml}</div>
    </article>
  `;
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

/**
 * Conecta los botones y listeners del módulo Hoy después de renderizar.
 */
function wireAccionesHoy(sesion) {
  // Terminar gym
  document.querySelector('[data-action="terminar-gym"]')
    ?.addEventListener('click', () => import('./sesion.js').then(m => m.terminarGym(sesion.id)));

  // Agregar ejercicio extra
  document.querySelector('[data-action="agregar-ejercicio"]')
    ?.addEventListener('click', () => import('./sesion.js').then(m => m.abrirModalAgregarEjercicio(sesion.id)));

  // Inputs de peso y reps
  document.querySelectorAll('.serie-peso').forEach(input => {
    input.addEventListener('input', (e) => {
      const row = e.target.closest('.serie-row');
      guardarCampoSerie(row.dataset.sesion, Number(row.dataset.ej), Number(row.dataset.serie), 'peso', e.target.value);
    });
  });
  document.querySelectorAll('.serie-reps').forEach(input => {
    input.addEventListener('input', (e) => {
      const row = e.target.closest('.serie-row');
      guardarCampoSerie(row.dataset.sesion, Number(row.dataset.ej), Number(row.dataset.serie), 'reps', e.target.value);
    });
  });

  // Botón timer
  document.querySelectorAll('[data-action="toggle-timer"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.serie-row');
      import('./sesion.js').then(m => m.toggleSerieTimer(
        row.dataset.sesion,
        Number(row.dataset.ej),
        Number(row.dataset.serie)
      ));
    });
  });
}

async function guardarCampoSerie(sesionId, ejIdx, serIdx, campo, valor) {
  const sesion = await db.sesiones.get(sesionId);
  if (!sesion?.ejercicios?.[ejIdx]?.series?.[serIdx]) return;
  sesion.ejercicios[ejIdx].series[serIdx][campo] =
    campo === 'peso' ? (valor === '' ? null : Number(valor))
                     : (valor === '' ? null : Number(valor));
  await db.sesiones.put(sesion);
}
```

**Paso 3 · Escuchar el evento de "sesión creada" para re-renderizar**

En `app.js` o donde se inicialice el router:

```js
document.addEventListener('gw:sesion-creada', () => {
  import('./sesion.js').then(m => m.renderizarHoy());
});

window.addEventListener('hashchange', () => {
  if (location.hash === '#/hoy') {
    import('./sesion.js').then(m => m.renderizarHoy());
  }
});
```

**Paso 4 · Verificar que el modal genere las tarjetas con `data-dia-id`**

En el código que genera las tarjetas del modal (ver `PROMPT_FLUJO_RUTINA.md`),
asegurar:

```js
card.dataset.diaId = dia.id;      // "lunes"
card.dataset.diaIdx = idx;         // 0
```

Y en `confirmarInicioSesion()` usar **`diaId`** (por ID), no `diaIdx` (por índice).

**Paso 5 · Verificar la estructura de la rutina en IndexedDB**

Abrir DevTools → Application → IndexedDB → `gymwolf` → tabla `rutinas`.
Verificar que cada día tiene:

```js
{
  id: "lunes",
  nombre: "Lunes",
  enfoque: "Glúteo Mayor & Femorales",
  ejercicios: [
    { id: "uuid", nombre: "Hip Thrust con Barra", series: 4, reps: "8-10", nota: "..." },
    // ...
  ],
  core: [
    { nombre: "Vacíos Abdominales", series: 4, reps: "15-20 s" },
    // ...
  ]
}
```

Si el array `ejercicios` está vacío o no existe → ese es el bug. Hay que
revisar el seed de `db.js`.

**Paso 6 · Verificar el seed en `db.js`**

La constante `RUTINA_DEFAULT` debe tener **TODOS los ejercicios** de cada día
cargados. Verificar que no esté devolviendo días vacíos:

```js
const RUTINA_DEFAULT = {
  id: 'rutina_default',
  nombre: 'Gym Wolf 5 Días',
  esDefault: true,
  esActivo: true,
  dias: [
    {
      id: 'lunes',
      nombre: 'Lunes',
      enfoque: 'Glúteo Mayor & Femorales',
      ejercicios: [
        { id: crypto.randomUUID(), nombre: 'Hip Thrust con Barra', series: 4, reps: '8-10', nota: 'Pausa de 1 s arriba' },
        { id: crypto.randomUUID(), nombre: 'Peso Muerto Rumano', series: 4, reps: '10-12', nota: 'Empujar la cadera hacia atrás' },
        { id: crypto.randomUUID(), nombre: 'Sentadilla Búlgara', series: 3, reps: '10 / pierna', nota: 'Torso ligeramente inclinado al frente' },
        { id: crypto.randomUUID(), nombre: 'Curl Femoral (Acostado o Sentado)', series: 3, reps: '12-15', nota: 'Bajada lenta en 2-3 s' },
        { id: crypto.randomUUID(), nombre: 'Abducción de Cadera en Máquina', series: 3, reps: '15-20', nota: 'Última serie drop-set' },
      ],
      core: [
        { id: crypto.randomUUID(), nombre: 'Vacíos Abdominales', series: 4, reps: '15-20 s' },
        { id: crypto.randomUUID(), nombre: 'Plancha Prona sobre Codos', series: 3, reps: '30-45 s' },
        { id: crypto.randomUUID(), nombre: 'Pallof Press en Polea', series: 3, reps: '10-12 / lado' },
      ],
    },
    // ... martes, miércoles, jueves, viernes (con sus ejercicios completos)
  ],
};
```

**Paso 7 · Resetear los datos si la rutina quedó corrupta**

Si al revisar IndexedDB la rutina está vacía o mal formada, agregar en
`js/ajustes.js` un botón temporal o ejecutar en la consola:

```js
// Ejecutar en DevTools Console si la rutina quedó corrupta
indexedDB.deleteDatabase('gymwolf');
location.reload();
```

Al recargar, el seed se vuelve a aplicar desde cero.

---

## CHECKLIST DE VERIFICACIÓN

### Bug 1 · Acordeón

- [ ] Al entrar a Rutina, **TODOS los días están colapsados**
- [ ] Al pulsar "Lunes" → se abre
- [ ] Al volver a pulsar "Lunes" → **se cierra** (toggle real)
- [ ] Al pulsar "Martes" con "Lunes" abierto → Lunes se cierra, Martes se abre
- [ ] Solo un día abierto a la vez
- [ ] El chevron ▸ rota cuando está abierto, vuelve a 0° cuando está cerrado
- [ ] Al recargar, el último día abierto se mantiene abierto
- [ ] `aria-expanded` cambia entre `true` y `false` correctamente

### Bug 2 · Carga de ejercicios

- [ ] Al iniciar sesión desde el Dashboard → "Iniciar día" → modal
- [ ] El modal muestra los 5 días con la sugerida preseleccionada
- [ ] Al elegir "Lunes" y confirmar → la sesión se crea
- [ ] En el módulo "Hoy" **aparecen los 5 ejercicios del lunes**
- [ ] Cada ejercicio tiene sus series según la prescripción (4 series para Hip Thrust)
- [ ] Los inputs de peso y reps están listos para rellenar
- [ ] El botón ▶ de cada serie funciona
- [ ] El bloque de core aparece al final
- [ ] Si elijo otro día (ej. "Miércoles") → carga los 5 ejercicios del miércoles
- [ ] Si recargo la página → la sesión sigue ahí con los mismos ejercicios

### Debugging si algo falla

Abre DevTools Console y ejecuta:

```js
// 1. Ver la rutina guardada
const db = await import('./js/db.js').then(m => m.db);
const rutinas = await db.rutinas.toArray();
console.log('Rutinas:', rutinas);
console.log('Días de la rutina activa:', rutinas[0]?.dias.map(d => ({ id: d.id, ejercicios: d.ejercicios?.length })));

// 2. Ver la sesión creada
const fecha = new Date().toISOString().slice(0, 10);
const sesion = await db.sesiones.get(`ses_${fecha}`);
console.log('Sesión de hoy:', sesion);
console.log('Ejercicios en la sesión:', sesion?.ejercicios?.length);
```

Si `rutinas[0].dias[0].ejercicios` está vacío → bug en el seed.
Si `sesion.ejercicios` está vacío → bug en `confirmarInicioSesion`.
Si `sesion` es `undefined` → bug en el guardado o en la fecha.

---

## ORDEN DE APLICACIÓN

1. **Bug 1 · Paso 1** → asegurar `hidden` en el HTML inicial
2. **Bug 1 · Paso 2** → reemplazar `inicializarAcordeon` con delegación
3. **Bug 1 · Paso 4** → agregar CSS `[hidden] { display: none !important; }`
4. **Bug 2 · Paso 1** → reescribir `confirmarInicioSesion()`
5. **Bug 2 · Paso 2** → reescribir `renderizarHoy()`
6. **Bug 2 · Paso 3** → conectar el evento `gw:sesion-creada`
7. **Bug 2 · Paso 6** → verificar el seed en `db.js`
8. **Bug 2 · Paso 7** → si sigue fallando, resetear IndexedDB
9. Verificar con el checklist completo

---

## INSTRUCCIONES PARA COPILOT

```
Lee PROMPT_FIX_ACORDEON_SESION.md y aplica los dos fixes en el orden exacto:

1. Bug 1 (acordeón): reescribir inicializarAcordeon() con delegación de 
   eventos y toggle real. Asegurar que los días arrancan colapsados.

2. Bug 2 (carga de ejercicios): reescribir confirmarInicioSesion() para 
   buscar el día por ID (no por índice) y copiar TODOS los ejercicios 
   del día a la sesión. Verificar el seed en db.js.

Reglas:
- NO toques Historial, Medidas, Progreso ni Ajustes.
- Verifica el HTML generado por el acordeón.
- Si el array dias[].ejercicios está vacío en el seed, arréglalo.
- Después de cada fix, prueba con el checklist.
```

# FIN DEL FIX
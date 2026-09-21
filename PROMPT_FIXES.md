# CORRECCIONES DE UI · Toasts, Paletas y Menú Móvil

Este documento REEMPLAZA y CORRIGE las secciones correspondientes del
PROMPT_UI_COMPLETO.md. Aplicar todo en el orden indicado al final.

---

# PROBLEMA 1 · LOS TOASTS/ALERTAS APARECEN AL FINAL DE LA PÁGINA

## Diagnóstico

Actualmente los toasts se insertan al final del `<body>` con `position: static`
o dentro de un contenedor scrolleable. Por eso hay que desplazarse hasta abajo
para verlos. Deben ser **overlays flotantes fijos al top de la pantalla**.

## Solución · Contenedor fijo arriba

### HTML (colocar JUSTO después de `<body>`, antes de cualquier contenido)

```html
<!-- Contenedor de toasts · SIEMPRE en el top, flotante, fixed -->
<div id="toast-container" class="toast-container" role="region" aria-live="polite" aria-label="Notificaciones"></div>
```

**Importante:** debe estar al **principio del `<body>`**, no al final. Aunque
con `position: fixed` y `z-index` alto no debería importar, ponerlo primero
evita problemas de stacking context y de rendimiento.

### CSS

```css
/* ============================================
   TOASTS · Notificaciones flotantes en el TOP
   ============================================ */
.toast-container {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  pointer-events: none;
  width: calc(100% - 32px);
  max-width: 420px;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-left: 4px solid var(--primary);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lg);
  font-size: var(--fs-sm);
  font-weight: 600;
  min-width: 240px;
  max-width: 100%;
  animation: toast-in 240ms cubic-bezier(.2, .9, .3, 1.2);
  will-change: transform, opacity;
}

.toast--success { border-left-color: var(--success); }
.toast--error   { border-left-color: var(--danger); }
.toast--warning { border-left-color: var(--warning, #D4A574); }
.toast--info    { border-left-color: var(--primary); }

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.toast--success .toast-icon { color: var(--success); }
.toast--error   .toast-icon { color: var(--danger); }
.toast--warning .toast-icon { color: var(--warning, #D4A574); }
.toast--info    .toast-icon { color: var(--primary); }

.toast-msg { flex: 1; line-height: 1.3; }

.toast--leaving {
  animation: toast-out 200ms ease forwards;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-16px) scale(.96); }
  to   { opacity: 1; transform: translateY(0)     scale(1); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0)     scale(1); }
  to   { opacity: 0; transform: translateY(-12px) scale(.96); }
}

/* Desktop: alineado a la derecha arriba */
@media (min-width: 768px) {
  .toast-container {
    left: auto;
    right: 24px;
    transform: none;
    align-items: flex-end;
  }
}

/* Reducir movimiento */
@media (prefers-reduced-motion: reduce) {
  .toast, .toast--leaving { animation: none; }
}
```

### JS · Reemplazar la función `toast()` en `js/ui.js`

```js
/**
 * Muestra una notificación flotante en el TOP de la pantalla.
 * @param {string} mensaje - Texto del toast (capitalizado, sin punto final)
 * @param {'info'|'success'|'error'|'warning'} tipo
 * @param {number} duracion - ms antes de desaparecer (default 2800)
 */
export function toast(mensaje, tipo = 'info', duracion = 2800) {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.warn('Falta #toast-container en el HTML');
    return;
  }

  const iconos = {
    info:    'ℹ',
    success: '✓',
    error:   '✕',
    warning: '⚠',
  };

  const el = document.createElement('div');
  el.className = `toast toast--${tipo}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${iconos[tipo] || 'ℹ'}</span>
    <span class="toast-msg">${mensaje}</span>
  `;

  container.appendChild(el);

  // Auto-cierre
  const timeout = setTimeout(() => {
    el.classList.add('toast--leaving');
    setTimeout(() => el.remove(), 220);
  }, duracion);

  // Click para cerrar antes
  el.addEventListener('click', () => {
    clearTimeout(timeout);
    el.classList.add('toast--leaving');
    setTimeout(() => el.remove(), 220);
  });
}
```

### Reglas adicionales

- **NUNCA** uses `alert()`, `confirm()` ni `prompt()` nativos del navegador.
  Bloquean la UI, se ven feos y en móvil se comportan distinto.
- **NUNCA** uses `window.scrollTo(0,0)` antes de mostrar un toast.
- El contenedor debe estar **fuera de cualquier `overflow: auto`** o
  `overflow: scroll`. Por eso vive directo en `<body>`.
- Los toasts se **apilan**: el más nuevo abajo del anterior (con gap).
- Máximo **3 toasts simultáneos**: si llega un 4º, eliminar el más antiguo.

---

# PROBLEMA 2 · COLORES BASE TIPO SALMÓN · NUEVA PALETA

## Diagnóstico

La paleta "Rosa Suave" actual usaba `--primary: #A86276`, que tira hacia
marrón/salmón. El usuario prefiere colores en la gama **morado, rosa, azul
y verde**, con **blanco y negro como default**.

## Solución · 5 paletas nuevas (una default + 4 de color)

Se eliminan: "Arena Cálida" y "Medianoche". Se mantienen y ajustan:
**Monocromo (default)**, **Rosa**, **Morado**, **Azul**, **Verde**.

### Paleta DEFAULT · MONOCROMO (blanco/negro neutro)

```css
:root[data-theme="light"][data-palette="mono"] {
  --bg: #F7F7F8;
  --bg-elev: #FFFFFF;
  --bg-sunken: #EDEEF0;
  --surface: #FFFFFF;
  --surface-hover: #F2F3F5;
  --border: #DCDEE2;
  --border-strong: #B9BEC6;
  --text: #1C1D20;
  --text-muted: #5F6368;
  --text-disabled: #A0A4AC;
  --text-on-primary: #FFFFFF;
  --primary: #2B2D31;
  --primary-hover: #1A1B1E;
  --primary-soft: #E6E8EB;
  --accent: #6B7280;
  --accent-soft: #EAECEF;
  --success: #2E7D32;
  --success-soft: #E0EFE1;
  --warning: #B07830;
  --danger: #C62828;
}

:root[data-theme="dark"][data-palette="mono"] {
  --bg: #121316;
  --bg-elev: #1A1C20;
  --bg-sunken: #0D0E11;
  --surface: #1A1C20;
  --surface-hover: #23262B;
  --border: #2A2D33;
  --border-strong: #41454D;
  --text: #EDEEF1;
  --text-muted: #9CA0A8;
  --text-disabled: #575B63;
  --text-on-primary: #121316;
  --primary: #E6E8EB;
  --primary-hover: #F4F5F7;
  --primary-soft: #23262B;
  --accent: #A0A4AC;
  --accent-soft: #24272C;
  --success: #6BB86E;
  --success-soft: #1E2A20;
  --warning: #D9A75C;
  --danger: #E57373;
}
```

### Paleta 1 · ROSA (rosa verdadero, NO salmón)

Usa magenta-rosa, evitando la naranja del salmón.

```css
:root[data-theme="light"][data-palette="rosa"] {
  --bg: #FBF2F6;
  --bg-elev: #FFFFFF;
  --bg-sunken: #F4E5EC;
  --surface: #FFFFFF;
  --surface-hover: #F8ECF1;
  --border: #EBD3DD;
  --border-strong: #D4AEC0;
  --text: #331F29;
  --text-muted: #7A5A68;
  --text-disabled: #B99CAB;
  --text-on-primary: #FFFFFF;
  --primary: #B03E7A;      /* rosa verdadero, magenta-rosa */
  --primary-hover: #952F65;
  --primary-soft: #F4D9E5;
  --accent: #D67AA8;
  --accent-soft: #F8DCE9;
  --success: #4E8A5B;
  --success-soft: #DFEDE2;
  --warning: #B47830;
  --danger: #C14B4B;
}

:root[data-theme="dark"][data-palette="rosa"] {
  --bg: #1A1419;
  --bg-elev: #241C22;
  --bg-sunken: #120D11;
  --surface: #241C22;
  --surface-hover: #2F252D;
  --border: #3A2C35;
  --border-strong: #523E49;
  --text: #F2E4EB;
  --text-muted: #AD8F9D;
  --text-disabled: #6A5761;
  --text-on-primary: #1A1419;
  --primary: #E58BB8;
  --primary-hover: #EEA3C8;
  --primary-soft: #3A2530;
  --accent: #D67AA8;
  --accent-soft: #3D2735;
  --success: #8AC48D;
  --success-soft: #243028;
  --warning: #E0B06B;
  --danger: #E68383;
}
```

### Paleta 2 · MORADO

Violeta profundo, elegante, no lavanda pálido.

```css
:root[data-theme="light"][data-palette="morado"] {
  --bg: #F5F2FA;
  --bg-elev: #FFFFFF;
  --bg-sunken: #EBE5F3;
  --surface: #FFFFFF;
  --surface-hover: #F0EAF6;
  --border: #DDD2E8;
  --border-strong: #BFAED4;
  --text: #241C33;
  --text-muted: #62547A;
  --text-disabled: #A697BC;
  --text-on-primary: #FFFFFF;
  --primary: #6A3FA8;      /* morado medio, saturado justo */
  --primary-hover: #57328C;
  --primary-soft: #E2D4F1;
  --accent: #9268C8;
  --accent-soft: #E7DCF4;
  --success: #4E8A5B;
  --success-soft: #DFEDE2;
  --warning: #B47830;
  --danger: #C14B4B;
}

:root[data-theme="dark"][data-palette="morado"] {
  --bg: #15111E;
  --bg-elev: #1E1928;
  --bg-sunken: #0E0B15;
  --surface: #1E1928;
  --surface-hover: #292234;
  --border: #322940;
  --border-strong: #4A3D5E;
  --text: #EAE2F4;
  --text-muted: #9E8FB8;
  --text-disabled: #5D5170;
  --text-on-primary: #15111E;
  --primary: #B594E0;
  --primary-hover: #C6ABE9;
  --primary-soft: #2D2440;
  --accent: #A883D8;
  --accent-soft: #2F2643;
  --success: #8AC48D;
  --success-soft: #243028;
  --warning: #E0B06B;
  --danger: #E68383;
}
```

### Paleta 3 · AZUL

Azul medio, sereno, tipo cobalto apagado.

```css
:root[data-theme="light"][data-palette="azul"] {
  --bg: #F1F5FA;
  --bg-elev: #FFFFFF;
  --bg-sunken: #E3EBF4;
  --surface: #FFFFFF;
  --surface-hover: #EBF1F7;
  --border: #D1DDE9;
  --border-strong: #A9BED6;
  --text: #1D2836;
  --text-muted: #526379;
  --text-disabled: #94A5BB;
  --text-on-primary: #FFFFFF;
  --primary: #2F5B9E;      /* azul cobalto apagado */
  --primary-hover: #244A85;
  --primary-soft: #D4E0EF;
  --accent: #5C85BE;
  --accent-soft: #DEE8F3;
  --success: #4E8A5B;
  --success-soft: #DFEDE2;
  --warning: #B47830;
  --danger: #C14B4B;
}

:root[data-theme="dark"][data-palette="azul"] {
  --bg: #0F141C;
  --bg-elev: #161D28;
  --bg-sunken: #0A0E14;
  --surface: #161D28;
  --surface-hover: #1F2837;
  --border: #262F40;
  --border-strong: #3A4860;
  --text: #E2E9F3;
  --text-muted: #8CA0BC;
  --text-disabled: #4E5C73;
  --text-on-primary: #0F141C;
  --primary: #8CB0E0;
  --primary-hover: #A3C1E9;
  --primary-soft: #1E2B3E;
  --accent: #7CA2D4;
  --accent-soft: #1F2B3E;
  --success: #8AC48D;
  --success-soft: #243028;
  --warning: #E0B06B;
  --danger: #E68383;
}
```

### Paleta 4 · VERDE

Verde bosque, natural, sin ser menta pálido.

```css
:root[data-theme="light"][data-palette="verde"] {
  --bg: #F2F7F3;
  --bg-elev: #FFFFFF;
  --bg-sunken: #E4EFE6;
  --surface: #FFFFFF;
  --surface-hover: #EDF4EE;
  --border: #CFE0D3;
  --border-strong: #A8C4AE;
  --text: #1B2A1F;
  --text-muted: #516459;
  --text-disabled: #92A79A;
  --text-on-primary: #FFFFFF;
  --primary: #2E6B44;      /* verde bosque medio */
  --primary-hover: #245636;
  --primary-soft: #D3E7D9;
  --accent: #5C9B6E;
  --accent-soft: #DBEDE0;
  --success: #2E7D32;
  --success-soft: #E0EFE1;
  --warning: #B47830;
  --danger: #C14B4B;
}

:root[data-theme="dark"][data-palette="verde"] {
  --bg: #101710;
  --bg-elev: #18211A;
  --bg-sunken: #0B100B;
  --surface: #18211A;
  --surface-hover: #212D24;
  --border: #29362C;
  --border-strong: #3E5145;
  --text: #E0EDE3;
  --text-muted: #8BA694;
  --text-disabled: #4E6055;
  --text-on-primary: #101710;
  --primary: #8CC49A;
  --primary-hover: #A2D4AF;
  --primary-soft: #1F2F24;
  --accent: #7AB88A;
  --accent-soft: #1F2F24;
  --success: #6BB86E;
  --success-soft: #1E2A20;
  --warning: #E0B06B;
  --danger: #E68383;
}
```

### Actualizar el selector de paletas en `index.html`

Reemplaza las 6 miniaturas anteriores por estas 5:

```html
<div class="theme-palette-grid" role="radiogroup" aria-label="Paleta de colores">

  <button class="palette-thumb" data-palette="mono" role="radio" aria-checked="true" aria-label="Paleta Monocromo">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#2B2D31"/>
      <circle cx="18" cy="38" r="9" fill="#6B7280"/>
      <circle cx="46" cy="38" r="9" fill="#E6E8EB"/>
      <circle cx="32" cy="52" r="6" fill="#2E7D32"/>
    </svg>
    <span class="palette-name">Monocromo</span>
  </button>

  <button class="palette-thumb" data-palette="rosa" role="radio" aria-checked="false" aria-label="Paleta Rosa">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#B03E7A"/>
      <circle cx="18" cy="38" r="9" fill="#D67AA8"/>
      <circle cx="46" cy="38" r="9" fill="#F4D9E5"/>
      <circle cx="32" cy="52" r="6" fill="#4E8A5B"/>
    </svg>
    <span class="palette-name">Rosa</span>
  </button>

  <button class="palette-thumb" data-palette="morado" role="radio" aria-checked="false" aria-label="Paleta Morado">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#6A3FA8"/>
      <circle cx="18" cy="38" r="9" fill="#9268C8"/>
      <circle cx="46" cy="38" r="9" fill="#E2D4F1"/>
      <circle cx="32" cy="52" r="6" fill="#4E8A5B"/>
    </svg>
    <span class="palette-name">Morado</span>
  </button>

  <button class="palette-thumb" data-palette="azul" role="radio" aria-checked="false" aria-label="Paleta Azul">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#2F5B9E"/>
      <circle cx="18" cy="38" r="9" fill="#5C85BE"/>
      <circle cx="46" cy="38" r="9" fill="#D4E0EF"/>
      <circle cx="32" cy="52" r="6" fill="#4E8A5B"/>
    </svg>
    <span class="palette-name">Azul</span>
  </button>

  <button class="palette-thumb" data-palette="verde" role="radio" aria-checked="false" aria-label="Paleta Verde">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#2E6B44"/>
      <circle cx="18" cy="38" r="9" fill="#5C9B6E"/>
      <circle cx="46" cy="38" r="9" fill="#D3E7D9"/>
      <circle cx="32" cy="52" r="6" fill="#2E7D32"/>
    </svg>
    <span class="palette-name">Verde</span>
  </button>

</div>
```

### Actualizar la paleta default en `js/ajustes.js`

```js
// Cambiar el default de 'rosa' a 'mono'
const prefs = leerPreferencias() || { modo: 'auto', paleta: 'mono' };
```

Y en `app.js`, si hay algún seed de ajustes, cambiar:
```js
// Antes
{ clave: 'paleta', valor: 'rosa' }
// Ahora
{ clave: 'paleta', valor: 'mono' }
```

### Actualizar la lista de paletas válidas en `js/ajustes.js`

```js
const PALETAS = ['mono', 'rosa', 'morado', 'azul', 'verde'];
```

---

# PROBLEMA 3 · EN MÓVIL NO SE VE UN MENÚ DESPLEGABLE

## Diagnóstico

En móvil la app no muestra un botón claro (☰ hamburguesa) para abrir el menú.
La única forma de navegar es la bottom-nav, que puede no ser visible o
no queda claro. Falta un menú lateral desplegable.

## Solución · Header con hamburguesa + Drawer lateral

### HTML · Header mejorado

```html
<header class="app-header">
  <button class="menu-toggle" aria-label="Abrir menú" aria-expanded="false"
          aria-controls="main-drawer" data-action="toggle-menu">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>

  <div class="brand">
    <span class="brand-logo" aria-hidden="true">🐺</span>
    <span class="brand-name">Gym Wolf</span>
  </div>

  <button class="btn btn-icon" data-action="iniciar-dia" aria-label="Iniciar día">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  </button>
</header>
```

### HTML · Drawer lateral

```html
<aside id="main-drawer" class="drawer" aria-hidden="true">
  <div class="drawer-backdrop" data-action="toggle-menu"></div>
  <nav class="drawer-panel" role="navigation" aria-label="Menú principal">
    <header class="drawer-header">
      <span class="brand-name">Gym Wolf</span>
      <button class="drawer-close" aria-label="Cerrar menú" data-action="toggle-menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </header>

    <ul class="drawer-nav">
      <li><a href="#/inicio" data-nav><span class="nav-icon">🏠</span> Inicio</a></li>
      <li><a href="#/hoy" data-nav><span class="nav-icon">💪</span> Hoy</a></li>
      <li><a href="#/rutina" data-nav><span class="nav-icon">📋</span> Rutina</a></li>
      <li><a href="#/historial" data-nav><span class="nav-icon">📅</span> Historial</a></li>
      <li><a href="#/medidas" data-nav><span class="nav-icon">📏</span> Medidas</a></li>
      <li><a href="#/progreso" data-nav><span class="nav-icon">📈</span> Progreso</a></li>
      <li><a href="#/ajustes" data-nav><span class="nav-icon">⚙</span> Ajustes</a></li>
    </ul>

    <footer class="drawer-footer">
      <p class="text-muted">Gym Wolf · v1.0</p>
    </footer>
  </nav>
</aside>
```

### CSS del header, menú y drawer

```css
/* ============================================
   HEADER · fijo arriba con hamburguesa
   ============================================ */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  height: 60px;
  padding: 0 var(--sp-4);
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
}

.menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: var(--r-md);
  color: var(--text);
  cursor: pointer;
  transition: background var(--t-fast);
}
.menu-toggle:hover { background: var(--surface-hover); }
.menu-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.brand { display: flex; align-items: center; gap: var(--sp-2); }
.brand-logo { font-size: 20px; }
.brand-name {
  font-size: var(--fs-base);
  font-weight: 700;
  color: var(--text);
}

.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--r-md);
  background: var(--primary);
  color: var(--text-on-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

/* En desktop: esconder hamburguesa (sidebar se ve siempre) */
@media (min-width: 768px) {
  .menu-toggle { display: none; }
}

/* ============================================
   DRAWER · menú lateral deslizable
   ============================================ */
.drawer {
  position: fixed;
  inset: 0;
  z-index: 500;
  pointer-events: none;
  visibility: hidden;
}
.drawer[aria-hidden="false"] {
  pointer-events: auto;
  visibility: visible;
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity var(--t-base);
}
.drawer[aria-hidden="false"] .drawer-backdrop {
  opacity: 1;
}

.drawer-panel {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: min(78%, 320px);
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  transform: translateX(-100%);
  transition: transform var(--t-base) cubic-bezier(.2, .9, .3, 1);
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  overflow-y: auto;
}
.drawer[aria-hidden="false"] .drawer-panel {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
}
.drawer-close {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--r-md);
  color: var(--text-muted);
  cursor: pointer;
}
.drawer-close:hover { background: var(--surface-hover); color: var(--text); }

.drawer-nav {
  list-style: none;
  padding: var(--sp-3);
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.drawer-nav a {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-md);
  color: var(--text);
  text-decoration: none;
  font-size: var(--fs-base);
  font-weight: 600;
  transition: background var(--t-fast), color var(--t-fast);
}
.drawer-nav a:hover { background: var(--surface-hover); }
.drawer-nav a[aria-current="page"] {
  background: var(--primary-soft);
  color: var(--primary);
}
.nav-icon {
  display: inline-flex;
  width: 20px;
  justify-content: center;
  font-size: 16px;
}

.drawer-footer {
  padding: var(--sp-4) var(--sp-5);
  border-top: 1px solid var(--border);
  text-align: center;
}
```

### JS · Apertura/cierre del drawer en `js/ui.js`

```js
export function toggleDrawer(abrir) {
  const drawer = document.getElementById('main-drawer');
  const toggle = document.querySelector('.menu-toggle');
  if (!drawer) return;

  const estadoActual = drawer.getAttribute('aria-hidden') === 'false';
  const estadoNuevo = typeof abrir === 'boolean' ? abrir : !estadoActual;

  drawer.setAttribute('aria-hidden', String(!estadoNuevo));
  if (toggle) toggle.setAttribute('aria-expanded', String(estadoNuevo));
  document.body.style.overflow = estadoNuevo ? 'hidden' : '';
}

export function inicializarDrawer() {
  document.querySelectorAll('[data-action="toggle-menu"]').forEach(el => {
    el.addEventListener('click', () => toggleDrawer());
  });

  // Cerrar al navegar
  document.querySelectorAll('#main-drawer a[data-nav]').forEach(a => {
    a.addEventListener('click', () => toggleDrawer(false));
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleDrawer(false);
  });
}
```

### Regla importante · Bottom-nav también

Mantener la **bottom-nav en móvil** como segundo acceso rápido (además del
drawer). Es lo que esperan los usuarios de apps nativas.

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  display: flex;
  justify-content: space-around;
  padding: var(--sp-2) 0;
  padding-bottom: calc(var(--sp-2) + env(safe-area-inset-bottom, 0px));
  background: var(--bg-elev);
  border-top: 1px solid var(--border);
}
@media (min-width: 768px) {
  .bottom-nav { display: none; }
}
```

**Móvil:** header con ☰ + bottom-nav con 5 iconos + drawer completo.
**Escritorio:** sidebar siempre visible, sin hamburguesa ni bottom-nav.

---

# CHECKLIST DE PRUEBAS EN MÓVIL

Ejecutar **estas pruebas exactas** en un celular real (Android e iPhone)
antes de dar por terminada la UI.

## A) Toasts

- [ ] Abrir la app → pulsar cualquier botón que dispare un toast
- [ ] El toast aparece **en la parte SUPERIOR** de la pantalla
- [ ] No hay que hacer **scroll** para verlo
- [ ] El toast se ve aunque la página esté scrolleada hasta abajo
- [ ] Se apilan correctamente si salen 2-3 a la vez
- [ ] Desaparecen solos a los ~3 segundos
- [ ] Al hacer click desaparecen antes
- [ ] En iPhone, no los tapa el notch (usa `env(safe-area-inset-top)`)

## B) Paletas de color

- [ ] En Ajustes → Apariencia → se ven 5 paletas: Monocromo, Rosa, Morado, Azul, Verde
- [ ] La default es **Monocromo** (no salmón)
- [ ] Al pulsar cada una → toda la app cambia al instante
- [ ] Los botones primarios NO usan tonos salmón en ninguna paleta
- [ ] Cada paleta tiene versión clara y oscura funcional
- [ ] El contraste de texto sobre botón es legible en todas
- [ ] Al recargar la app se mantiene la paleta elegida

## C) Menú móvil

- [ ] En móvil se ve el botón **☰** arriba a la izquierda
- [ ] Pulsarlo → se desliza el menú lateral desde la izquierda
- [ ] El menú cubre ~78% del ancho (no todo, para ver el backdrop)
- [ ] Se puede cerrar tocando el fondo oscuro
- [ ] Se puede cerrar con la ✕ arriba del drawer
- [ ] Se puede cerrar con swipe hacia la izquierda (opcional)
- [ ] Al pulsar una opción → navega y cierra el drawer
- [ ] El ítem activo se ve resaltado en el drawer
- [ ] La **bottom-nav** también se ve abajo con 5 iconos
- [ ] Ambos menús coexisten sin solaparse con el contenido
- [ ] En escritorio la hamburguesa **NO** aparece (sidebar fijo)
- [ ] `aria-expanded` cambia correctamente al abrir/cerrar
- [ ] Se puede abrir/cerrar con teclado (Tab + Enter + Escape)

## D) Navegación general

- [ ] El header permanece **sticky** al hacer scroll
- [ ] La bottom-nav permanece **fija** abajo al hacer scroll
- [ ] El contenido principal tiene **padding-bottom** suficiente para no
      quedar tapado por la bottom-nav (mínimo 72px + safe-area)
- [ ] Al cambiar de módulo el scroll vuelve arriba automáticamente

## E) Responsive real

- [ ] Probar en **iPhone SE (375px)** → sin overflow horizontal
- [ ] Probar en **iPhone 14 Pro Max (430px)** → no tapa el notch
- [ ] Probar en **Android pequeño (360px)** → botones legibles
- [ ] Rotar a **landscape** → layout se adapta sin romperse
- [ ] En **iPad / tablet (768-1024px)** → sidebar visible, sin hamburguesa
- [ ] En **desktop (>=1280px)** → contenido centrado con max-width

## F) Offline

- [ ] Abrir la app → activar modo avión → recargar → sigue funcionando
- [ ] Registrar una sesión offline → se guarda correctamente
- [ ] Desactivar modo avión → los datos siguen ahí
- [ ] El service worker aparece en DevTools → Application → Service Workers
- [ ] El manifest se carga → DevTools → Application → Manifest

## G) Accesibilidad mínima

- [ ] Todos los botones tienen `aria-label` o texto visible
- [ ] El foco del teclado es visible (`outline`)
- [ ] Se puede navegar todo con Tab (en escritorio)
- [ ] Se puede cerrar el drawer con Escape
- [ ] Los toasts tienen `role="status"` y `aria-live="polite"`

## H) Instalación como PWA

- [ ] **Android Chrome:** aparece "Añadir a pantalla de inicio" en el menú
- [ ] **iPhone Safari:** aparece "Añadir a pantalla de inicio" en Compartir
- [ ] Al abrir desde el ícono → se ve sin barra de navegador
- [ ] El ícono tiene el logo correcto (192 y 512)
- [ ] El tema (color de barra del sistema) coincide con `--primary`

---

# ORDEN DE APLICACIÓN

Ejecuta en este orden exacto para no romper nada:

1. **Toasts** → mover `#toast-container` al inicio del `<body>` y aplicar el CSS
2. **Toasts JS** → reemplazar la función `toast()` en `ui.js`
3. **Paletas** → eliminar "Arena Cálida" y "Medianoche", agregar "Monocromo"
4. **Paletas CSS** → reemplazar los 5 bloques `[data-palette="..."]`
5. **Paletas HTML** → reemplazar las miniaturas SVG en `#ajustes`
6. **Paletas JS** → cambiar default a `mono` y actualizar `PALETAS`
7. **Header** → agregar botón hamburguesa y estructura nueva
8. **Drawer** → agregar HTML del drawer lateral
9. **Drawer CSS** → agregar estilos del header + drawer + bottom-nav
10. **Drawer JS** → `toggleDrawer` e `inicializarDrawer` en `ui.js`
11. **Conectar** `inicializarDrawer()` en `app.js` al arrancar
12. **Probar** con el checklist de pruebas móviles (secciones A–H)

---

# REGLA FINAL · NO ROMPER LO QUE FUNCIONA

- Si algo ya funciona (ej. historial, medidas, exportar), **no lo toques**.
- Aplica los cambios **incrementales** y prueba cada uno antes del siguiente.
- Si Copilot propone refactorizar todo de una pasada, **rechaza** y pide
  cambios archivo por archivo.

# FIN DEL PROMPT
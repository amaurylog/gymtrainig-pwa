function iconPath(name) {
  const icons = {
    home: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9z',
    today: 'M7 2v3M17 2v3M3 8h18M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
    routine: 'M9 11h6M9 15h6M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2z',
    history: 'M3 3v5h5M21 21v-5h-5M4.93 19.07A9 9 0 1 1 19.07 4.93',
    measures: 'M12 3v18M5 7h14M5 12h14M5 17h14',
    progress: 'M4 19V5m4 14v-8m4 8V9m4 10V4m4 15v-6',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 4a7.97 7.97 0 0 0-.25-1.98l2.08-1.62-2-3.46-2.48 1a8.15 8.15 0 0 0-1.72-1l-.38-2.64h-4l-.38 2.64a8.15 8.15 0 0 0-1.72 1l-2.48-1-2 3.46 2.08 1.62A7.97 7.97 0 0 0 3.06 12c0 .67.09 1.31.25 1.98l-2.08 1.62 2 3.46 2.48-1c.53.39 1.1.73 1.72 1l.38 2.64h4l.38-2.64c.62-.27 1.19-.61 1.72-1l2.48 1 2-3.46-2.08-1.62c.16-.67.25-1.31.25-1.98z',
    start: 'M8 5v14l11-7z',
    stop: 'M6 6h12v12H6z',
    plus: 'M12 5v14M5 12h14',
    menu: 'M4 6h16M4 12h16M4 18h16',
    trash: 'M3 6h18M8 6V4h8v2m-7 0v12m6-12v12M6 6l1 14h10l1-14',
    edit: 'M4 20h4L19 9l-4-4L4 16v4zM13 6l4 4',
    grip: 'M9 5h2M15 5h2M9 11h2M15 11h2M9 17h2M15 17h2',
    download: 'M12 3v10m0 0l4-4m-4 4l-4-4M4 20h16',
    upload: 'M12 21V11m0 0l4 4m-4-4l-4 4M4 5h16',
    close: 'M6 6l12 12M18 6L6 18',
    check: 'M5 13l4 4L19 7',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
    sun: 'M12 4V2M12 22v-2M4.9 4.9l-1.4-1.4M20.5 20.5l-1.4-1.4M4 12H2m20 0h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    search: 'M21 21l-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z'
  };
  return icons[name] || icons.home;
}

export function capitalize(str) {
  if (!str) return '';
  const text = String(str).trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

export function tituloEspanol(str) {
  if (!str) return '';
  const conectores = ['de', 'con', 'en', 'y', 'o', 'a', 'del', 'la', 'el', 'al', 'por', 'para'];
  return String(str)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palabra, index) => {
      if (index === 0) return palabra.charAt(0).toUpperCase() + palabra.slice(1);
      if (conectores.includes(palabra)) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
}

export function frase(str) {
  if (!str) return '';
  const text = capitalize(String(str).trim());
  return text.endsWith('.') ? text : `${text}.`;
}

export function icon(name, label = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><title>${label || name}</title><path d="${iconPath(name)}"></path></svg>`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatDateShort(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
}

export function formatDateLong(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' }).format(date);
}

export function formatTime(value) {
  if (!value) return '—';
  return value.slice(0, 5);
}

export function formatMinutes(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '—';
  const total = Number(minutes);
  if (total < 60) return `${Math.max(0, Math.round(total))} min`;
  const hours = Math.floor(total / 60);
  const rest = Math.round(total % 60);
  return `${hours} h ${rest.toString().padStart(2, '0')} min`;
}

export function formatNumber(value, decimals = 1) {
  if (value == null || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return '—';
  const fixed = Number.isInteger(number) ? number.toFixed(0) : number.toFixed(decimals);
  return fixed.replace(/\.0+$/, '');
}

export function formatWeight(value, unit = 'kg') {
  if (value == null || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return '—';
  return `${formatNumber(number, 1)} ${unit}`;
}

export function cssVar(name, fallback = '') {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function colorWithAlpha(color, alpha) {
  const value = String(color || '').trim();
  if (!value) return `rgba(0, 0, 0, ${alpha})`;

  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const full = hex.length === 3 ? hex.split('').map((character) => character + character).join('') : hex;
    const red = Number.parseInt(full.slice(0, 2), 16);
    const green = Number.parseInt(full.slice(2, 4), 16);
    const blue = Number.parseInt(full.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (match) {
    const parts = match[1].split(',').map((item) => item.trim());
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
  }

  return value;
}

export function weekdayNameFromKey(key) {
  const map = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
    descanso: 'Descanso'
  };
  return map[key] || key || '—';
}

export function debounce(fn, wait = 400) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}

function getDrawerElements() {
  return {
    drawer: document.getElementById('main-drawer'),
    toggle: document.querySelector('.menu-toggle')
  };
}

export function toggleDrawer(abrir) {
  const { drawer, toggle } = getDrawerElements();
  if (!drawer) return;

  const isOpen = drawer.getAttribute('aria-hidden') === 'false';
  const shouldOpen = typeof abrir === 'boolean' ? abrir : !isOpen;

  drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  toggle?.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  document.body.style.overflow = shouldOpen ? 'hidden' : '';
}

export function inicializarDrawer() {
  const { drawer, toggle } = getDrawerElements();
  if (!drawer || drawer.dataset.bound === 'true') return;
  drawer.dataset.bound = 'true';

  document.querySelectorAll('[data-action="toggle-menu"]').forEach((element) => {
    element.addEventListener('click', () => toggleDrawer());
  });

  drawer.querySelectorAll('a[data-nav]').forEach((link) => {
    link.addEventListener('click', () => toggleDrawer(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toggleDrawer(false);
  });

  toggle?.setAttribute('aria-expanded', 'false');
  drawer.setAttribute('aria-hidden', 'true');
}

function ensureToastRoot() {
  return document.getElementById('toast-container');
}

export function toast(...args) {
  const root = ensureToastRoot();
  if (!root) return;

  const allowedTypes = new Set(['info', 'success', 'error', 'warning']);
  let title = '';
  let message = '';
  let type = 'info';
  let timeout = 2800;

  if (args.length >= 3 && allowedTypes.has(String(args[2]))) {
    title = args[0] ?? '';
    message = args[1] ?? '';
    type = String(args[2]);
    timeout = typeof args[3] === 'number' ? args[3] : 2800;
  } else {
    message = args[0] ?? '';
    type = allowedTypes.has(String(args[1])) ? String(args[1]) : 'info';
    timeout = typeof args[2] === 'number' ? args[2] : 2800;
  }

  const node = document.createElement('div');
  node.className = `toast toast--${type}`;
  node.setAttribute('role', 'status');
  node.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
    <div class="toast-body">
      ${title ? `<p class="toast-title">${escapeHtml(capitalize(title))}</p>` : ''}
      ${message ? `<p class="toast-message">${escapeHtml(message)}</p>` : ''}
    </div>
  `;
  root.appendChild(node);

  while (root.children.length > 3) {
    root.firstElementChild?.remove();
  }

  const dismiss = () => {
    node.classList.add('toast--leaving');
    node.style.transition = 'opacity 180ms ease, transform 180ms ease';
    node.style.opacity = '0';
    node.style.transform = 'translateY(-6px)';
    window.setTimeout(() => node.remove(), 180);
  };

  const timer = window.setTimeout(dismiss, timeout);
  node.addEventListener('click', () => {
    window.clearTimeout(timer);
    dismiss();
  });
}

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

  const otrosAbiertos = document.querySelectorAll('.modal:not([hidden])');
  if (otrosAbiertos.length === 0) {
    document.body.classList.remove('modal-abierto');
  }
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  const otrosAbiertos = document.querySelectorAll('.modal:not([hidden])');
  if (otrosAbiertos.length === 0) {
    document.body.classList.remove('modal-abierto');
  }
}

export function showModal({ title = '', content = '', footer = '', maxWidth = 860 } = {}) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal-backdrop" role="presentation" data-close-modal></div>
      <div class="modal-panel" style="max-width:min(${maxWidth}px, calc(100vw - 32px));">
        <div class="modal-header">
          <div class="modal-title-group">
            <h2>${escapeHtml(title)}</h2>
          </div>
          <button class="modal-close" type="button" data-close-modal aria-label="Cerrar">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    </div>
  `;
  document.body.classList.add('modal-abierto');
  root.querySelectorAll('[data-close-modal]').forEach((node) => {
    node.addEventListener('click', closeModal);
  });

  setTimeout(() => {
    const modal = root.querySelector('.modal');
    const primerInput = modal?.querySelector('input:not([type="hidden"]), button:not(.modal-close)');
    primerInput?.focus();
  }, 0);

  document.addEventListener('keydown', handleEscape, { once: true });
}

function handleEscape(event) {
  if (event.key === 'Escape') closeModal();
}

export function confirmDialog({
  title = 'Confirmar acción',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  danger = true,
  requireText = ''
} = {}) {
  return new Promise((resolve) => {
    const fieldId = `confirm_${Date.now()}`;
    const inputHtml = requireText
      ? `<div class="stack"><label class="field-label" for="${fieldId}">Escribe ${escapeHtml(requireText)} para continuar</label><input id="${fieldId}" class="input" type="text" autocomplete="off" /></div>`
      : '';
    const footer = `
      <button class="btn light" type="button" data-confirm-cancel>${escapeHtml(cancelText)}</button>
      <button class="btn ${danger ? 'danger' : ''}" type="button" data-confirm-ok>${escapeHtml(confirmText)}</button>
    `;
    showModal({
      title,
      content: `<div class="stack"><p class="page-lead" style="margin:0;">${escapeHtml(message)}</p>${inputHtml}</div>`,
      footer,
      maxWidth: 520
    });
    const root = document.getElementById('modal-root');
    const input = root?.querySelector(`#${fieldId}`);
    const ok = root?.querySelector('[data-confirm-ok]');
    const cancel = root?.querySelector('[data-confirm-cancel]');
    const accept = () => {
      if (requireText && input && input.value.trim().toUpperCase() !== requireText.toUpperCase()) {
        toast('Texto incorrecto', `Debes escribir ${requireText} exactamente.` , 'error');
        return;
      }
      closeModal();
      resolve(true);
    };
    const reject = () => {
      closeModal();
      resolve(false);
    };
    ok?.addEventListener('click', accept);
    cancel?.addEventListener('click', reject);
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') accept();
    });
  });
}

export function promptDialog({
  title = 'Ingresar valor',
  message = 'Escribe un valor para continuar.',
  placeholder = '',
  defaultValue = '',
  confirmText = 'Guardar',
  cancelText = 'Cancelar'
} = {}) {
  return new Promise((resolve) => {
    const fieldId = `prompt_${Date.now()}`;
    showModal({
      title,
      content: `
        <div class="stack">
          <p class="page-lead" style="margin:0;">${escapeHtml(message)}</p>
          <label class="sr-only" for="${fieldId}">${escapeHtml(title)}</label>
          <input id="${fieldId}" class="input" type="text" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
        </div>
      `,
      footer: `
        <button class="btn light" type="button" data-prompt-cancel>${escapeHtml(cancelText)}</button>
        <button class="btn" type="button" data-prompt-ok>${escapeHtml(confirmText)}</button>
      `,
      maxWidth: 520
    });

    const root = document.getElementById('modal-root');
    const input = root?.querySelector(`#${fieldId}`);
    const ok = root?.querySelector('[data-prompt-ok]');
    const cancel = root?.querySelector('[data-prompt-cancel]');

    const accept = () => {
      const value = input?.value?.trim() || '';
      closeModal();
      resolve(value);
    };

    const reject = () => {
      closeModal();
      resolve(null);
    };

    ok?.addEventListener('click', accept);
    cancel?.addEventListener('click', reject);
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') accept();
      if (event.key === 'Escape') reject();
    });
    window.setTimeout(() => input?.focus(), 0);
  });
}

export function downloadBlob(content, filename, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function emptyState({ iconName = 'home', title = 'Sin datos', message = 'Aún no hay información para mostrar.' } = {}) {
  return `
    <div class="empty-state">
      <div class="kpi-badge success" aria-hidden="true">${icon(iconName)}</div>
      <div>
        <h3 class="page-title" style="font-size:1.2rem;margin:0;">${escapeHtml(title)}</h3>
        <p class="page-lead">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

export function setBodyTheme(theme) {
  applyTheme(theme, document.documentElement.dataset.palette || 'mono');
}

export function applyTheme(mode = 'auto', palette = 'mono') {
  const allowedPalettes = new Set(['mono', 'rosa', 'morado', 'azul', 'verde']);
  const resolved = mode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  const resolvedPalette = allowedPalettes.has(palette) ? palette : 'mono';
  document.body.dataset.theme = resolved;
  document.documentElement.dataset.theme = resolved;
  document.body.dataset.palette = resolvedPalette;
  document.documentElement.dataset.palette = resolvedPalette;
}

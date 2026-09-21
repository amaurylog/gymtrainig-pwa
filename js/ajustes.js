import { getSettingsMap, setSetting, db } from './db.js';
import { applyTheme, confirmDialog, escapeHtml, icon, toast } from './ui.js';
import { downloadBackupJsonFile, downloadWorkbookFile, downloadSessionsCsvFile, importBackupFromFile } from './exportar.js';

const PALETTES = [
  { id: 'mono', name: 'Monocromo' },
  { id: 'rosa', name: 'Rosa Suave' },
  { id: 'morado', name: 'Morado' },
  { id: 'azul', name: 'Azul' },
  { id: 'verde', name: 'Verde' }
];

function paletteThumb(palette, checked) {
  const svgMap = {
    mono: ['#2B2D31', '#6B7280', '#E6E8EB', '#2E7D32'],
    rosa: ['#A86276', '#B8894A', '#F1DDE3', '#5B8C5A'],
    morado: ['#6A3FA8', '#9268C8', '#E2D4F1', '#5B8C5A'],
    azul: ['#2F5B9E', '#5C85BE', '#D4E0EF', '#5B8C5A'],
    verde: ['#2E6B44', '#5C9B6E', '#D3E7D9', '#2E7D32']
  };
  const [c1, c2, c3, c4] = svgMap[palette.id];
  return `
    <button class="palette-thumb" data-palette="${palette.id}" role="radio" aria-checked="${checked ? 'true' : 'false'}" aria-label="Paleta ${escapeHtml(palette.name)}">
      <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
        <circle cx="32" cy="14" r="9" fill="${c1}" />
        <circle cx="18" cy="38" r="9" fill="${c2}" />
        <circle cx="46" cy="38" r="9" fill="${c3}" />
        <circle cx="32" cy="52" r="6" fill="${c4}" />
      </svg>
      <span class="palette-name">${escapeHtml(palette.name)}</span>
    </button>
  `;
}

function settingsMarkup(settings) {
  const tema = settings.tema || 'auto';
  const paleta = PALETTES.some((item) => item.id === settings.paleta) ? settings.paleta : 'mono';
  const unidad = settings.unidad || 'kg';
  return `
    <section class="page-header page-enter">
      <div>
        <h1 class="page-title">Ajustes</h1>
        <p class="page-lead">Tema, paleta, unidades y exportación de datos.</p>
      </div>
    </section>

    <section class="card page-enter stack">
      <div class="card-head">
        <div>
          <h2 class="card-title">Apariencia</h2>
          <p class="page-lead">Elige un modo y una paleta que descansan la vista.</p>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Modo de tema</label>
        <div class="theme-mode-group" role="radiogroup" aria-label="Modo de tema">
          <button class="theme-mode-btn" data-mode="light" role="radio" aria-checked="${tema === 'light' ? 'true' : 'false'}"><span aria-hidden="true">☀</span> Claro</button>
          <button class="theme-mode-btn" data-mode="dark" role="radio" aria-checked="${tema === 'dark' ? 'true' : 'false'}"><span aria-hidden="true">🌙</span> Oscuro</button>
          <button class="theme-mode-btn" data-mode="auto" role="radio" aria-checked="${tema === 'auto' ? 'true' : 'false'}"><span aria-hidden="true">⚙</span> Auto</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Paleta de colores</label>
        <div class="theme-palette-grid" role="radiogroup" aria-label="Seleccionar paleta de colores">
          ${PALETTES.map((palette) => paletteThumb(palette, palette.id === paleta)).join('')}
        </div>
      </div>
    </section>

    <section class="card page-enter stack">
      <h2 class="card-title">Unidades</h2>
      <div class="theme-mode-group" role="radiogroup" aria-label="Unidad de peso">
        <button class="theme-mode-btn" data-unit="kg" role="radio" aria-checked="${unidad === 'kg' ? 'true' : 'false'}">Kilogramos (kg)</button>
        <button class="theme-mode-btn" data-unit="lb" role="radio" aria-checked="${unidad === 'lb' ? 'true' : 'false'}">Libras (lb)</button>
      </div>
    </section>

    <section class="card page-enter stack">
      <h2 class="card-title">Datos</h2>
      <div class="btn-list">
        <button class="btn secondary" data-action="export-csv">${icon('download')} Exportar CSV de sesiones</button>
        <button class="btn secondary" data-action="export-xlsx">${icon('download')} Exportar Excel (.xlsx)</button>
        <button class="btn secondary" data-action="export-json">${icon('download')} Exportar Backup JSON</button>
        <button class="btn secondary" data-action="import-json">${icon('upload')} Importar Backup JSON</button>
      </div>
      <div class="danger-zone">
        <h3 class="danger-title">Zona de peligro</h3>
        <p class="danger-text">Esta acción borra todas las sesiones, medidas, rutinas y ajustes locales.</p>
        <button class="btn danger" data-action="wipe-data">${icon('trash')} Borrar todos los datos</button>
      </div>
      <input id="import-json-input" class="sr-only" type="file" accept="application/json,.json" />
    </section>

    <section class="card page-enter stack">
      <h2 class="card-title">Acerca de</h2>
      <p class="text-muted">Gym Wolf · Rutina 5 Días</p>
      <p class="text-muted">Versión 1.0 · Funciona sin conexión</p>
    </section>
  `;
}

export async function renderAjustesPage(view, context = {}) {
  const settings = await getSettingsMap();
  view.innerHTML = settingsMarkup(settings);
  inicializarAjustes(view, context);
}

export function inicializarAjustes(view = document.getElementById('view'), context = {}) {
  if (!view) return;
  const settings = {
    tema: 'auto',
    paleta: 'mono',
    unidad: 'kg'
  };

  getSettingsMap().then((stored) => {
    settings.tema = stored.tema || settings.tema;
    settings.paleta = stored.paleta || settings.paleta;
    settings.unidad = stored.unidad || settings.unidad;
    applyTheme(settings.tema, settings.paleta);
  });

  view.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', async () => {
      const mode = button.getAttribute('data-mode');
      settings.tema = mode;
      await setSetting('tema', mode);
      applyTheme(mode, settings.paleta);
      toast(`Modo ${button.textContent.trim()} activado`, '', 'success');
      await context.refresh?.();
    });
  });

  view.querySelectorAll('[data-palette]').forEach((button) => {
    button.addEventListener('click', async () => {
      const palette = button.getAttribute('data-palette');
      settings.paleta = palette;
      await setSetting('paleta', palette);
      applyTheme(settings.tema, palette);
      toast(`Paleta ${button.textContent.trim()} aplicada`, '', 'success');
      await context.refresh?.();
    });
  });

  view.querySelectorAll('[data-unit]').forEach((button) => {
    button.addEventListener('click', async () => {
      const unit = button.getAttribute('data-unit');
      settings.unidad = unit;
      await setSetting('unidad', unit);
      toast(`Unidad ${unit.toUpperCase()} guardada`, '', 'success');
      await context.refresh?.();
    });
  });

  view.querySelector('[data-action="export-csv"]')?.addEventListener('click', downloadSessionsCsvFile);
  view.querySelector('[data-action="export-xlsx"]')?.addEventListener('click', downloadWorkbookFile);
  view.querySelector('[data-action="export-json"]')?.addEventListener('click', downloadBackupJsonFile);
  view.querySelector('[data-action="import-json"]')?.addEventListener('click', () => {
    view.querySelector('#import-json-input')?.click();
  });
  view.querySelector('#import-json-input')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const accepted = await confirmDialog({
      title: 'Importar backup',
      message: 'Esto reemplazará los datos actuales por el contenido del JSON.',
      confirmText: 'Importar',
      danger: true
    });
    if (!accepted) return;
    try {
      await importBackupFromFile(file);
      toast('Respaldo importado', 'Los datos se reemplazaron correctamente.', 'success');
      await context.refresh?.();
    } catch (error) {
      toast('No se pudo importar', error.message || 'El archivo no es válido.', 'error');
    } finally {
      event.target.value = '';
    }
  });

  view.querySelector('[data-action="wipe-data"]')?.addEventListener('click', async () => {
    const accepted = await confirmDialog({
      title: 'Borrar todos los datos',
      message: 'Escribe BORRAR para confirmar. Esta acción es irreversible.',
      confirmText: 'Borrar',
      danger: true,
      requireText: 'BORRAR'
    });
    if (!accepted) return;
    await db.sesiones.clear();
    await db.medidas.clear();
    await db.rutinas.clear();
    await db.ajustes.clear();
    toast('Todos los datos fueron eliminados', '', 'success');
    window.location.reload();
  });
}

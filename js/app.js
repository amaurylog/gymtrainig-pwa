import { createDraftSessionForToday, finishSession, getActiveRoutine, getSetting, getSettingsMap, getTodaySession, initDb, listMeasures, listSessions, setActiveRoutine, setSetting, clearAllData } from './db.js';
import { colorWithAlpha, cssVar, icon, escapeHtml, emptyState, formatDateLong, formatMinutes, formatNumber, formatTime, formatWeight, applyTheme, toast, confirmDialog, inicializarDrawer, toggleDrawer } from './ui.js';
import { downloadBackupJsonFile, downloadMeasuresCsvFile, downloadSessionsCsvFile, downloadWorkbookFile, importBackupFromFile } from './exportar.js';
import { renderRoutinePage } from './rutinas.js';
import { renderTodayPage, startTodayFlow } from './sesion.js';
import { renderMeasuresPage } from './medidas.js';
import { renderHistoryPage } from './historial.js';
import { renderProgressPage, destruirGraficos as destruirGraficosProgreso } from './progreso.js';
import { inicializarAjustes, renderAjustesPage } from './ajustes.js';
import { inicializarModalSerie } from './serie-modal.js';

const ROUTES = {
  inicio: 'inicio',
  hoy: 'hoy',
  rutina: 'rutina',
  historial: 'historial',
  medidas: 'medidas',
  progreso: 'progreso',
  ajustes: 'ajustes'
};

const NAV_ITEMS = [
  { route: 'inicio', label: 'Inicio', icon: 'home' },
  { route: 'hoy', label: 'Hoy', icon: 'today' },
  { route: 'rutina', label: 'Rutina', icon: 'routine' },
  { route: 'historial', label: 'Historial', icon: 'history' },
  { route: 'medidas', label: 'Medidas', icon: 'measures' },
  { route: 'progreso', label: 'Progreso', icon: 'progress' }
];

const state = {
  route: 'inicio',
  theme: 'auto',
  palette: 'mono',
  unit: 'kg',
  dashboardChart: null,
  mediaQuery: window.matchMedia('(prefers-color-scheme: dark)')
};

function todayRoute() {
  return location.hash.replace(/^#\/?/, '').trim() || 'inicio';
}

function navigate(route) {
  location.hash = `#/${route}`;
}

function routeTitle(route) {
  const titles = {
    inicio: 'Inicio',
    hoy: 'Hoy',
    rutina: 'Rutina',
    historial: 'Historial',
    medidas: 'Medidas',
    progreso: 'Progreso',
    ajustes: 'Ajustes'
  };
  return titles[route] || 'Gym Wolf';
}

function navMarkup(mode = 'bottom') {
  return NAV_ITEMS.map((item) => `
    <a class="nav-link" href="#/${item.route}" data-route="${item.route}" aria-label="Ir a ${escapeHtml(item.label)}">
      ${icon(item.icon, item.label)}
      <span class="label">${escapeHtml(item.label)}</span>
    </a>
  `).join('');
}

function drawerMarkup() {
  return `
    <aside id="main-drawer" class="drawer" aria-hidden="true">
      <div class="drawer-backdrop" data-action="toggle-menu"></div>
      <nav class="drawer-panel" role="navigation" aria-label="Menú principal">
        <header class="drawer-header">
          <span class="brand-name">Gym Wolf</span>
          <button class="drawer-close" aria-label="Cerrar menú" data-action="toggle-menu" type="button">
            ${icon('close')}
          </button>
        </header>
        <ul class="drawer-nav">
          <li><a href="#/inicio" data-nav data-route="inicio"><span class="nav-icon">🏠</span> Inicio</a></li>
          <li><a href="#/hoy" data-nav data-route="hoy"><span class="nav-icon">💪</span> Hoy</a></li>
          <li><a href="#/rutina" data-nav data-route="rutina"><span class="nav-icon">📋</span> Rutina</a></li>
          <li><a href="#/historial" data-nav data-route="historial"><span class="nav-icon">📅</span> Historial</a></li>
          <li><a href="#/medidas" data-nav data-route="medidas"><span class="nav-icon">📏</span> Medidas</a></li>
          <li><a href="#/progreso" data-nav data-route="progreso"><span class="nav-icon">📈</span> Progreso</a></li>
          <li><a href="#/ajustes" data-nav data-route="ajustes"><span class="nav-icon">⚙</span> Ajustes</a></li>
        </ul>
        <footer class="drawer-footer">
          <p class="text-muted">Gym Wolf · v1.0</p>
        </footer>
      </nav>
    </aside>
  `;
}

function shellMarkup() {
  return `
    <div class="shell">
      <header class="topbar app-header">
        <button class="menu-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="main-drawer" data-action="toggle-menu" type="button">
          ${icon('menu')}
        </button>
        <div class="brand">
          <div class="brand-mark">GW</div>
          <div class="brand-meta">
            <div class="brand-title">Gym Wolf</div>
            <div class="brand-subtitle" id="chrome-subtitle">Preparando datos...</div>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="chip" id="chrome-date" aria-live="polite"></div>
          <button class="btn" id="global-action" type="button">${icon('start')} Iniciar día</button>
          <button class="icon-btn" id="settings-btn" type="button" aria-label="Abrir ajustes">${icon('settings')}</button>
        </div>
      </header>
      ${drawerMarkup()}
      <div class="layout">
        <aside class="sidebar">
          <nav class="stack" aria-label="Navegación principal">${navMarkup('side')}</nav>
          <footer class="sidebar-footer">
            <div class="rutina-activa-info">
              <span class="rutina-activa-label">Rutina activa</span>
              <span class="rutina-activa-nombre" id="sidebar-routine">Gym Wolf 5 Días</span>
            </div>
            <div class="rutina-activa-session" id="sidebar-session">Sesión lista para hoy</div>
          </footer>
        </aside>
        <main class="main">
          <div id="view" class="page"></div>
        </main>
      </div>
      <nav class="nav-bottom" aria-label="Navegación secundaria">${navMarkup('bottom')}</nav>
    </div>
  `;
}

function setActiveNav(route) {
  document.querySelectorAll('[data-route]').forEach((item) => {
    const active = item.getAttribute('data-route') === route;
    item.classList.toggle('active', active);
    item.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function destroyDashboardChart() {
  if (state.dashboardChart) {
    state.dashboardChart.destroy();
    state.dashboardChart = null;
  }
}

function computeStreak(sessions) {
  const finishedDates = new Set(sessions.filter((session) => session.horaFin).map((session) => session.fecha));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (finishedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function updateChrome() {
  const [session, routine, settings] = await Promise.all([
    getTodaySession(),
    getActiveRoutine(),
    getSettingsMap()
  ]);
  const dateEl = document.getElementById('chrome-date');
  const subtitleEl = document.getElementById('chrome-subtitle');
  const actionBtn = document.getElementById('global-action');
  const sidebarRoutine = document.getElementById('sidebar-routine');
  const sidebarSession = document.getElementById('sidebar-session');
  const dateText = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date());
  if (dateEl) dateEl.textContent = dateText;
  if (subtitleEl) subtitleEl.textContent = routine ? 'Listo para entrenar' : 'Sin rutina activa';
  if (sidebarRoutine) sidebarRoutine.textContent = routine?.nombre || 'Sin rutina';
  if (sidebarSession) {
    if (session?.horaInicio && !session.horaFin) {
      sidebarSession.textContent = `Activa desde ${session.horaInicio}`;
    } else if (session?.horaFin) {
      sidebarSession.textContent = `Completada en ${formatMinutes(session.duracionMin)}`;
    } else {
      sidebarSession.textContent = 'Sin sesión abierta';
    }
  }
  if (actionBtn) {
    if (session?.horaInicio && !session.horaFin) {
      actionBtn.innerHTML = `${icon('stop')} Terminar Gym`;
      actionBtn.disabled = false;
    } else if (session?.horaFin) {
      actionBtn.innerHTML = `${icon('check')} Día completado`;
      actionBtn.disabled = true;
    } else {
      actionBtn.innerHTML = `${icon('start')} Iniciar día`;
      actionBtn.disabled = false;
    }
  }
  state.theme = settings.tema || state.theme;
  state.unit = settings.unidad || state.unit;
  applyTheme(state.theme, state.palette);
}

function destroyCurrentRouteArtifacts() {
  destroyDashboardChart();
  const view = document.getElementById('view');
  if (view?.__timer) {
    window.clearInterval(view.__timer);
    view.__timer = null;
  }
  if (view?.__refreshTimer) {
    window.clearTimeout(view.__refreshTimer);
    view.__refreshTimer = null;
  }
  if (view?.__chart) {
    view.__chart.destroy();
    view.__chart = null;
  }
  if (Array.isArray(view?.__charts)) {
    view.__charts.forEach((chart) => chart?.destroy?.());
    view.__charts = null;
  }
}

async function renderDashboard(view) {
  await createDraftSessionForToday();
  const [session, sessions, measures, routine] = await Promise.all([
    getTodaySession(),
    listSessions(),
    listMeasures(),
    getActiveRoutine()
  ]);

  const latestMeasure = measures[0];
  const streak = computeStreak(sessions);
  const lastWorkout = sessions.find((item) => item.horaFin) || null;
  const chartLabels = measures.slice(0, 8).reverse().map((measure) => measure.fecha);
  const chartValues = measures.slice(0, 8).reverse().map((measure) => Number(measure.peso || 0));

  view.innerHTML = `
    <section class="hero-card card page-enter">
      <div class="hero-row">
        <div>
          <div class="breadcrumbs"><span class="badge">PWA offline-first</span><span>Lista para iniciar hoy</span></div>
          <h1 class="hero-title">Entrena sin Excel, registra todo y exporta cuando quieras.</h1>
          <p class="hero-copy">Gym Wolf guarda tus sesiones, medidas y rutina en IndexedDB para que trabajes offline y solo sincronices cuando tú quieras.</p>
          <div class="hero-actions">
            <button class="btn" data-action="start-today" type="button">${session?.horaInicio && !session.horaFin ? icon('stop') : icon('start')} ${session?.horaInicio && !session.horaFin ? 'Terminar Gym' : 'Iniciar día'}</button>
            <a class="btn secondary" href="#/rutina">${icon('routine')} Ver rutina</a>
            <a class="btn light" href="#/medidas">${icon('measures')} Registrar medidas</a>
          </div>
        </div>
        <div class="grid cols-2">
          <div class="stat-card">
            <div class="stat-label">Sesión de hoy</div>
            <div class="stat-value">${session?.horaInicio ? `${formatTime(session.horaInicio)}${session.horaFin ? ` - ${formatTime(session.horaFin)}` : ''}` : 'Pendiente'}</div>
            <div class="stat-note">${session?.horaInicio && !session.horaFin ? 'Sesión abierta' : session?.horaFin ? `Duración ${formatMinutes(session.duracionMin)}` : 'Sin iniciar'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Racha</div>
            <div class="stat-value">${streak} días</div>
            <div class="stat-note">Sesiones completadas seguidas</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Última medición</div>
            <div class="stat-value">${latestMeasure ? formatWeight(latestMeasure.peso, state.unit) : 'Sin dato'}</div>
            <div class="stat-note">${latestMeasure ? latestMeasure.fecha : 'Agrega tu primera medición'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Último entreno</div>
            <div class="stat-value">${lastWorkout ? formatDateLong(lastWorkout.fecha) : 'Sin datos'}</div>
            <div class="stat-note">${lastWorkout ? `${lastWorkout.diaNombre} · ${formatMinutes(lastWorkout.duracionMin)}` : 'Aún no hay sesiones finalizadas'}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid cols-2">
      <article class="chart-card page-enter">
        <div class="helper-row">
          <div>
            <h2 class="page-title" style="font-size:1.15rem;margin:0;">Peso reciente</h2>
            <p class="page-lead">Últimas 8 mediciones registradas</p>
          </div>
          <span class="badge success">${routine ? routine.nombre : 'Sin rutina'}</span>
        </div>
        <div style="margin-top:10px;">
          ${measures.length ? '<canvas id="dashboard-chart" class="aspect-16-9"></canvas>' : emptyState({ iconName: 'measures', title: 'Sin mediciones', message: 'Registra tu primer peso para ver la tendencia.' })}
        </div>
      </article>

      <article class="card page-enter stack">
        <div class="helper-row">
          <div>
            <h2 class="page-title" style="font-size:1.15rem;margin:0;">Accesos rápidos</h2>
            <p class="page-lead">Lo más usado al abrir la app</p>
          </div>
        </div>
        <div class="stack">
          <a class="btn light" href="#/hoy">${icon('today')} Ir a Hoy</a>
          <a class="btn light" href="#/historial">${icon('history')} Ver historial</a>
          <a class="btn light" href="#/progreso">${icon('progress')} Revisar progreso</a>
        </div>
      </article>
    </section>
  `;

  if (measures.length) {
    const canvas = view.querySelector('#dashboard-chart');
    if (canvas) {
      destroyDashboardChart();
      state.dashboardChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            label: `Peso (${state.unit})`,
            data: chartValues,
            borderColor: cssVar('--primary'),
            backgroundColor: colorWithAlpha(cssVar('--primary'), 0.16),
            fill: true,
            tension: 0.35,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, grid: { color: 'rgba(138, 122, 128, 0.12)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  view.querySelector('[data-action="start-today"]')?.addEventListener('click', async () => {
    const current = await getTodaySession();
    if (current?.horaInicio && !current.horaFin) {
      const finished = await finishSession(current.id);
      toast('Sesión finalizada', `Duró ${formatMinutes(finished?.duracionMin || 0)}.`, 'success');
    } else if (!current?.horaFin) {
      await startTodayFlow();
      navigate('hoy');
    }
    await renderRoute();
  });
}

function buildSettingsHtml(settings) {
  return `
    <section class="card page-enter stack">
      <div class="helper-row">
        <div>
          <h1 class="page-title">Ajustes</h1>
          <p class="page-lead">Tema, unidad y exportación de datos</p>
        </div>
      </div>
      <div class="form-grid two">
        <div>
          <label class="field-label" for="theme-select">Tema</label>
          <select class="select" id="theme-select">
            <option value="light" ${settings.tema === 'light' ? 'selected' : ''}>Claro</option>
            <option value="dark" ${settings.tema === 'dark' ? 'selected' : ''}>Oscuro</option>
            <option value="auto" ${!settings.tema || settings.tema === 'auto' ? 'selected' : ''}>Auto</option>
          </select>
        </div>
        <div>
          <label class="field-label" for="unit-select">Unidad</label>
          <select class="select" id="unit-select">
            <option value="kg" ${settings.unidad !== 'lb' ? 'selected' : ''}>kg</option>
            <option value="lb" ${settings.unidad === 'lb' ? 'selected' : ''}>lb</option>
          </select>
        </div>
      </div>
      <div class="grid cols-2">
        <button class="btn light" type="button" data-export="sessions-csv">${icon('download')} Exportar CSV sesiones</button>
        <button class="btn light" type="button" data-export="measures-csv">${icon('download')} Exportar CSV medidas</button>
        <button class="btn light" type="button" data-export="xlsx">${icon('download')} Exportar XLSX</button>
        <button class="btn light" type="button" data-export="json">${icon('download')} Exportar JSON</button>
      </div>
      <div class="grid cols-2">
        <button class="btn secondary" type="button" data-action="import-json">${icon('upload')} Importar JSON</button>
        <button class="btn danger" type="button" data-action="clear-data">${icon('trash')} Borrar todos los datos</button>
      </div>
      <input id="import-json-input" class="sr-only" type="file" accept="application/json,.json" />
      <div class="stack">
        <div class="badge success">Backup compatible con Excel, Power BI y hojas externas</div>
        <p class="page-lead">La PWA funciona offline tras la primera carga. Si cambias el tema a Auto, se adapta al sistema operativo.</p>
      </div>
    </section>
  `;
}

async function renderSettingsPage(view) {
  const settings = await getSettingsMap();
  view.innerHTML = buildSettingsHtml(settings);
  view.querySelector('#theme-select')?.addEventListener('change', async (event) => {
    const value = event.target.value;
    state.theme = value;
    await setSetting('tema', value);
    applyTheme(value, state.palette);
    await renderRoute();
  });
  view.querySelector('#unit-select')?.addEventListener('change', async (event) => {
    const value = event.target.value;
    state.unit = value;
    await setSetting('unidad', value);
    toast('Unidad actualizada', `Ahora se mostrará en ${value}.`, 'success');
    await renderRoute();
  });
  view.querySelector('[data-export="sessions-csv"]')?.addEventListener('click', downloadSessionsCsvFile);
  view.querySelector('[data-export="measures-csv"]')?.addEventListener('click', downloadMeasuresCsvFile);
  view.querySelector('[data-export="xlsx"]')?.addEventListener('click', downloadWorkbookFile);
  view.querySelector('[data-export="json"]')?.addEventListener('click', downloadBackupJsonFile);
  view.querySelector('[data-action="import-json"]')?.addEventListener('click', () => {
    view.querySelector('#import-json-input')?.click();
  });
  view.querySelector('#import-json-input')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const accepted = await confirmDialog({
      title: 'Importar respaldo',
      message: 'Esto reemplazará los datos actuales por el contenido del JSON.',
      confirmText: 'Importar',
      danger: true
    });
    if (!accepted) return;
    try {
      await importBackupFromFile(file);
      await renderRoute();
      toast('Respaldo importado', 'Los datos fueron reemplazados correctamente.', 'success');
    } catch (error) {
      toast('No se pudo importar', error.message || 'El archivo no es válido.', 'error');
    } finally {
      event.target.value = '';
    }
  });
  view.querySelector('[data-action="clear-data"]')?.addEventListener('click', async () => {
    const accepted = await confirmDialog({
      title: 'Borrar todos los datos',
      message: 'Escribe BORRAR para eliminar rutinas, sesiones y medidas.',
      confirmText: 'Borrar',
      danger: true,
      requireText: 'BORRAR'
    });
    if (!accepted) return;
    await clearAllData();
    toast('Datos eliminados', 'La base local quedó vacía y se resembró la rutina por defecto.', 'success');
    await renderRoute();
  });
}

async function renderRoute() {
  const route = ROUTES[todayRoute()] || 'inicio';
  state.route = route;
  setActiveNav(route);
  toggleDrawer(false);
  document.title = `${routeTitle(route)} · Gym Wolf`;
  destruirGraficosProgreso();
  destroyCurrentRouteArtifacts();
  const view = document.getElementById('view');
  if (!view) return;
  view.innerHTML = '';
  view.classList.remove('page-enter');
  void view.offsetWidth;
  view.classList.add('page-enter');

  if (route === 'inicio') {
    await renderDashboard(view);
  } else if (route === 'hoy') {
    await renderTodayPage(view, { navigate, refresh: renderRoute });
  } else if (route === 'rutina') {
    await renderRoutinePage(view, { navigate, refresh: renderRoute });
  } else if (route === 'historial') {
    await renderHistoryPage(view, { navigate, refresh: renderRoute });
  } else if (route === 'medidas') {
    await renderMeasuresPage(view, { navigate, refresh: renderRoute });
  } else if (route === 'progreso') {
    await renderProgressPage(view, { navigate, refresh: renderRoute });
  } else if (route === 'ajustes') {
    await renderAjustesPage(view, { navigate, refresh: renderRoute });
  }
  await updateChrome();
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.onclick = () => navigate('ajustes');
  }
}

async function refreshTodaySilently() {
  if (todayRoute() !== 'hoy') return;
  const view = document.getElementById('view');
  if (!view) return;
  const scrollY = window.scrollY;
  await renderTodayPage(view, { navigate, refresh: renderRoute });
  await updateChrome();
  window.scrollTo({ top: scrollY, behavior: 'auto' });
}

function attachShellEvents() {
  document.body.addEventListener('click', (event) => {
    const actionBtn = event.target.closest?.('#global-action');
    if (actionBtn) {
      event.preventDefault();
      handleGlobalAction();
    }
  });
  document.getElementById('settings-btn')?.addEventListener('click', () => navigate('ajustes'));
}

async function handleGlobalAction() {
  const session = await getTodaySession();
  if (session?.horaInicio && !session.horaFin) {
    const finished = await finishSession(session.id);
    toast('Sesión finalizada', `Duración total: ${formatMinutes(finished?.duracionMin || 0)}.`, 'success');
    await renderRoute();
    return;
  }
  if (session?.horaFin) {
    toast('Sesión cerrada', 'La sesión de hoy ya terminó.', 'info');
    return;
  }
  await startTodayFlow();
  navigate('hoy');
  await renderRoute();
}

function registerThemeWatcher() {
  if (state.theme !== 'auto') return;
  state.mediaQuery.addEventListener('change', () => {
    if (state.theme === 'auto') {
      applyTheme(state.theme, state.palette);
    }
  });
}

async function boot() {
  await initDb();
  const settings = await getSettingsMap();
  state.theme = settings.tema || 'auto';
  state.palette = settings.paleta || 'mono';
  state.unit = settings.unidad || 'kg';
  document.getElementById('app').innerHTML = shellMarkup();
  applyTheme(state.theme, state.palette);
  attachShellEvents();
  inicializarDrawer();
  inicializarModalSerie();
  registerThemeWatcher();
  window.GymWolfApp = {
    refresh: renderRoute,
    navigate,
    setTheme: async (value) => {
      state.theme = value;
      await setSetting('tema', value);
      applyTheme(value, state.palette);
      await renderRoute();
    },
    setPalette: async (value) => {
      state.palette = value;
      await setSetting('paleta', value);
      applyTheme(state.theme, value);
      await renderRoute();
    },
    setUnit: async (value) => {
      state.unit = value;
      await setSetting('unidad', value);
      await renderRoute();
    },
    state
  };
  window.addEventListener('hashchange', renderRoute);
  if (!location.hash) {
    navigate('inicio');
  }
  document.addEventListener('gw:sesion-creada', () => {
    refreshTodaySilently();
  });
  document.addEventListener('gw:sesion-actualizada', () => {
    refreshTodaySilently();
  });
  await updateChrome();
  await renderRoute();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister().catch(() => {}));
    }).catch(() => {});
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

boot().catch((error) => {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div class="page" style="padding:24px;"><section class="card"><h1 class="page-title">No se pudo iniciar la app</h1><p class="page-lead">${escapeHtml(error.message || 'Error desconocido')}</p></section></div>`;
  }
  console.error(error);
});

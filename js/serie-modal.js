import { db, upsertSession } from './db.js';
import { abrirModal, cerrarModal, toast } from './ui.js';

const estadoModal = {
  sesionId: null,
  ejerciciosKey: null,
  ejIdx: null,
  serieIdx: null,
  peso: null,
  horaInicio: null,
  intervalId: null,
  tiempoSeg: 0,
};

const estadoSaltar = {
  sesionId: null,
  ejerciciosKey: null,
  ejIdx: null,
  razon: null,
};

function formatearMMSS(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function cerrarModalSerie() {
  const modal = document.getElementById('modal-serie');
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-abierto');
  if (estadoModal.intervalId) {
    clearInterval(estadoModal.intervalId);
    estadoModal.intervalId = null;
  }
}

function cerrarModalSaltar() {
  const modal = document.getElementById('modal-saltar-ejercicio');
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-abierto');
  const campo = document.getElementById('razon-libre');
  if (campo) campo.value = '';
}

function cerrarResumen() {
  const modal = document.getElementById('modal-resumen-sesion');
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-abierto');
}

function configurarCamposPorTipo(modal, tipo = 'reps') {
  const tipoNormalizado = (tipo || 'reps').toLowerCase();
  const config = {
    reps: { peso: true, reps: true, tiempo: true },
    tiempo: { peso: false, reps: false, tiempo: true },
    tiempo_reps: { peso: true, reps: true, tiempo: true }
  };

  const campos = config[tipoNormalizado] || config.reps;
  const campoPeso = modal.querySelector('[data-campo="peso"]');
  const campoReps = modal.querySelector('[data-campo="reps"]');

  if (campoPeso) campoPeso.hidden = !campos.peso;
  if (campoReps) campoReps.hidden = !campos.reps;

  modal.dataset.tipo = tipoNormalizado;
}

function mostrarPaso(n) {
  document.querySelectorAll('#modal-serie .paso').forEach((paso) => {
    paso.hidden = paso.dataset.paso !== String(n);
  });
}

function descripcionRPE(valor) {
  if (valor <= 3) return 'Muy fácil';
  if (valor <= 5) return 'Fácil';
  if (valor <= 7) return 'Moderado';
  if (valor <= 8) return 'Difícil';
  if (valor <= 9) return 'Muy difícil';
  return 'Máximo esfuerzo';
}

function renderizarRPE() {
  const escala = document.querySelector('#modal-serie .rpe-escala');
  if (!escala) return;
  if (escala.dataset.renderizado === '1') return;
  escala.dataset.renderizado = '1';
  escala.innerHTML = '';

  for (let i = 1; i <= 10; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rpe-btn';
    btn.dataset.valor = String(i);
    btn.textContent = String(i);
    btn.addEventListener('click', () => {
      escala.querySelectorAll('.rpe-btn').forEach((item) => item.classList.remove('activo'));
      btn.classList.add('activo');
      const desc = document.querySelector('#modal-serie [data-rpe-desc]');
      if (desc) desc.textContent = descripcionRPE(i);
    });
    escala.appendChild(btn);
  }
}

async function mostrarUltimaVez(sesionId, ejercicioActual) {
  const sesiones = await db.sesiones.orderBy('fecha').reverse().toArray();
  const anterior = sesiones.find((sesion) => sesion.id !== sesionId && sesion.ejercicios?.some((ejercicio) => ejercicio.nombre === ejercicioActual.nombre && Array.isArray(ejercicio.series) && ejercicio.series.length > 0));
  const contenedor = document.querySelector('#modal-serie .referencia-ultima-vez');
  if (!contenedor) return;

  if (!anterior) {
    contenedor.hidden = true;
    return;
  }

  const ejercicioPrevio = anterior.ejercicios.find((ejercicio) => ejercicio.nombre === ejercicioActual.nombre && Array.isArray(ejercicio.series) && ejercicio.series.length > 0);
  const ultimaSerie = ejercicioPrevio?.series?.[ejercicioPrevio.series.length - 1];
  const ultimoPeso = document.querySelector('#modal-serie [data-ultimo-peso]');
  const ultimasReps = document.querySelector('#modal-serie [data-ultimas-reps]');
  if (ultimoPeso) ultimoPeso.textContent = ultimaSerie?.peso != null && ultimaSerie.peso !== '' ? `${ultimaSerie.peso} kg` : '—';
  if (ultimasReps) ultimasReps.textContent = ultimaSerie?.reps != null && ultimaSerie.reps !== '' ? `${ultimaSerie.reps} reps` : '—';
  contenedor.hidden = false;
}

function iniciarTimer() {
  if (estadoModal.intervalId) clearInterval(estadoModal.intervalId);
  const inicio = Date.now();
  const display = document.querySelector('#modal-serie .timer-display');
  if (!display) return;

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

export async function abrirModalSerie(sesionId, ejerciciosKey, ejIdx) {
  const sesion = await db.sesiones.get(sesionId);
  if (!sesion) return;

  const lista = sesion[ejerciciosKey] || [];
  const ejercicio = lista[ejIdx];
  if (!ejercicio) return;

  const seriesConfiguradas = Number(ejercicio.seriesConfiguradas || ejercicio.series?.length || ejercicio.series || 1);
  const seriesRegistradas = Array.isArray(ejercicio.series) ? ejercicio.series.length : 0;

  if (seriesRegistradas >= seriesConfiguradas) {
    toast('Este ejercicio ya está completo', 'info');
    return;
  }

  estadoModal.sesionId = sesionId;
  estadoModal.ejerciciosKey = ejerciciosKey;
  estadoModal.ejIdx = ejIdx;
  estadoModal.serieIdx = seriesRegistradas;
  estadoModal.peso = null;
  estadoModal.horaInicio = null;
  estadoModal.tiempoSeg = 0;

  const modal = document.getElementById('modal-serie');
  if (!modal) return;

  abrirModal('modal-serie');

  modal.querySelectorAll('[data-nombre-ej]').forEach((node) => {
    node.textContent = ejercicio.nombre;
  });
  modal.querySelectorAll('[data-serie-actual]').forEach((node) => {
    node.textContent = `Serie ${seriesRegistradas + 1}`;
  });
  const total = modal.querySelector('[data-serie-total]');
  if (total) total.textContent = String(seriesConfiguradas);

  const campoPeso = modal.querySelector('[data-campo="peso"]');
  const campoReps = modal.querySelector('[data-campo="reps"]');
  const tipo = ejercicio.tipo || 'reps';
  configurarCamposPorTipo(modal, tipo);
  if (campoPeso) campoPeso.hidden = !(tipo.includes('reps') || tipo === 'tiempo_reps' || tipo === 'reps');
  if (campoReps) campoReps.hidden = !(tipo.includes('reps') || tipo === 'tiempo_reps' || tipo === 'reps');

  const pesoInput = modal.querySelector('#input-peso');
  const repsInput = modal.querySelector('#input-reps');
  const rpeDesc = modal.querySelector('[data-rpe-desc]');
  if (pesoInput) pesoInput.value = '';
  if (repsInput) repsInput.value = '';
  if (rpeDesc) rpeDesc.textContent = 'Selecciona un valor';

  const display = modal.querySelector('.timer-display');
  if (display) display.textContent = '00:00';
  const pesoActual = modal.querySelector('[data-peso-actual]');
  if (pesoActual) pesoActual.textContent = '—';
  modal.querySelectorAll('.rpe-btn').forEach((btn) => btn.classList.remove('activo'));

  await mostrarUltimaVez(sesionId, ejercicio);
  mostrarPaso(1);
  renderizarRPE();
  modal.hidden = false;
}

export function empezarSerie() {
  const modal = document.getElementById('modal-serie');
  if (!modal) return;

  const tipo = modal.dataset.tipo || 'reps';
  let peso = null;
  if (tipo !== 'tiempo') {
    const pesoInput = modal.querySelector('#input-peso');
    peso = pesoInput && pesoInput.value ? Number(pesoInput.value) : null;
  }

  estadoModal.peso = peso;
  estadoModal.horaInicio = new Date().toISOString();
  estadoModal.tiempoSeg = 0;

  const pesoActual = modal.querySelector('[data-peso-actual]');
  if (pesoActual) pesoActual.textContent = peso != null ? `${peso} kg` : 'Sin peso';

  const display = modal.querySelector('.timer-display');
  if (display) display.textContent = '00:00';
  mostrarPaso(2);
  iniciarTimer();
}

export function terminarSerie() {
  detenerTimer();
  mostrarPaso(3);
}

async function avanzarAlSiguiente(sesion) {
  const lista = sesion.ejercicios || [];
  const actualIdx = estadoModal.ejIdx;

  for (let i = actualIdx + 1; i < lista.length; i += 1) {
    const ejercicio = lista[i];
    if (ejercicio.estado === 'pendiente' || ejercicio.estado === 'en_curso') {
      sesion.indiceEjercicioActivo = i;
      if (ejercicio.estado === 'pendiente') ejercicio.estado = 'en_curso';
      return;
    }
  }

  const todosListos = lista.every((ejercicio) => ['completado', 'saltado'].includes(ejercicio.estado));
  if (todosListos) toast('¡Todos los ejercicios listos! Puedes terminar el gym', 'success');
}

export async function guardarSerie() {
  const modal = document.getElementById('modal-serie');
  if (!modal) return;

  const tipo = modal.dataset.tipo || 'reps';
  let reps = null;
  if (tipo === 'reps' || tipo === 'tiempo_reps') {
    const repsInput = modal.querySelector('#input-reps');
    reps = repsInput && repsInput.value ? Number(repsInput.value) : null;
  }
  const rpeBtn = modal.querySelector('.rpe-btn.activo');
  const rpe = rpeBtn ? Number(rpeBtn.dataset.valor) : null;

  if (!rpe) {
    toast('Selecciona tu nivel de esfuerzo', 'warning');
    return;
  }

  const sesion = await db.sesiones.get(estadoModal.sesionId);
  if (!sesion || !Array.isArray(sesion[estadoModal.ejerciciosKey])) return;

  const ejercicio = sesion[estadoModal.ejerciciosKey][estadoModal.ejIdx];
  if (!ejercicio) return;

  const nuevaSerie = {
    idx: estadoModal.serieIdx,
    peso: estadoModal.peso,
    reps,
    rpe,
    tiempoSeg: estadoModal.tiempoSeg,
    horaInicio: estadoModal.horaInicio ? new Date(estadoModal.horaInicio).toISOString().slice(11, 16) : null,
    horaFin: new Date().toISOString().slice(11, 16),
    registradaEn: new Date().toISOString(),
  };

  ejercicio.series = ejercicio.series || [];
  ejercicio.series.push(nuevaSerie);

  const total = Number(ejercicio.seriesConfiguradas || ejercicio.series.length || 1);
  if (ejercicio.series.length >= total) {
    ejercicio.estado = 'completado';
    const sum = ejercicio.series.reduce((acc, serie) => acc + (Number(serie.rpe) || 0), 0);
    ejercicio.rpePromedio = Number((sum / ejercicio.series.length).toFixed(1));
    await avanzarAlSiguiente(sesion);
  } else {
    ejercicio.estado = 'en_curso';
  }

  await upsertSession(sesion);
  document.dispatchEvent(new CustomEvent('gw:sesion-actualizada', { detail: { sesionId: sesion.id } }));
  cerrarModalSerie();
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent('gw:sesion-actualizada', { detail: { sesionId: sesion.id } }));
  }, 0);
  toast(`Serie ${nuevaSerie.idx + 1} guardada · ${nuevaSerie.peso ?? '—'} kg × ${reps ?? '—'} reps`, 'success');
}

export function abrirModalSaltar(sesionId, ejerciciosKey, ejIdx) {
  const sesion = db.sesiones.get(sesionId);
  sesion.then((data) => {
    const lista = data?.[ejerciciosKey] || [];
    const ejercicio = lista[ejIdx];
    if (!ejercicio) return;

    estadoSaltar.sesionId = sesionId;
    estadoSaltar.ejerciciosKey = ejerciciosKey;
    estadoSaltar.ejIdx = ejIdx;
    estadoSaltar.razon = null;

    const modal = document.getElementById('modal-saltar-ejercicio');
    if (!modal) return;

    abrirModal('modal-saltar-ejercicio');

    const nombreNode = modal.querySelector('[data-nombre-ej-saltar]');
    if (nombreNode) nombreNode.textContent = ejercicio.nombre;

    modal.querySelectorAll('.razon-btn').forEach((btn) => {
      btn.classList.toggle('activo', btn.dataset.razon === estadoSaltar.razon);
    });

    const campoOtro = modal.querySelector('.razon-otro-campo');
    if (campoOtro) campoOtro.hidden = true;
    const libre = document.getElementById('razon-libre');
    if (libre) libre.value = '';

    modal.hidden = false;
  });
}

export function confirmarSaltar() {
  const modal = document.getElementById('modal-saltar-ejercicio');
  const razonValue = estadoSaltar.razon || document.querySelector('.razon-btn.activo')?.dataset.razon || 'Sin motivo';
  const campoLibre = document.getElementById('razon-libre');
  const razonFinal = razonValue === 'otro' && campoLibre?.value?.trim() ? campoLibre.value.trim() : razonValue;

  if (!estadoSaltar.sesionId || estadoSaltar.ejIdx == null) {
    cerrarModalSaltar();
    return;
  }

  db.sesiones.get(estadoSaltar.sesionId).then(async (sesion) => {
    const lista = sesion?.[estadoSaltar.ejerciciosKey] || [];
    const ejercicio = lista[estadoSaltar.ejIdx];
    if (!ejercicio) {
      cerrarModalSaltar();
      return;
    }

    ejercicio.estado = 'saltado';
    ejercicio.razonSalto = razonFinal;
    await upsertSession(sesion);
    cerrarModalSaltar();
    toast('Ejercicio marcado como saltado', 'info');
    document.dispatchEvent(new CustomEvent('gw:sesion-actualizada', { detail: { sesionId: sesion.id } }));
  });
}

export function mostrarResumenSesion(sesion) {
  if (!sesion) return;
  const modal = document.getElementById('modal-resumen-sesion');
  if (!modal) return;

  abrirModal('modal-resumen-sesion');

  const ejerciciosCompletados = (sesion.ejercicios || []).filter((ejercicio) => ejercicio.estado === 'completado').length;
  const seriesTotales = (sesion.ejercicios || []).reduce((sum, ejercicio) => sum + (Array.isArray(ejercicio.series) ? ejercicio.series.length : 0), 0);
  const volumen = (sesion.ejercicios || []).reduce((total, ejercicio) => {
    return total + (ejercicio.series || []).reduce((subtotal, serie) => subtotal + ((Number(serie.peso) || 0) * (Number(serie.reps) || 0)), 0);
  }, 0);
  const rpePromedio = (sesion.ejercicios || []).filter((ejercicio) => ejercicio.rpePromedio != null).reduce((sum, ejercicio) => sum + Number(ejercicio.rpePromedio || 0), 0);
  const rpeValor = (sesion.ejercicios || []).filter((ejercicio) => ejercicio.rpePromedio != null).length
    ? (rpePromedio / (sesion.ejercicios.filter((ejercicio) => ejercicio.rpePromedio != null).length)).toFixed(1)
    : '0.0';

  const duracion = modal.querySelector('[data-resumen-duracion]');
  const completados = modal.querySelector('[data-resumen-ejercicios]');
  const series = modal.querySelector('[data-resumen-series]');
  const volumenNode = modal.querySelector('[data-resumen-volumen]');
  const rpeNode = modal.querySelector('[data-resumen-rpe]');
  const saltados = modal.querySelector('[data-resumen-saltados]');

  if (duracion) duracion.textContent = sesion.duracionMin != null ? `${sesion.duracionMin} min` : '—';
  if (completados) completados.textContent = String(ejerciciosCompletados);
  if (series) series.textContent = String(seriesTotales);
  if (volumenNode) volumenNode.textContent = String(volumen);
  if (rpeNode) rpeNode.textContent = rpeValor;
  if (saltados) saltados.textContent = String((sesion.ejercicios || []).filter((ejercicio) => ejercicio.estado === 'saltado').length);

  modal.hidden = false;
}

export function saltarSerieActual() {
  const modal = document.getElementById('modal-serie');
  if (modal) modal.hidden = true;
  const sesionId = estadoModal.sesionId;
  const ejerciciosKey = estadoModal.ejerciciosKey;
  const ejIdx = estadoModal.ejIdx;
  cerrarModalSerie();
  if (sesionId != null && ejerciciosKey && ejIdx != null) {
    abrirModalSaltar(sesionId, ejerciciosKey, ejIdx);
  }
}

async function manejarClickIniciarSerie(btn) {
  try {
    const card = btn.closest('[data-ej-idx], [data-core-idx]');
    if (!card) {
      console.warn('[Iniciar serie] No se encontró la card padre');
      return;
    }

    const sesionId = card.dataset.sesionId;
    const esCore = card.hasAttribute('data-core-idx');
    const idx = Number(esCore ? card.dataset.coreIdx : card.dataset.ejIdx);
    const clave = esCore ? 'core' : 'ejercicios';

    console.log('[Iniciar serie]', { sesionId, clave, idx });

    const sesion = await db.sesiones.get(sesionId);
    if (!sesion) {
      toast('No se encontró la sesión activa', 'error');
      return;
    }

    if (!document.getElementById('modal-serie')) {
      toast('Error: falta el modal de serie en el HTML', 'error');
      console.error('Falta #modal-serie en el HTML');
      return;
    }

    await abrirModalSerie(sesionId, clave, idx);
  } catch (err) {
    console.error('[Iniciar serie] Error:', err);
    toast('Error al abrir la serie: ' + (err?.message || err), 'error');
  }
}

function manejarClickSaltarEjercicio(btn) {
  const card = btn.closest('[data-ej-idx], [data-core-idx]');
  if (!card) return;
  const sesionId = card.dataset.sesionId;
  const esCore = card.hasAttribute('data-core-idx');
  const idx = Number(esCore ? card.dataset.coreIdx : card.dataset.ejIdx);
  const clave = esCore ? 'core' : 'ejercicios';
  if (!sesionId || Number.isNaN(idx)) return;
  abrirModalSaltar(sesionId, clave, idx);
}

export function inicializarModalSerie() {
  const dataset = document?.dataset || window.__gymwolfDataset || {};
  if (dataset.modalSerieBound === 'true') return;

  if (document?.dataset) {
    document.dataset.modalSerieBound = 'true';
  } else {
    window.__gymwolfDataset = dataset;
    dataset.modalSerieBound = 'true';
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    switch (action) {
      case 'iniciar-serie':
      case 'iniciar-serie-core':
        event.preventDefault();
        manejarClickIniciarSerie(btn);
        break;
      case 'saltar-ejercicio':
      case 'saltar-ejercicio-core':
        event.preventDefault();
        manejarClickSaltarEjercicio(btn);
        break;
      case 'cerrar-serie':
        event.preventDefault();
        detenerTimer();
        cerrarModalSerie();
        break;
      case 'empezar-serie':
        event.preventDefault();
        empezarSerie();
        break;
      case 'terminar-serie':
        event.preventDefault();
        terminarSerie();
        break;
      case 'guardar-serie':
        event.preventDefault();
        guardarSerie();
        break;
      case 'saltar-serie':
        event.preventDefault();
        saltarSerieActual();
        break;
      case 'cerrar-saltar':
        event.preventDefault();
        cerrarModalSaltar();
        break;
      case 'confirmar-saltar':
        event.preventDefault();
        confirmarSaltar();
        break;
      case 'cerrar-resumen':
        event.preventDefault();
        cerrarResumen();
        break;
      default:
        break;
    }
  });

  const modalSaltar = document.getElementById('modal-saltar-ejercicio');
  if (modalSaltar && !modalSaltar.dataset.bound) {
    modalSaltar.dataset.bound = 'true';
    modalSaltar.querySelectorAll('.razon-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        modalSaltar.querySelectorAll('.razon-btn').forEach((item) => item.classList.remove('activo'));
        btn.classList.add('activo');
        estadoSaltar.razon = btn.dataset.razon || null;
        const campo = modalSaltar.querySelector('.razon-otro-campo');
        const libre = document.getElementById('razon-libre');
        if (btn.dataset.razon === 'otro') {
          if (campo) campo.hidden = false;
          if (libre) libre.focus();
        } else if (campo) {
          campo.hidden = true;
        }
      });
    });
  }
}

window.__gymwolfModalSerie = {
  abrirModalSerie,
  empezarSerie,
  terminarSerie,
  guardarSerie,
  saltarSerieActual,
  mostrarResumenSesion,
  confirmarSaltar,
  cerrarModalSerie,
  cerrarModalSaltar,
  cerrarResumen,
};

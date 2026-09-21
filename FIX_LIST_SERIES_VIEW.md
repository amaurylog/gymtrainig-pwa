# FIX · Las series no se muestran hasta terminar el gym

## Problema
Al guardar una serie con el modal de serie, el dato se guarda en IndexedDB
pero la lista de series registradas no se actualiza en pantalla hasta que
el usuario sale y vuelve a entrar al módulo Hoy (o termina el gym).

## Causa
`guardarSerie()` dispara el evento `gw:sesion-actualizada`, pero no hay
ningún listener que escuche ese evento y vuelva a llamar a `renderizarHoy()`.

## Fix

### 1. Asegurar que el evento se dispare en `guardarSerie()`

En `js/serie-modal.js`, al final de `guardarSerie()`, ANTES de cerrar el modal:

```js
await db.sesiones.put(sesion);
cerrarModal('modal-serie');

toast(`Serie ${nuevaSerie.idx + 1} guardada · ${nuevaSerie.peso || '—'} kg × ${reps || '—'} reps`, 'success');

// 👇 Forzar re-render inmediato del módulo Hoy
document.dispatchEvent(new CustomEvent('gw:sesion-actualizada', {
  detail: { sesionId: sesion.id }
}));
```

### 2. Escuchar el evento en `app.js`

En `js/app.js`, dentro de la función `iniciar()` o donde se inicializa el router:

```js
import { renderizarHoy } from './sesion.js';

// ...

document.addEventListener('gw:sesion-actualizada', async (e) => {
  // Solo re-renderizar si estamos viendo la sección Hoy
  if (location.hash === '#/hoy' || location.hash === '' || location.hash === '#/') {
    await renderizarHoy();
  }
});
```

### 3. También escuchar cuando se crea la sesión

Adicionalmente, en `confirmarInicioSesion()` (crear sesión nueva desde modal de rutina),
disparar el mismo evento para que Hoy se renderice al instante:

```js
await db.sesiones.put(sesion);
cerrarModal('modal-seleccion-rutina');
toast(`Sesión iniciada · ${dia.nombre} · ${ejerciciosSesion.length} ejercicios`, 'success');
location.hash = '#/hoy';

// 👇 Esperar a que el hash cambie y re-renderizar
setTimeout(() => {
  document.dispatchEvent(new CustomEvent('gw:sesion-actualizada', {
    detail: { sesionId: sesion.id }
  }));
}, 100);
```

### 4. Verificar que `renderizarHoy` sea exportada

En `js/sesion.js`, asegurar que la función esté exportada:

```js
export async function renderizarHoy() {
  // ...
}
```

### 5. Verificación

Después del fix:
1. Iniciar el gym → elegir rutina → se cargan los ejercicios
2. Pulsar "Iniciar serie 1 de 4" → modal → guardar
3. **La serie debe aparecer inmediatamente** en la lista del ejercicio
4. El botón debe cambiar a "Iniciar serie 2 de 4"
5. Sin recargar ni salir de la pantalla

### Puntos importantes
- NO uses `location.reload()` — pierde el estado
- NO cierres el modal antes de disparar el evento
- El re-render debe ser silencioso (sin scroll jump)
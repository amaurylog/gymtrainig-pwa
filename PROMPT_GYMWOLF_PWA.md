# PROMPT MAESTRO · Gym Wolf PWA

> Pega este archivo completo en GitHub Copilot Chat, Cursor, Windsurf o Claude Code.
> Genera la app de una sola pasada o en iteraciones cortas.

---

## ROL
Actúa como un desarrollador senior full-stack especializado en PWAs offline-first,
con experiencia en HTML/CSS/JS vanilla moderno, IndexedDB y diseño responsive mobile-first.

## OBJETIVO
Genera una PWA (Progressive Web App) completa, funcional y lista para desplegar en
GitHub Pages, que reemplace una hoja de Excel de rutina de gimnasio. Debe:
- Funcionar 100% offline tras la primera carga
- Ser instalable en Android/iOS ("Añadir a pantalla de inicio")
- Verse igual de bien en móvil (vertical) y escritorio (horizontal)
- Permitir registrar sesiones con hora de inicio/fin, pesos y reps
- Exportar los registros en CSV, XLSX y JSON para graficar externamente

## STACK OBLIGATORIO
- HTML5 + CSS3 + JavaScript ES6+ **vanilla** (sin frameworks, sin build tools)
- IndexedDB mediante Dexie.js (CDN: https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js)
- SheetJS para exportar XLSX (CDN: https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js)
- Chart.js para gráficas (CDN: https://cdn.jsdelivr.net/npm/chart.js)
- Estilos: CSS puro con variables CSS y media queries (mobile-first).
  NO uses Tailwind para evitar dependencias de build.
- Service Worker propio (sin Workbox) para cachear todos los assets.

## ESTRUCTURA DE ARCHIVOS ESPERADA
```
/gymwolf-pwa
│   index.html
│   manifest.json
│   sw.js
│   /css
│       styles.css
│   /js
│       app.js          (router + shell)
│       db.js           (IndexedDB + seed de rutina default)
│       rutinas.js      (configurador de rutinas)
│       sesion.js       (módulo "Hoy": iniciar/terminar gym, registrar series)
│       medidas.js      (medidas corporales)
│       progreso.js     (gráficas)
│       historial.js    (sesiones pasadas)
│       exportar.js     (CSV / XLSX / JSON)
│       ui.js           (helpers: toast, modal, confirm)
│   /icons
│       icon-192.png
│       icon-512.png
│       apple-touch-icon.png
└   README.md
```

## DISEÑO RESPONSIVE

### Layout
- **Móvil (<768px):**
  - Header superior fijo: logo "Gym Wolf", fecha actual, botón ▶ Iniciar día
  - Contenido central scrolleable
  - Bottom navigation bar fija con 6 iconos SVG inline:
    Inicio · Hoy · Rutina · Historial · Medidas · Progreso
  - Configuración accesible desde ícono ⚙ en el header
- **Escritorio (>=768px):**
  - Sidebar izquierdo fijo de 240px con navegación vertical + labels
  - Área de contenido con max-width 1100px centrada
  - Header sticky con botón ▶ Iniciar día

### Paleta (variables CSS)
```css
:root {
  --c-dark:    #3B2B3B;
  --c-rose:    #C98B9B;
  --c-rose-l:  #F6E7EA;
  --c-cream:   #FFFAF8;
  --c-gold:    #B8894A;
  --c-input:   #FFF6DE;
  --c-green:   #DCEFDC;
  --c-text:    #3B2B3B;
  --c-muted:   #8A7A80;
  --c-line:    #EAD9DD;
}
```
Tipografía: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
Bordes redondeados 12px, sombras suaves, tarjetas con fondo blanco.

## MODELO DE DATOS (IndexedDB con Dexie)

```js
// Tabla: rutinas
{
  id: "rutina_default",
  nombre: "Gym Wolf 5 Días",
  esDefault: true,
  creada: ISOString,
  dias: [
    {
      id: "lunes",
      nombre: "Lunes",
      enfoque: "Glúteo mayor & femorales",
      esDescanso: false,
      ejercicios: [
        { id: "uuid", nombre, series, reps, nota, orden }
      ],
      core: [
        { id: "uuid", nombre: "Vacíos abdominales", series: 4, reps: "15-20 s" },
        { id: "uuid", nombre: "Plancha prona sobre codos", series: 3, reps: "30-45 s" },
        { id: "uuid", nombre: "Pallof Press en polea", series: 3, reps: "10-12 / lado" }
      ]
    }
  ]
}

// Tabla: sesiones
{
  id: "ses_2025-01-15",
  fecha: "2025-01-15",
  diaId: "lunes",
  diaNombre: "Lunes",
  horaInicio: "17:32",
  horaFin: "18:55",
  duracionMin: 83,
  energia: 8,
  notas: "",
  cardio: "",
  ejercicios: [
    { ejercicioId, nombre, series: [ { peso, reps, rpe, hecho } ] }
  ],
  core: [ { nombre, hecho } ]
}

// Tabla: medidas
{ id, fecha, peso, cintura, cadera, muslo, brazo, grasa, notas }

// Tabla: ajustes (clave-valor)
{ clave, valor }
```

## RUTINA DEFAULT (seed al primer arranque)

**Lunes · Glúteo Mayor & Femorales**
1. Hip Thrust con barra — 4 × 8-10 — Pausa de 1 s arriba
2. Peso Muerto Rumano (barra o mancuernas) — 4 × 10-12 — Empujar la cadera hacia atrás
3. Sentadilla Búlgara — 3 × 10 / pierna — Torso ligeramente inclinado al frente
4. Curl Femoral (acostado o sentado) — 3 × 12-15 — Bajada lenta en 2-3 s
5. Abducción de cadera en máquina — 3 × 15-20 — Última serie drop-set

**Martes · Torso Estratégico**
1. Jalón al pecho agarre abierto y prono — 4 × 10-12
2. Elevaciones laterales con mancuernas — 4 × 12-15 — Estrictas, sin impulso
3. Remo con soporte al pecho — 3 × 10-12 — Codos abiertos
4. Elevaciones laterales en polea unilateral — 3 × 15 / lado
5. Face Pulls en polea alta con cuerda — 3 × 15

**Miércoles · Cuádriceps & Glúteo**
1. Prensa de piernas inclinada — 4 × 10-12 — Pies a media plataforma
2. Sentadilla Goblet o Hack — 3 × 10-12
3. Zancadas caminando — 3 × 12 pasos / pierna
4. Extensiones de cuádriceps en máquina — 3 × 12-15 — Pausa de 1 s arriba
5. Patada de glúteo en polea baja (tobillera) — 3 × 12-15 / pierna — Ángulo 45° hacia afuera

**Jueves · Torso & Detalle**
1. Press militar con mancuernas (sentada) — 3 × 10-12
2. Remo en polea baja agarre neutro — 3 × 10-12
3. Elevaciones laterales en banco a 30° — 4 × 12-15
4. Pájaros con mancuerna o pec deck invertido — 3 × 15
5. Ext. tríceps en polea + Curl bíceps (superserie) — 3 × 12-15

**Viernes · Glúteo Hipertrofia & Bombeo**
1. Hip Thrust en máquina o Smith — 4 × 10-12 — Tensión continua
2. Peso Muerto B-Stance unilateral — 3 × 10 / pierna
3. Abducciones de cadera inclinada al frente — 4 × 15-20
4. Hiperextensiones en banco a 45° — 3 × 12-15 — Espalda redondeada
5. Paseos laterales con banda (Monster Walks) — 3 × 15 pasos / lado

**Bloque Core diario (todos los días, al final):**
1. Vacíos abdominales — 4 × 15-20 s
2. Plancha prona sobre codos — 3 × 30-45 s
3. Pallof Press en polea — 3 × 10-12 / lado

## MÓDULOS Y FUNCIONALIDAD

### 1. Inicio (Dashboard)
- Botón grande ▶ **Iniciar día** → crea registro en `sesiones` con fecha hoy y `horaInicio` = ahora. Redirige a "Hoy".
- Si ya existe sesión abierta hoy, muestra ⏹ **Terminar Gym**.
- Tarjetas: Sesión de hoy, Racha, Última medición, Mini gráfica de peso (Chart.js).
- Accesos rápidos: "Ver rutina", "Registrar medidas".

### 2. Hoy (Sesión activa)
- Determina el día de rutina por fecha (Lun=0 … Vie=4, Sáb/Dom=descanso)
- Botón **⏱ Iniciar Gym** → guarda `horaInicio` (si no existe)
- Botón **⏹ Terminar Gym** → guarda `horaFin`, calcula `duracionMin`, toast con duración
- Tabla de ejercicios con inputs por serie: Peso (numérico, `inputmode="decimal"`), Reps, RPE (select 6–10 en pasos de 0.5), Checkbox ✓ (marca verde)
- Botones **+ Agregar serie** y **+ Agregar ejercicio** (solo para esta sesión)
- Bloque de Core al final con checkbox
- Campos: Energía (1-10), Cardio/pasos, Notas del día
- **Guardado automático** en cada cambio (debounce 400ms). Indicador "Guardado ✓".
- Timer en vivo mientras la sesión está abierta (actualizar cada segundo)

### 3. Rutina (Configurador)
- Vista por días en acordeón
- Editar nombre, series, reps, nota; botón eliminar; drag handle para reordenar
- Botón **+ Agregar ejercicio** por día
- Toggle "Día de descanso"
- Botón **Restaurar rutina por defecto** (confirmación)
- Botón **Crear nueva rutina** (duplica la actual)
- Selector de rutina activa

### 4. Historial
- Lista cronológica descendente de sesiones
- Cada tarjeta: fecha, día, hora inicio–fin, duración, resumen de top 3 ejercicios
- Filtros: rango de fechas, día de rutina, ejercicio específico
- Click → modal con detalle completo
- Botón eliminar sesión (confirmación)

### 5. Medidas
- Formulario: fecha, peso, cintura, cadera, muslo, brazo, % grasa, notas
- Historial en tabla
- Gráfica por métrica seleccionable
- Botón editar/eliminar
- Recordatorio: "Han pasado X días desde tu última medición"

### 6. Progreso
- Chart.js:
  1. Peso corporal (línea)
  2. Cintura (línea)
  3. Fuerza por ejercicio: select → línea con peso máximo por sesión
  4. Volumen semanal: barras
  5. Frecuencia: heatmap tipo GitHub últimos 90 días
- Filtros de rango: 1M · 3M · 6M · 1A · Todo
- Responsive (`aspect-ratio`)

### 7. Ajustes
- Tema: claro / oscuro / auto
- Unidad: kg / lb
- **Exportar**: CSV sesiones, CSV medidas, XLSX (3 hojas), JSON backup
- **Importar** JSON (con confirmación)
- Botón **Borrar todos los datos** (doble confirmación escribiendo "BORRAR")

## EXPORTACIÓN — FORMATO EXACTO

### CSV sesiones (una fila por serie)
```
fecha,dia,ejercicio,serie,peso,reps,rpe,hora_inicio,hora_fin,duracion_min,energia,notas
2025-01-15,Lunes,Hip Thrust con barra,1,80,10,8,17:32,18:55,83,8,
```
UTF-8 con BOM para Excel.

### CSV medidas
```
fecha,peso,cintura,cadera,muslo,brazo,grasa,notas
2025-01-15,62.5,68,96,55,28,,
```

### XLSX
- Hoja "Sesiones" (formato largo)
- Hoja "Medidas"
- Hoja "Rutina"
- Encabezados en negrita, fondo `#C98B9B`, texto blanco

### JSON backup
```json
{ "version": 1, "exportado": "...", "rutinas": [], "sesiones": [], "medidas": [], "ajustes": [] }
```

## PWA

### manifest.json
```json
{
  "name": "Gym Wolf · Rutina 5 Días",
  "short_name": "Gym Wolf",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFAF8",
  "theme_color": "#3B2B3B",
  "lang": "es",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### sw.js
- Cache-first para assets (HTML, CSS, JS, iconos, CDN)
- Nombre `gymwolf-v1`, limpiar cachés antiguas al activar

## UI / UX

- Toasts arriba
- Modales con backdrop oscuro
- Confirmaciones para acciones destructivas
- Estados vacíos con SVG
- Iconos SVG inline (Feather o Lucide)
- Sin jQuery ni Bootstrap
- Accesibilidad: `aria-label`, `role`, teclado, contraste AA
- `inputmode="decimal"` en numéricos

## ENTREGABLES

Genera TODOS los archivos completos y funcionales:
1. `index.html`
2. `css/styles.css`
3. `manifest.json`
4. `sw.js`
5. `js/db.js`
6. `js/app.js`
7. `js/rutinas.js`
8. `js/sesion.js`
9. `js/medidas.js`
10. `js/progreso.js`
11. `js/historial.js`
12. `js/exportar.js`
13. `js/ui.js`
14. `README.md`

## RESTRICCIONES

- NO TypeScript
- NO bundlers
- NO frameworks (React, Vue, Svelte)
- NO npm, solo CDN
- Comentarios en español, breves
- Manejo de errores con try/catch + toast
- Router SPA hash-based (`#/hoy`, `#/rutina`, etc.)
- Prioriza que funcione HOY

## ORDEN DE GENERACIÓN

1) Estructura de archivos y `index.html`
2) `styles.css`
3) `db.js` con seed
4) `app.js` (router + shell)
5) Módulos uno por uno

Al final, dame instrucciones exactas para:
- Probar localmente
- Subir a GitHub Pages
- Instalar en Android y iPhone
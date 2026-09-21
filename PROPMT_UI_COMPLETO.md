# PROMPT MAESTRO UI · Gym Wolf PWA
# Temas, Paletas, Capitalización y Módulo Ajustes

> Pega este archivo completo en GitHub Copilot Chat (modo Agent).
> Reemplaza cualquier indicación previa sobre colores, botones o estilos.

---

# SECCIÓN 1 · FILOSOFÍA DE DISEÑO

La app se usará en el gym, muchas veces con luz tenue o a contraluz, en pantallas
pequeñas y de noche. Reglas no negociables:

- **Nada de blanco puro (#FFFFFF) como fondo de botones o superficies** — cansa la vista.
- **Nada de negro puro (#000000) como fondo** — cansa la vista.
- **Nada de texto gris claro sobre fondo claro** — mínimo 4.5:1 de contraste (WCAG AA).
- **Nada de acentos saturados tipo neón** — fatiga visual.
- **Colores empolvados / desaturados** — descansan la vista y se ven premium.
- **Superficies con tinte, nunca planas** — todo lleva un toque de color.
- **Jerarquía clara:** 1 color primario, 1 secundario, 1 acento. No más.

---

# SECCIÓN 2 · DESIGN TOKENS (variables CSS obligatorias)

TODOS los colores, espaciados, radios y sombras se definen UNA SOLA VEZ como
variables CSS. Ningún componente usa colores hardcodeados.

```css
:root {
  /* === COLORES BASE (cambian según tema) === */
  --bg:              /* fondo principal de la app */
  --bg-elev:         /* fondo elevado (cards, modales) */
  --bg-sunken:       /* fondo hundido (inputs, áreas internas) */
  --surface:         /* superficie de componentes */
  --surface-hover:   /* superficie en hover */
  --border:          /* bordes suaves */
  --border-strong:   /* bordes marcados */

  /* === TEXTO === */
  --text:            /* texto principal */
  --text-muted:      /* texto secundario */
  --text-disabled:   /* texto deshabilitado */
  --text-on-primary: /* texto sobre botón primario */

  /* === ACENTOS === */
  --primary:         /* color principal (botones CTA) */
  --primary-hover:   /* hover del primario */
  --primary-soft:    /* versión suave para fondos */
  --accent:          /* acento secundario */
  --accent-soft:     /* versión suave del acento */
  --success:         /* verde éxito */
  --success-soft:    /* verde suave */
  --warning:         /* ámbar advertencia */
  --danger:          /* rojo error */

  /* === ESPACIADO (escala 4px) === */
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px;
  --sp-4: 16px; --sp-5: 20px; --sp-6: 24px;
  --sp-8: 32px; --sp-10: 40px;

  /* === RADIOS === */
  --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 20px; --r-full: 999px;

  /* === SOMBRAS === */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.12);

  /* === TRANSICIONES === */
  --t-fast: 120ms ease;
  --t-base: 200ms ease;
  --t-slow: 320ms ease;

  /* === TIPOGRAFÍA === */
  --fs-xs: 12px; --fs-sm: 13px; --fs-base: 15px;
  --fs-md: 17px; --fs-lg: 20px; --fs-xl: 24px; --fs-2xl: 30px;
}
```

---

# SECCIÓN 3 · LAS 6 PALETAS OBLIGATORIAS

Cada paleta tiene versión CLARA y OSCURA. La app detecta `prefers-color-scheme`
al primer arranque. El usuario puede cambiarla desde Ajustes.

## A) ROSA SUAVE (default · femenina, cálida)

```css
:root[data-theme="light"][data-palette="rosa"] {
  --bg: #FAF3F5;
  --bg-elev: #FFFFFF;
  --bg-sunken: #F2E6EA;
  --surface: #FFFFFF;
  --surface-hover: #F9EEF1;
  --border: #EAD9DE;
  --border-strong: #D8BCC4;
  --text: #3A2A30;
  --text-muted: #7A6670;
  --text-disabled: #B9A8AF;
  --text-on-primary: #FFFFFF;
  --primary: #A86276;
  --primary-hover: #8E5063;
  --primary-soft: #F1DDE3;
  --accent: #B8894A;
  --accent-soft: #F3E5CE;
  --success: #5B8C5A;
  --success-soft: #E1EFE1;
  --danger: #B85C5C;
}

:root[data-theme="dark"][data-palette="rosa"] {
  --bg: #1F171B;
  --bg-elev: #2A2025;
  --bg-sunken: #171114;
  --surface: #2A2025;
  --surface-hover: #352830;
  --border: #3D2F36;
  --border-strong: #554148;
  --text: #F0E4E8;
  --text-muted: #A8969E;
  --text-disabled: #6B5A62;
  --text-on-primary: #FFFFFF;
  --primary: #C98B9B;
  --primary-hover: #D9A0AE;
  --primary-soft: #3A2830;
  --accent: #D4A574;
  --accent-soft: #3D3020;
  --success: #7FB07D;
  --success-soft: #253028;
  --danger: #D47B7B;
}
```

## B) MENTA FRESCA (verde salvia, natural)

```css
:root[data-theme="light"][data-palette="menta"] {
  --bg: #F2F6F2;
  --bg-elev: #FFFFFF;
  --bg-sunken: #E5EEE5;
  --surface: #FFFFFF;
  --surface-hover: #EEF4EE;
  --border: #D4E0D4;
  --border-strong: #B4C8B4;
  --text: #2A332B;
  --text-muted: #66756A;
  --text-disabled: #A2B0A4;
  --text-on-primary: #FFFFFF;
  --primary: #4F7A5C;
  --primary-hover: #3F6650;
  --primary-soft: #DCEADD;
  --accent: #8FA68E;
  --accent-soft: #E0E8DF;
  --success: #5B8C5A;
  --success-soft: #E1EFE1;
  --danger: #B85C5C;
}

:root[data-theme="dark"][data-palette="menta"] {
  --bg: #141A16;
  --bg-elev: #1D251F;
  --bg-sunken: #0F1411;
  --surface: #1D251F;
  --surface-hover: #263029;
  --border: #2C362F;
  --border-strong: #3F4D42;
  --text: #E4EDE6;
  --text-muted: #8FA095;
  --text-disabled: #55635A;
  --text-on-primary: #0F1411;
  --primary: #8FB89A;
  --primary-hover: #A5C9AE;
  --primary-soft: #253028;
  --accent: #A8BFA8;
  --accent-soft: #2A352B;
  --success: #7FB07D;
  --success-soft: #253028;
  --danger: #D47B7B;
}
```

## C) CIELO SUAVE (azul empolvado, profesional)

```css
:root[data-theme="light"][data-palette="cielo"] {
  --bg: #F2F5F8;
  --bg-elev: #FFFFFF;
  --bg-sunken: #E5EBF0;
  --surface: #FFFFFF;
  --surface-hover: #ECF1F5;
  --border: #D5DEE5;
  --border-strong: #B5C2CC;
  --text: #2A3238;
  --text-muted: #667580;
  --text-disabled: #A2AEB8;
  --text-on-primary: #FFFFFF;
  --primary: #4E6D8A;
  --primary-hover: #3E5A75;
  --primary-soft: #DCE6EE;
  --accent: #8FA5B8;
  --accent-soft: #E0E7ED;
  --success: #5B8C5A;
  --success-soft: #E1EFE1;
  --danger: #B85C5C;
}

:root[data-theme="dark"][data-palette="cielo"] {
  --bg: #131820;
  --bg-elev: #1C232C;
  --bg-sunken: #0E1218;
  --surface: #1C232C;
  --surface-hover: #252D38;
  --border: #2C3540;
  --border-strong: #3F4A58;
  --text: #E2E8EF;
  --text-muted: #8896A4;
  --text-disabled: #4F5A68;
  --text-on-primary: #0E1218;
  --primary: #8FAAC6;
  --primary-hover: #A5BDD6;
  --primary-soft: #222D3A;
  --accent: #A5B8C8;
  --accent-soft: #25303C;
  --success: #7FB07D;
  --success-soft: #253028;
  --danger: #D47B7B;
}
```

## D) ARENA CÁLIDA (beige, terroso, relajante)

```css
:root[data-theme="light"][data-palette="arena"] {
  --bg: #F8F4EE;
  --bg-elev: #FFFFFF;
  --bg-sunken: #EEE7DC;
  --surface: #FFFFFF;
  --surface-hover: #F2EBE0;
  --border: #E0D5C4;
  --border-strong: #C8B8A0;
  --text: #332D24;
  --text-muted: #786E5F;
  --text-disabled: #B0A594;
  --text-on-primary: #FFFFFF;
  --primary: #8A6E4F;
  --primary-hover: #6F5941;
  --primary-soft: #EBDFCC;
  --accent: #B8894A;
  --accent-soft: #F0E2CC;
  --success: #5B8C5A;
  --success-soft: #E1EFE1;
  --danger: #B85C5C;
}

:root[data-theme="dark"][data-palette="arena"] {
  --bg: #1A1712;
  --bg-elev: #24201A;
  --bg-sunken: #120F0B;
  --surface: #24201A;
  --surface-hover: #2E2922;
  --border: #38322A;
  --border-strong: #4D4538;
  --text: #EDE6DA;
  --text-muted: #9C9184;
  --text-disabled: #5F574C;
  --text-on-primary: #120F0B;
  --primary: #C4A47C;
  --primary-hover: #D4B58E;
  --primary-soft: #2E2820;
  --accent: #D4A574;
  --accent-soft: #33291C;
  --success: #7FB07D;
  --success-soft: #253028;
  --danger: #D47B7B;
}
```

## E) LAVANDA SUAVE (violeta empolvado, elegante)

```css
:root[data-theme="light"][data-palette="lavanda"] {
  --bg: #F5F2F8;
  --bg-elev: #FFFFFF;
  --bg-sunken: #EBE5F1;
  --surface: #FFFFFF;
  --surface-hover: #F0EBF5;
  --border: #DDD5E5;
  --border-strong: #BFB3CC;
  --text: #2E2A35;
  --text-muted: #6E6578;
  --text-disabled: #ADA4B4;
  --text-on-primary: #FFFFFF;
  --primary: #6B5588;
  --primary-hover: #574472;
  --primary-soft: #E3DAEF;
  --accent: #8F7AA8;
  --accent-soft: #E8E0EF;
  --success: #5B8C5A;
  --success-soft: #E1EFE1;
  --danger: #B85C5C;
}

:root[data-theme="dark"][data-palette="lavanda"] {
  --bg: #17141C;
  --bg-elev: #201C27;
  --bg-sunken: #110E15;
  --surface: #201C27;
  --surface-hover: #2A2533;
  --border: #322C3D;
  --border-strong: #463E54;
  --text: #E8E2EE;
  --text-muted: #928A9C;
  --text-disabled: #544D5E;
  --text-on-primary: #110E15;
  --primary: #A896C4;
  --primary-hover: #BCAAD4;
  --primary-soft: #272136;
  --accent: #B8A5D0;
  --accent-soft: #2A2337;
  --success: #7FB07D;
  --success-soft: #253028;
  --danger: #D47B7B;
}
```

## F) MEDIANOCHE (azul profundo, dramático)

```css
:root[data-theme="light"][data-palette="medianoche"] {
  --bg: #F0F2F7;
  --bg-elev: #FFFFFF;
  --bg-sunken: #E2E6EF;
  --surface: #FFFFFF;
  --surface-hover: #EAEEF5;
  --border: #D0D7E3;
  --border-strong: #AEB8CB;
  --text: #23293A;
  --text-muted: #5F6678;
  --text-disabled: #9CA4B4;
  --text-on-primary: #FFFFFF;
  --primary: #3F4E6E;
  --primary-hover: #2F3C58;
  --primary-soft: #D6DCEC;
  --accent: #7A8AB0;
  --accent-soft: #E0E5F0;
  --success: #5B8C5A;
  --success-soft: #E1EFE1;
  --danger: #B85C5C;
}

:root[data-theme="dark"][data-palette="medianoche"] {
  --bg: #0F1319;
  --bg-elev: #171C24;
  --bg-sunken: #0A0D12;
  --surface: #171C24;
  --surface-hover: #1F2530;
  --border: #262D3A;
  --border-strong: #384254;
  --text: #E0E6F0;
  --text-muted: #8690A0;
  --text-disabled: #4A5364;
  --text-on-primary: #0A0D12;
  --primary: #8FA0C8;
  --primary-hover: #A8B6D6;
  --primary-soft: #1E2536;
  --accent: #A5B2CE;
  --accent-soft: #232A3A;
  --success: #7FB07D;
  --success-soft: #253028;
  --danger: #D47B7B;
}
```

---

# SECCIÓN 4 · ESPECIFICACIÓN DE COMPONENTES

## Botón primario (CTA)
```css
background: var(--primary);
color: var(--text-on-primary);
border: none;
padding: var(--sp-3) var(--sp-5);
border-radius: var(--r-md);
font-weight: 600;
font-size: 15px;
transition: background var(--t-fast), transform var(--t-fast);
box-shadow: var(--shadow-sm);
cursor: pointer;
```
- **hover:** `background: var(--primary-hover); transform: translateY(-1px);`
- **active:** `transform: translateY(0);`
- **focus-visible:** `outline: 2px solid var(--primary); outline-offset: 2px;`
- **disabled:** `opacity: .5; cursor: not-allowed;`

## Botón secundario
```css
background: var(--primary-soft);
color: var(--primary);
border: 1px solid var(--border-strong);
```

## Botón fantasma (bottom-nav)
```css
background: transparent;
color: var(--text-muted);
border: none;
padding: var(--sp-2);
```
- **activo:** `color: var(--primary); background: var(--primary-soft);`

## Input / Select / Textarea
```css
background: var(--bg-sunken);
color: var(--text);
border: 1px solid var(--border);
border-radius: var(--r-sm);
padding: var(--sp-3) var(--sp-4);
font-size: 15px;
```
- **focus:** `border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); outline: none;`
- **placeholder:** `color: var(--text-disabled);`
- **invalid:** `border-color: var(--danger);`

## Card / Superficie
```css
background: var(--bg-elev);
border: 1px solid var(--border);
border-radius: var(--r-lg);
padding: var(--sp-5);
box-shadow: var(--shadow-sm);
```

## Tabla de ejercicios
- Cabecera: `background: var(--primary-soft); color: var(--primary); font-weight: 600;`
- Filas: `var(--surface)` alternas con `var(--surface-hover)`
- Inputs dentro: fondo `var(--bg-sunken)`
- Fila completada: `background: var(--success-soft); border-left: 3px solid var(--success);`

## Header superior
- Fondo: `var(--bg-elev)` con `border-bottom: 1px solid var(--border)`
- **NO** uses `var(--primary)` de fondo — cansa la vista

## Bottom-nav / Sidebar
- Fondo: `var(--bg-elev)`
- Ítem activo: ícono `var(--primary)` + label `var(--text)` + fondo `var(--primary-soft)`
- Ítem inactivo: `var(--text-muted)`

---

# SECCIÓN 5 · REGLAS DE CONTRASTE (OBLIGATORIAS)

- **Texto normal (<18px):** ratio mínimo **4.5:1**
- **Texto grande (>=18px bold):** ratio mínimo **3:1**
- **Iconos funcionales:** mínimo **3:1**
- **Bordes de inputs:** mínimo **3:1**

**Prohibiciones explícitas:**
- ❌ `color: white` sobre `background: #FFFFFF`
- ❌ Texto `#999` sobre `#FFF`
- ❌ Botones con `background: white` y `color: #DDD`
- ❌ Acentos saturados (`#FF0000`, `#00FF00`, `#0000FF`)

---

# SECCIÓN 6 · CAPITALIZACIÓN DE TEXTOS

Todo texto visible debe seguir **capitalización tipo título en español**.

## Reglas generales

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Títulos de módulos | Primera mayúscula | `Inicio`, `Hoy`, `Progreso`, `Medidas` |
| Botones | Primera mayúscula | `Iniciar día`, `Terminar gym`, `Guardar` |
| Labels | Primera mayúscula | `Peso (kg)`, `Cintura`, `Hora de inicio` |
| Placeholders | Primera mayúscula | `Ingresa tu peso`, `Escribe una nota` |
| Nombres de ejercicios | Título español | `Hip Thrust con Barra` |
| Días | Primera mayúscula | `Lunes`, `Martes`, `Miércoles` |
| Paletas | Título | `Rosa Suave`, `Menta Fresca` |
| Modos de tema | Primera mayúscula | `Claro`, `Oscuro`, `Auto` |
| Encabezados tabla | Primera mayúscula | `Ejercicio`, `Series`, `Peso`, `Reps` |
| Toasts | Primera mayúscula, sin punto | `Serie guardada`, `Sesión terminada` |
| Errores | Primera mayúscula, con punto | `No se pudo guardar la sesión.` |
| Estados vacíos | Primera mayúscula, con punto | `Sin sesiones registradas.` |
| Unidades | Minúscula | `kg`, `cm`, `min`, `L`, `h`, `s` |
| Siglas | Mayúscula | `RPE`, `B-Stance`, `IMC` |

## Nombres de ejercicios (corregir exactamente así)

**Lunes:**
1. `Hip Thrust con Barra`
2. `Peso Muerto Rumano`
3. `Sentadilla Búlgara`
4. `Curl Femoral (Acostado o Sentado)`
5. `Abducción de Cadera en Máquina`

**Martes:**
1. `Jalón al Pecho Agarre Abierto y Prono`
2. `Elevaciones Laterales con Mancuernas`
3. `Remo con Soporte al Pecho`
4. `Elevaciones Laterales en Polea (Unilateral)`
5. `Face Pulls en Polea Alta con Cuerda`

**Miércoles:**
1. `Prensa de Piernas Inclinada`
2. `Sentadilla Goblet o en Máquina Hack`
3. `Zancadas Caminando`
4. `Extensiones de Cuádriceps en Máquina`
5. `Patada de Glúteo en Polea Baja`

**Jueves:**
1. `Press Militar con Mancuernas`
2. `Remo en Polea Baja Agarre Neutro`
3. `Elevaciones Laterales en Banco a 30°`
4. `Pájaros con Mancuerna o Pec Deck Invertido`
5. `Extensión de Tríceps en Polea + Curl de Bíceps`

**Viernes:**
1. `Hip Thrust en Máquina o Smith`
2. `Peso Muerto B-Stance`
3. `Abducciones de Cadera Inclinada al Frente`
4. `Hiperextensiones en Banco a 45°`
5. `Paseos Laterales con Banda`

**Core:**
1. `Vacíos Abdominales`
2. `Plancha Prona sobre Codos`
3. `Pallof Press en Polea`

## Helpers en `js/ui.js`

```js
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function tituloEspanol(str) {
  if (!str) return '';
  const conectores = ['de','con','en','y','o','a','del','la','el','al','por','para'];
  return str.toLowerCase().split(' ').map((p, i) => {
    if (i === 0) return p.charAt(0).toUpperCase() + p.slice(1);
    if (conectores.includes(p)) return p;
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
}

export function frase(str) {
  if (!str) return '';
  const c = capitalize(str.trim());
  return c.endsWith('.') ? c : c + '.';
}
```

**Importante:** NO usar `text-transform` en CSS. La corrección debe ser en el
texto fuente (HTML/JS) para que también aplique a exportaciones CSV/JSON.

---

# SECCIÓN 7 · MINIATURAS SVG DE PALETAS

Insertar dentro del módulo Ajustes donde va el grid de paletas:

```html
<div class="theme-palette-grid" role="radiogroup" aria-label="Seleccionar paleta de colores">

  <button class="palette-thumb" data-palette="rosa" role="radio" aria-checked="false" aria-label="Paleta Rosa Suave">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#A86276"/>
      <circle cx="18" cy="38" r="9" fill="#B8894A"/>
      <circle cx="46" cy="38" r="9" fill="#F1DDE3"/>
      <circle cx="32" cy="52" r="6" fill="#5B8C5A"/>
    </svg>
    <span class="palette-name">Rosa Suave</span>
  </button>

  <button class="palette-thumb" data-palette="menta" role="radio" aria-checked="false" aria-label="Paleta Menta Fresca">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#4F7A5C"/>
      <circle cx="18" cy="38" r="9" fill="#8FA68E"/>
      <circle cx="46" cy="38" r="9" fill="#DCEADD"/>
      <circle cx="32" cy="52" r="6" fill="#5B8C5A"/>
    </svg>
    <span class="palette-name">Menta Fresca</span>
  </button>

  <button class="palette-thumb" data-palette="cielo" role="radio" aria-checked="false" aria-label="Paleta Cielo Suave">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#4E6D8A"/>
      <circle cx="18" cy="38" r="9" fill="#8FA5B8"/>
      <circle cx="46" cy="38" r="9" fill="#DCE6EE"/>
      <circle cx="32" cy="52" r="6" fill="#5B8C5A"/>
    </svg>
    <span class="palette-name">Cielo Suave</span>
  </button>

  <button class="palette-thumb" data-palette="arena" role="radio" aria-checked="false" aria-label="Paleta Arena Cálida">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#8A6E4F"/>
      <circle cx="18" cy="38" r="9" fill="#B8894A"/>
      <circle cx="46" cy="38" r="9" fill="#EBDFCC"/>
      <circle cx="32" cy="52" r="6" fill="#5B8C5A"/>
    </svg>
    <span class="palette-name">Arena Cálida</span>
  </button>

  <button class="palette-thumb" data-palette="lavanda" role="radio" aria-checked="false" aria-label="Paleta Lavanda Suave">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#6B5588"/>
      <circle cx="18" cy="38" r="9" fill="#8F7AA8"/>
      <circle cx="46" cy="38" r="9" fill="#E3DAEF"/>
      <circle cx="32" cy="52" r="6" fill="#5B8C5A"/>
    </svg>
    <span class="palette-name">Lavanda Suave</span>
  </button>

  <button class="palette-thumb" data-palette="medianoche" role="radio" aria-checked="false" aria-label="Paleta Medianoche">
    <svg viewBox="0 0 64 64" class="palette-svg" aria-hidden="true">
      <circle cx="32" cy="14" r="9" fill="#3F4E6E"/>
      <circle cx="18" cy="38" r="9" fill="#7A8AB0"/>
      <circle cx="46" cy="38" r="9" fill="#D6DCEC"/>
      <circle cx="32" cy="52" r="6" fill="#5B8C5A"/>
    </svg>
    <span class="palette-name">Medianoche</span>
  </button>

</div>
```

---

# SECCIÓN 8 · CSS DEL SELECTOR DE PALETAS

```css
.theme-palette-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
}

@media (min-width: 480px) {
  .theme-palette-grid { grid-template-columns: repeat(3, 1fr); }
}

.palette-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-2);
  background: var(--bg-elev);
  border: 2px solid var(--border);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: border-color var(--t-fast), background var(--t-fast), transform var(--t-fast);
  font-family: inherit;
  color: var(--text);
}

.palette-thumb:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
}

.palette-thumb:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.palette-thumb[aria-checked="true"] {
  border-color: var(--primary);
  background: var(--primary-soft);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.palette-svg {
  width: 56px;
  height: 56px;
  display: block;
}

.palette-name {
  font-size: var(--fs-xs, 12px);
  font-weight: 600;
  color: var(--text);
  text-align: center;
  line-height: 1.2;
}

:root[data-theme="dark"] .palette-thumb {
  background: var(--bg-sunken);
}

/* Modo de tema · píldoras */
.theme-mode-group {
  display: inline-flex;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  border-radius: var(--r-full);
  padding: 4px;
  gap: 2px;
}

.theme-mode-btn {
  padding: var(--sp-2) var(--sp-4);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--fs-sm, 13px);
  font-weight: 600;
  border-radius: var(--r-full);
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
}

.theme-mode-btn:hover { color: var(--text); }

.theme-mode-btn[aria-checked="true"] {
  background: var(--primary);
  color: var(--text-on-primary);
  box-shadow: var(--shadow-sm);
}

/* Cards del módulo Ajustes */
.card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
  margin-bottom: var(--sp-4);
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: var(--fs-md, 17px);
  font-weight: 700;
  color: var(--text);
  margin: 0 0 var(--sp-4) 0;
}

.card-muted { background: var(--bg-sunken); }

.field { margin-bottom: var(--sp-5); }
.field:last-child { margin-bottom: 0; }

.field-label {
  display: block;
  font-size: var(--fs-sm, 13px);
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: var(--sp-2);
}

.btn-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-5);
  border: none;
  border-radius: var(--r-md);
  font-size: var(--fs-base, 15px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast);
}

.btn-secondary {
  background: var(--bg-sunken);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--danger);
  color: #FFFFFF;
}
.btn-danger:hover {
  filter: brightness(0.92);
  transform: translateY(-1px);
}

.danger-zone {
  margin-top: var(--sp-5);
  padding: var(--sp-4);
  background: rgba(184, 92, 92, 0.06);
  border: 1px dashed var(--danger);
  border-radius: var(--r-md);
}
.danger-title {
  font-size: var(--fs-base, 15px);
  font-weight: 700;
  color: var(--danger);
  margin: 0 0 var(--sp-2) 0;
}
.danger-text {
  font-size: var(--fs-sm, 13px);
  color: var(--text-muted);
  margin: 0 0 var(--sp-3) 0;
  line-height: 1.5;
}
.text-muted {
  font-size: var(--fs-sm, 13px);
  color: var(--text-muted);
  margin: var(--sp-1) 0;
}
```

---

# SECCIÓN 9 · MÓDULO AJUSTES COMPLETO (HTML)

```html
<section id="ajustes" class="module" hidden>
  <header class="module-header">
    <h1>Ajustes</h1>
  </header>

  <div class="card">
    <h2 class="card-title">Apariencia</h2>

    <div class="field">
      <label class="field-label">Modo de tema</label>
      <div class="theme-mode-group" role="radiogroup" aria-label="Modo de tema">
        <button class="theme-mode-btn" data-mode="light" role="radio" aria-checked="false">
          <span aria-hidden="true">☀</span> Claro
        </button>
        <button class="theme-mode-btn" data-mode="dark" role="radio" aria-checked="false">
          <span aria-hidden="true">🌙</span> Oscuro
        </button>
        <button class="theme-mode-btn" data-mode="auto" role="radio" aria-checked="true">
          <span aria-hidden="true">⚙</span> Auto
        </button>
      </div>
    </div>

    <div class="field">
      <label class="field-label">Paleta de colores</label>
      <!-- Aquí van las 6 miniaturas SVG de la Sección 7 -->
    </div>
  </div>

  <div class="card">
    <h2 class="card-title">Unidades</h2>
    <div class="field">
      <label class="field-label">Sistema de peso</label>
      <div class="theme-mode-group" role="radiogroup" aria-label="Unidad de peso">
        <button class="theme-mode-btn" data-unit="kg" role="radio" aria-checked="true">Kilogramos (kg)</button>
        <button class="theme-mode-btn" data-unit="lb" role="radio" aria-checked="false">Libras (lb)</button>
      </div>
    </div>
  </div>

  <div class="card">
    <h2 class="card-title">Datos</h2>
    <div class="btn-list">
      <button class="btn btn-secondary" data-action="export-csv">
        <span aria-hidden="true">📄</span> Exportar CSV de sesiones
      </button>
      <button class="btn btn-secondary" data-action="export-xlsx">
        <span aria-hidden="true">📊</span> Exportar Excel (.xlsx)
      </button>
      <button class="btn btn-secondary" data-action="export-json">
        <span aria-hidden="true">💾</span> Exportar backup JSON
      </button>
      <button class="btn btn-secondary" data-action="import-json">
        <span aria-hidden="true">📥</span> Importar backup JSON
      </button>
    </div>

    <div class="danger-zone">
      <h3 class="danger-title">Zona de peligro</h3>
      <p class="danger-text">
        Esta acción borra todas las sesiones, medidas y rutinas personalizadas.
        No se puede deshacer.
      </p>
      <button class="btn btn-danger" data-action="wipe-data">
        <span aria-hidden="true">🗑</span> Borrar todos los datos
      </button>
    </div>
  </div>

  <div class="card card-muted">
    <h2 class="card-title">Acerca de</h2>
    <p class="text-muted">Gym Wolf · Rutina 5 Días</p>
    <p class="text-muted">Versión 1.0 · Funciona sin conexión</p>
  </div>
</section>
```

---

# SECCIÓN 10 · JS DEL MÓDULO AJUSTES (`js/ajustes.js`)

```js
import { db } from './db.js';
import { toast, confirmar } from './ui.js';
import { exportarCSV, exportarXLSX, exportarJSON, importarJSON } from './exportar.js';

const STORAGE_KEY = 'gw_tema';

function leerPreferencias() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function guardarPreferencias(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function aplicarTema(modo, paleta) {
  const html = document.documentElement;
  const temaEfectivo = modo === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : modo;

  html.setAttribute('data-theme', temaEfectivo);
  html.setAttribute('data-palette', paleta);

  document.querySelectorAll('.theme-mode-btn').forEach(btn => {
    btn.setAttribute('aria-checked', String(btn.dataset.mode === modo));
  });
  document.querySelectorAll('.palette-thumb').forEach(btn => {
    btn.setAttribute('aria-checked', String(btn.dataset.palette === paleta));
  });
}

export function inicializarAjustes() {
  const prefs = leerPreferencias() || { modo: 'auto', paleta: 'rosa' };
  aplicarTema(prefs.modo, prefs.paleta);

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const p = leerPreferencias() || { modo: 'auto', paleta: 'rosa' };
    if (p.modo === 'auto') aplicarTema('auto', p.paleta);
  });

  document.querySelectorAll('.theme-mode-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prefs = leerPreferencias() || { modo: 'auto', paleta: 'rosa' };
      prefs.modo = btn.dataset.mode;
      guardarPreferencias(prefs);
      aplicarTema(prefs.modo, prefs.paleta);
      toast(`Modo ${btn.textContent.trim()} activado`);
    });
  });

  document.querySelectorAll('.palette-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const prefs = leerPreferencias() || { modo: 'auto', paleta: 'rosa' };
      prefs.paleta = btn.dataset.palette;
      guardarPreferencias(prefs);
      aplicarTema(prefs.modo, prefs.paleta);
      toast(`Paleta ${btn.querySelector('.palette-name').textContent} aplicada`);
    });
  });

  document.querySelector('[data-action="export-csv"]')
    ?.addEventListener('click', () => exportarCSV());
  document.querySelector('[data-action="export-xlsx"]')
    ?.addEventListener('click', () => exportarXLSX());
  document.querySelector('[data-action="export-json"]')
    ?.addEventListener('click', () => exportarJSON());
  document.querySelector('[data-action="import-json"]')
    ?.addEventListener('click', () => importarJSON());

  document.querySelector('[data-action="wipe-data"]')
    ?.addEventListener('click', async () => {
      const ok = await confirmar({
        titulo: 'Borrar todos los datos',
        mensaje: 'Escribe BORRAR para confirmar. Esta acción es irreversible.',
        requiereTexto: 'BORRAR',
        peligro: true,
      });
      if (!ok) return;
      await db.sesiones.clear();
      await db.medidas.clear();
      await db.rutinas.clear();
      await db.ajustes.clear();
      localStorage.clear();
      toast('Todos los datos fueron eliminados');
      setTimeout(() => location.reload(), 900);
    });
}
```

---

# SECCIÓN 11 · TRANSICIONES Y TIPOGRAFÍA

```css
body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  font-size: var(--fs-base);
  line-height: 1.5;
  color: var(--text);
  background: var(--bg);
  transition: background var(--t-slow), color var(--t-slow);
}

h1, h2, h3 { line-height: 1.2; font-weight: 700; }

/* NO usar transition: all — rompe rendimiento */
/* Solo animar background, color, border-color, transform, box-shadow */
```

---

# SECCIÓN 12 · ORDEN DE APLICACIÓN PARA COPILOT

Ejecuta en este orden exacto:

1. **Tokens base** → define `:root` con todos los design tokens
2. **12 combinaciones CSS** → 6 paletas × 2 modos con `[data-theme][data-palette]`
3. **Componentes** → refactoriza botones, inputs, cards, tabla para usar `var(--*)`
   - Elimina cualquier `background: #fff`, `color: #000`, `background: white`
4. **Miniaturas SVG** → inserta el grid en el módulo Ajustes
5. **CSS del selector** → agrega los bloques de las Secciones 8 y 11
6. **Módulo Ajustes HTML** → la estructura de la Sección 9
7. **JS del módulo** → `js/ajustes.js` de la Sección 10
8. **Conectar en app.js** → llamar `inicializarAjustes()` al arrancar
9. **Capitalización** → aplicar helpers y corregir textos en todos los módulos
10. **Verificar con el checklist** de la Sección 13

---

# SECCIÓN 13 · CHECKLIST DE VERIFICACIÓN

Antes de dar por terminada la UI, verificar:

- [ ] Ningún botón tiene `background: white` o `#FFF`
- [ ] Ningún texto tiene contraste menor a 4.5:1
- [ ] Todos los inputs usan `var(--bg-sunken)`, no blanco puro
- [ ] Todos los colores vienen de variables, ninguno hardcodeado
- [ ] Las 6 paletas funcionan en modo claro y oscuro (12 combinaciones)
- [ ] El selector de tema funciona y se ve con miniaturas de 4 círculos
- [ ] El tema se persiste al recargar
- [ ] Se detecta `prefers-color-scheme` al primer arranque
- [ ] Todos los botones tienen hover, focus-visible, active y disabled
- [ ] Ningún título está en minúsculas sueltas
- [ ] Todos los botones empiezan con mayúscula
- [ ] Los nombres de ejercicios tienen capitalización tipo título
- [ ] Los toasts empiezan con mayúscula y no llevan punto final
- [ ] Los mensajes de error terminan con punto
- [ ] Al exportar CSV/JSON, los textos salen capitalizados
- [ ] Las paletas se ven `Rosa Suave`, no `rosa suave`
- [ ] La zona de peligro pide escribir `BORRAR` antes de borrar

---

# SECCIÓN 14 · CÓMO APLICAR EN COPILOT

## Paso 1 · Guardar este archivo
Crea `PROMPT_UI_COMPLETO.md` en la raíz de `gymwolf-pwa` y pega todo este contenido.

## Paso 2 · Pedirle a Copilot Chat (modo Agent)
```
Lee el archivo PROMPT_UI_COMPLETO.md y aplica TODO en el orden de la Sección 12:
1. Tokens base en :root
2. Las 12 combinaciones [data-theme][data-palette]
3. Refactorizar todos los componentes para usar var(--*)
4. Insertar miniaturas SVG en #ajustes
5. Agregar CSS del selector y tipografía
6. Estructura HTML del módulo Ajustes
7. Crear js/ajustes.js
8. Conectar inicializarAjustes() en app.js
9. Aplicar helpers de capitalización en todos los módulos
10. Verificar checklist de la Sección 13
```

## Paso 3 · Si Copilot se pierde, itera
```
→ "Solo agrega los tokens base y las 12 combinaciones CSS"
→ "Ahora refactoriza el botón primario para usar var(--*)"
→ "Ahora los inputs"
→ "Ahora la tabla de ejercicios"
→ "Ahora las miniaturas SVG en #ajustes"
→ "Ahora el CSS del selector de paletas"
→ "Ahora el HTML completo del módulo Ajustes"
→ "Ahora js/ajustes.js"
→ "Ahora conéctalo en app.js"
→ "Ahora aplica los helpers de capitalización"
```

---

# SECCIÓN 15 · SUBIR A GITHUB PAGES

## Paso 1 · Probar localmente
Abre terminal en `gymwolf-pwa` y ejecuta:

```bash
# Opción A: Python (viene instalado en Mac/Linux)
python3 -m http.server 8080

# Opción B: Node.js
npx serve

# Opción C: VS Code con Live Server
# Clic derecho en index.html → "Open with Live Server"
```

Abre **http://localhost:8080** y verifica:
- [ ] Cambia entre las 6 paletas → todo cambia al instante
- [ ] Cambia entre claro/oscuro/auto → se aplica sin recargar
- [ ] Recarga la página → mantiene el tema elegido
- [ ] Los textos están capitalizados
- [ ] Los botones no deslumbran

## Paso 2 · Crear el repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `gymwolf-pwa`
3. **Público** (necesario para Pages gratis)
4. NO inicialices con README
5. Clic en **Create repository**

## Paso 3 · Subir el código
En la terminal, dentro de `gymwolf-pwa`:

```bash
git init
git add .
git commit -m "Gym Wolf PWA · UI completa con temas y capitalización"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/gymwolf-pwa.git
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu usuario real de GitHub.

## Paso 4 · Activar GitHub Pages
1. En GitHub, entra a tu repo → **Settings**
2. Menú lateral → **Pages**
3. En **Source**: `Deploy from a branch`
4. En **Branch**: `main` · carpeta `/ (root)`
5. Clic en **Save**
6. Espera 1-2 minutos
7. Tu app estará en:
```
https://TU_USUARIO.github.io/gymwolf-pwa/
```

## Paso 5 · Instalar en el celular

### Android (Chrome)
1. Abre la URL en Chrome
2. Menú ⋮ → **Añadir a pantalla de inicio**
3. Confirma → aparece el ícono en tu launcher
4. Ábrela → funciona offline, pantalla completa

### iPhone (Safari · obligatorio)
1. Abre la URL en **Safari** (no Chrome)
2. Botón Compartir (□↑)
3. Desliza → **Añadir a pantalla de inicio**
4. Confirma
5. Ábrela desde el ícono → funciona offline

### Escritorio (Chrome/Edge)
1. Abre la URL
2. En la barra de direcciones aparece un ícono **⊕ Instalar**
3. Clic → se abre como app independiente

## Paso 6 · Actualizar la app después de cambios
Cada vez que modifiques archivos:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

GitHub Pages se actualiza automáticamente en 1-2 minutos.

**Importante:** si cambias el Service Worker o el CSS, fuerza la recarga en el
celular cerrando y reabriendo la PWA. Si sigue cacheada, sube la versión del
caché en `sw.js` (`gymwolf-v1` → `gymwolf-v2`).

---

# SECCIÓN 16 · SOLUCIÓN DE PROBLEMAS

| Problema | Solución |
|----------|----------|
| Service Worker no funciona | Estás usando `file://` → usa servidor local |
| La app no es instalable | Verifica que `manifest.json` esté accesible y haya HTTPS |
| No cambia el tema al hacer click | Revisa que `data-theme` y `data-palette` estén en `<html>` |
| Un texto no se ve bien | Verifica contraste WCAG AA mínimo 4.5:1 |
| Los textos salen en minúscula | Revisa que no uses `text-transform` en CSS; corrige en origen |
| Se ve mal en móvil | Verifica el `<meta viewport>` en el `<head>` |
| Exportación XLSX vacía | Verifica que SheetJS cargó desde CDN |
| Cambios no se reflejan en el celular | Sube versión del caché en `sw.js` |

---

# FIN DEL PROMPT

Aplica todo lo anterior y avísame al terminar con un resumen de qué archivos
modificaste y qué secciones aplicaste.
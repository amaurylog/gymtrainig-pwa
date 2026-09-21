# Gym Wolf PWA

PWA offline-first para registrar rutina de gimnasio, sesiones, medidas corporales y progreso.

## Cómo probar localmente

Necesitas servir la carpeta con un servidor estático. No uses `file://` porque el Service Worker no funciona así.

Opciones rápidas:

1. VS Code Live Server.
2. Python:
   ```bash
   python -m http.server 8000
   ```
3. Cualquier servidor estático equivalente.

Abre luego `http://localhost:8000`.

## Subir a GitHub Pages

1. Sube la carpeta `gymwolf-pwa` como contenido estático del repositorio.
2. En GitHub, ve a Settings > Pages.
3. Selecciona la rama y la carpeta raíz del sitio.
4. Guarda y espera la URL pública.
5. Entra una vez conectado a internet para que se cacheen los assets y luego prueba offline.

## Instalar en Android

1. Abre la URL en Chrome.
2. Espera a que cargue completamente.
3. Toca el menú y elige "Añadir a pantalla de inicio" o "Instalar app".
4. Confirma.

## Instalar en iPhone

1. Abre la URL en Safari.
2. Toca Compartir.
3. Elige "Añadir a pantalla de inicio".
4. Confirma.

## Notas

- La app guarda datos en IndexedDB.
- La exportación incluye CSV, XLSX y JSON.
- Si cambias de dispositivo, usa el JSON de respaldo para importar tus datos.

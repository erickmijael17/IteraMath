# Fase 11: PWA y Funcionamiento Offline

## 1. Web App Manifest
Se ha configurado la aplicación para ser instalable como una Progressive Web App. El manifest se genera automáticamente y configura:
- Nombre: `IteraMath`
- Modo `standalone` para que luzca y se comporte como una aplicación nativa.
- Esquema de colores alineado al sistema de diseño (primario y fondo).

## 2. Service Worker y Estrategia de Caché
- Se integró `vite-plugin-pwa` para asegurar compatibilidad total y sin fricción con el sistema de build (Vite).
- Generación automática de `sw.js` mediante Workbox.
- Se ha configurado **Pre-caching** de todos los recursos (HTML, JS, CSS y el icono SVG).
- Para alojar a Math.js y Plotly (que son dependencias de gran volumen debido a su complejidad matemática y de renderizado de gráficas), el límite del Service Worker se amplió a 10 MiB, garantizando que todo el bundle vital quede guardado offline de forma segura en la caché del navegador.
- Actualización automática: Si el usuario recupera internet y hay una versión nueva del código, el Service Worker instalará los nuevos recursos en segundo plano.

## 3. Funcionamiento Offline
- **App Shell**: La interfaz completa de IteraMath cargará en modo avión/sin conexión usando los archivos interceptados por el Service Worker.
- **Gráficas y Cálculo**: No dependen de servidores ni de CDNs externos (Math.js y Plotly.js fueron confirmadas como dependencias empaquetadas internamente).
- **IndexedDB**: El Storage del historial, manejado en Fases previas, funciona de forma ortogonal y perfecta sin red. Los ejercicios se siguen guardando y leyendo localmente de forma asíncrona.
- **Indicador Visual**: Cuando el navegador detecte que se ha perdido conexión a la red (`navigator.onLine === false` o mediante el evento `offline`), se mostrará un pequeño badge amarillo indicando "Sin conexión" en el Header. Volverá a ocultarse mediante el evento `online`.

## 4. Archivos Clave
- `vite.config.ts`: Modificado para invocar al plugin de PWA con los parámetros, iconos (SVG) y límites de caché requeridos.
- `src/main.ts`: Inyectado el código `registerSW` de `virtual:pwa-register` e incorporados los Web API Listeners de `offline` / `online`.
- `public/icon.svg`: Ícono base usado por el Manifest (es escalable e independiente de la resolución).

## 5. Pruebas Realizadas
- `npm run build` completó sin problemas empaquetando 10 archivos bajo Precache, sumando ~5MB.
- La ejecución local con `npm run preview` valida el modo producción con manifest y service worker inyectados.
- Las 137 pruebas unitarias de TypeScript/Matemáticas pasaron correctamente demostrando que no se afectó la estabilidad de ninguna rutina numérica de fases anteriores.

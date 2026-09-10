# Reporte de QA y Errores (Fase 12)

Este documento detalla los hallazgos técnicos o de experiencia de usuario descubiertos durante las pruebas exhaustivas a todo el sistema IteraMath.

## Resumen de Severidad
- **Critical (0 abiertos, 0 reportados):** El sistema central matemático nunca arrojó excepciones no capturadas.
- **High (0 abiertos, 0 reportados):** El layout y la aplicación funcionan íntegros sin bloqueos de la UI ni crashes lógicos.
- **Medium (0 abiertos, 1 reportado y corregido):** Fuga de estado al cambiar métodos matemáticos.
- **Low (0 abiertos, 1 reportado y corregido):** Assets del Service Worker declarados pero no instanciados.

---

## Historial de Bugs Corregidos

### Bug #1: Limpieza del estado residual al cambiar de método (Medium)
- **Problema:** Si el usuario resolvía un ejercicio en `Newton` (con gráficas de tangentes) y luego, sin presionar "Limpiar", cambiaba el selector desplegable a `Müller`, los inputs cambiaban pero el panel derecho seguía exhibiendo resultados viejos y derivados de Newton.
- **Pasos de Reproducción:** Newton -> Resolver -> Cambiar a Müller en Dropdown.
- **Resultado Actual:** La tabla y gráfica de Newton permanecían en pantalla.
- **Resultado Esperado:** Altera la configuración subyacente y limpia el resultado obsoleto, forzando un reinicio visual que coincide con los inputs frescos.
- **Corrección:** Se modificó `src/ui/methodForm.ts` inyectando la rutina de callbacks `onClear()` automáticamente al gatillar el evento de `change` del dropdown selector de método.
- **Estado:** ✅ Corregido.

### Bug #2: Archivos faltantes de íconos en `includeAssets` de Vite (Low)
- **Problema:** En el plugin de PWA de Vite `vite.config.ts`, se listaban los archivos `favicon.ico`, `apple-touch-icon.png`, y `masked-icon.svg` bajo el flag `includeAssets`. Ninguno de estos archivos existía en la carpeta `public`, lo que provocaba referencias cruzadas huérfanas en el cache manifest.
- **Pasos de Reproducción:** Inspeccionar el service worker y la configuración base de Vite y contrastar con `ls public`.
- **Resultado Actual:** 404 silenciosos en precache.
- **Resultado Esperado:** Precache solo de íconos reales (`icon.svg`).
- **Corrección:** Se actualizó `vite.config.ts` removiendo las referencias inexistentes para estabilizar la manifest de PWA, dejándola acoplada al `icon.svg` universal del sistema.
- **Estado:** ✅ Corregido.

---

## Hallazgos de Rendimiento y Empaquetado
- **Tamaño del Build:** La aplicación en modo Producción genera un chunk de JavaScript de ~5.38 MB (sin gzip) y ~1.6 MB (gzip). 
- **Causa Analizada:** El import de Plotly y Math.js son extremadamente densos en matemáticas puras.
- **Impacto y Decisión:** Al estar respaldados 100% por un caché Service Worker preinstalado de `10 MiB`, este costo se paga una única vez, favoreciendo el funcionamiento `Offline First`. No requiere mitigación crítica, pero podrá optimizarse a futuro (Lazy Load o Code Splitting).

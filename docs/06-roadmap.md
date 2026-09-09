# 06. Hoja de Ruta del Desarrollo (Project Roadmap)

Este documento describe la secuencia de fases planeadas para el desarrollo de **IteraMath**, desde la concepción de requerimientos hasta la publicación final.

---

## Estado Global del Proyecto

```text
[Fase 1: Definición y Alcance] ──> COMPLETADO (Fase Actual)
[Fase 2: Diseño UI/UX]         ──> PENDIENTE
[Fase 3: Arquitectura Frontend]──> PENDIENTE
[Fase 4: Motor Matemático]     ──> PENDIENTE
...
[Fase 14: Publicación]         ──> PENDIENTE
```

---

## Detalle de Fases de Desarrollo

### Fase 1: Definición y Alcance (Estado: COMPLETADO)
* Elaboración de la visión general del proyecto, definición del público objetivo y propuesta de valor.
* Delimitación clara del alcance (funcionalidades incluidas vs. fuera de alcance).
* Redacción de Requisitos Funcionales (RF-001 a RF-016) y No Funcionales (RNF-001 a RNF-010).
* Especificación técnica y matemática detallada de los 6 métodos iniciales.
* Creación de la estructura inicial de documentación y actualización del `README.md`.

---

### Fase 2: Diseño UI/UX (Estado: PENDIENTE)
* Definición del sistema de diseño visual (paleta de colores, tipografías, componentes UI).
* Maquetación de wireframes para la vista principal (panel de parámetros, gráfica, tabla de iteraciones, código Octave y tarjetas de resumen).
* Diseño de la experiencia responsive (comportamiento en escritorios, tablets y smartphones).
* Definición de componentes de retroalimentación pedagógica y mensajes de error orientativos.

---

### Fase 3: Arquitectura Frontend e Inicialización (Estado: PENDIENTE)
* Configuración del proyecto base con Vite y TypeScript estricto.
* Estructuración del árbol de directorios en `src/` (módulos, componentes, servicios, modelos).
* Configuración de herramientas de calidad de código (ESLint, Prettier).
* Integración inicial de dependencias de frontend (Math.js, Plotly.js).

---

### Fase 4: Motor Matemático Común (Estado: PENDIENTE)
* Implementación del módulo de parseo y evaluación sintáctica de expresiones con Math.js.
* Desarrollo de utilidades para cálculo de derivadas simbólicas/numéricas.
* Módulo unificado para evaluación de criterios de error (Absoluto, Relativo, Porcentual, en la Función).
* Manejador centralizado de errores numéricos (división por cero, `NaN`, divergencias).

---

### Fase 5: Implementación Completa del Método de Bisección (Estado: PENDIENTE)
* Desarrollo del algoritmo manual de Bisección en TypeScript puro.
* Pruebas unitarias sobre el algoritmo de Bisección frente a casos estándar de prueba.
* Creación del componente UI para renderizar la tabla de iteraciones de Bisección.
* Integración del flujo completo: Entrada -> Validación -> Ejecución -> Tabla de Resultados.

---

### Fase 6: Módulo de Gráficas Interactivas (Estado: PENDIENTE)
* Integración de Plotly.js para renderizado dinámico de la función $f(x)$.
* Trazado de puntos de iteración, intervalos de búsqueda y raíz aproximada sobre la curva.
* Sincronización entre las filas de la tabla de iteraciones y los puntos resaltados en la gráfica.
* Ajustes de rendimiento y adaptabilidad responsive para el lienzo del gráfico.

---

### Fase 7: Implementación de los Otros Métodos Numéricos (Estado: PENDIENTE)
* Implementación algorítmica de **Regla Falsa**.
* Implementación algorítmica de **Punto Fijo** (con soporte para $g(x)$).
* Implementación algorítmica de **Newton-Raphson** (con derivada automática y editable).
* Implementación algorítmica de **Secante**.
* Implementación algorítmica de **Müller** (con soporte para detección y visualización de raíces complejas).
* Pruebas unitarias de convergencia y casos de borde para cada uno de los métodos.

---

### Fase 8: Generación de Código GNU Octave (Estado: PENDIENTE)
* Desarrollo del motor de plantillas para traducir entradas y parámetros en scripts de GNU Octave.
* Creación de scripts equivalentes comentados y optimizados para los 6 métodos.
* Componente de la interfaz con resaltado de sintaxis de código y botón de copiado al portapapeles.

---

### Fase 9: Persistencia con IndexedDB e Historial Local (Estado: PENDIENTE)
* Configuración de la base de datos IndexedDB local (mediante librería ligera o API nativa).
* Implementación de operaciones CRUD para el historial de ejercicios.
* Desarrollo del panel UI de Historial para listar, recargar, filtrar y eliminar ejercicios guardados.

---

### Fase 10: Módulo de Comparación de Métodos (Estado: PENDIENTE)
* Funcionalidad para ejecutar simultáneamente dos o más métodos sobre la misma función $f(x)$ e intervalo/puntos iniciales.
* Generación de tabla comparativa de velocidad de convergencia (número de iteraciones, error alcanzado, tiempo de cómputo).

---

### Fase 11: Progressive Web App (PWA) y Modo Offline (Estado: PENDIENTE)
* Creación y configuración de `manifest.webmanifest` (iconos, tema, nombre de app).
* Registro e implementación del Service Worker para almacenamiento en caché de assets (Workbox / Vite PWA plugin).
* Verificación y testing del funcionamiento en modo avión (100% offline).

---

### Fase 12: Testing y Control de Calidad (Estado: PENDIENTE)
* Pruebas unitarias automáticas (Vitest) para todos los motores numéricos.
* Pruebas de integración para la interacción UI -> Algoritmo -> Gráfica -> Historial.
* Pruebas de usabilidad y accesibilidad (Lighthouse, axe-core).
* Pruebas de precisión numérica con funciones desafiantes (raíces múltiples, funciones altamente oscilatorias).

---

### Fase 13: Optimización UI/UX y Pulido Final (Estado: PENDIENTE)
* Refinamiento estético de animaciones, transiciones y tipografías.
* Optimización del tamaño del bundle JS y tiempos de carga.
* Inclusión de guía de ayuda, glosario de términos numéricos y ejemplos preconfigurados para estudiantes.

---

### Fase 14: Publicación y Despliegue (Estado: PENDIENTE)
* Compilación de artefactos estáticos de producción.
* Despliegue en plataforma de hosting de sitios estáticos (GitHub Pages / Vercel).
* Documentación final de entrega y manual de usuario.

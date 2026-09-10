# IteraMath

**IteraMath** es una aplicación web interactiva y educativa diseñada para resolver, visualizar y estudiar métodos numéricos de búsqueda de raíces en ecuaciones no lineales de forma transparente y paso a paso.

---

## 🎯 Objetivo del Proyecto

Proporcionar a estudiantes, docentes y entusiastas del análisis numérico una herramienta web cliente-side que desglose el procedimiento iterativo completo de resolución de ecuaciones no lineales ($f(x) = 0$), integrando gráficas interactivas, control fino sobre criterios de error, generación automática de código equivalente en GNU Octave e historial local, conservando visible la lógica algorítmica sin opacidades.

---

## ✨ Características Previstas

* 🧮 **Algoritmos Propios e Interpretación de Funciones:** Parseo de expresiones matemáticas y ejecución de algoritmos numéricos desarrollados a medida sin depender de librerías de "caja negra" para la resolución de raíces.
* 📊 **Tablas de Iteraciones Detalladas:** Desglose completo de variables intermedias, valores evaluados y cálculo de errores paso a paso en cada iteración.
* ⚙️ **Parámetros y Criterios de Error Configurables:** Control sobre la tolerancia ($\epsilon$), límite de iteraciones ($N_{\max}$) y tipo de error (Absoluto, Relativo, Porcentual o de Función).
* 📈 **Gráficas Interactivas:** Visualización de la función $f(x)$, intervalo de búsqueda, puntos de evaluación y raíz aproximada mediante Plotly.js.
* 💻 **Generación de Código en GNU Octave:** Generación automática de scripts listos para ser copiados e instalados/ejecutados en GNU Octave.
* 💾 **Historial Local:** Almacenamiento local de ejercicios resueltos en IndexedDB sin requerir conexión a internet ni cuenta de usuario.
* 📱 **PWA y Modo Offline:** Soporte Progressive Web App (PWA) para instalabilidad en dispositivos móviles/escritorio y funcionamiento 100% offline.

---

## 🔬 Métodos Numéricos Contemplados

1. **Bisección** (Método cerrado por división de intervalo)
2. **Regla Falsa / Falsa Posición** (Método cerrado por secante)
3. **Punto Fijo** (Método abierto basado en $x = g(x)$)
4. **Newton-Raphson** (Método abierto basado en tangente y derivada analítica)
5. **Secante** (Método abierto basado en diferencia finita con dos puntos)
6. **Müller** (Método abierto cuadrático con soporte de raíces complejas)

---

## 🛠️ Stack Tecnológico Previsto

* **Lenguaje:** TypeScript / HTML5 / CSS3
* **Entorno y Bundler:** Vite (Node.js como entorno de construcción en desarrollo)
* **Motor Matemático Auxiliar:** Math.js (para interpretación sintáctica y derivación simbólica)
* **Motor Gráfico:** Plotly.js
* **Persistencia Local:** IndexedDB
* **Tecnología PWA:** Web App Manifest + Service Workers

*Nota: La aplicación es completamente Client-Side JAMstack (sin backend, ni bases de datos remotas).*

---

## 📌 Estado Actual del Proyecto

Actualmente el proyecto se encuentra en la **Fase 1 — Definición y Alcance del Proyecto**.

* ✅ **Fase 1 (Completada):** Especificaciones funcionales, no funcionales, métodos numéricos y hoja de ruta documentadas en la carpeta `docs/`.
* ✅ **Fase 2 (Completada):** Diseño UX/UI detallado y propuesta de Design System.
* ✅ **Fase 3 (Completada):** Inicialización de arquitectura Frontend (Vite + TS + CSS). Interfaz navegable y base.
* ✅ **Fase 4 (Completada):** Motor matemático común (Parseo con Math.js, cálculo de errores y validaciones).
* ✅ **Fase 5 (Completada):** Implementación completa del método de Bisección.
* ✅ **Fase 6 (Completada):** Gráficas interactivas con Plotly.js.
* ✅ **Fase 7A (Completada):** Implementación del Método de Regla Falsa.
* ⏳ **Fase 7B (Siguiente):** Implementación de Punto Fijo.

---

## 🗺️ Roadmap Simplificado

1. [x] **Fase 1:** Definición y alcance del proyecto (Documentación)
2. [x] **Fase 2:** Diseño UI/UX
3. [x] **Fase 3:** Arquitectura frontend e inicialización con Vite + TS
4. [x] **Fase 4:** Motor matemático común (Parseo con Math.js y errores)
5. [x] **Fase 5:** Implementación completa de Bisección
6. [x] **Fase 6:** Gráficas interactivas con Plotly.js
7. [x] **Fase 7A:** Implementación de Regla Falsa
8. [ ] **Fase 7B:** 
- [x] Regla Falsa
- [x] Punto Fijo
- [x] Newton-Raphson
- [x] Secante
- [x] Müller

Los seis métodos principales están implementados.
8. [x] **Fase 8:** Generador de código GNU Octave
9. [x] **Fase 9:** Persistencia con IndexedDB e historial local
10. [x] **Fase 10:** Módulo de comparación de métodos
11. [x] **Fase 11:** PWA y soporte offline
12. [ ] **Fase 12:** Testing integral y control de calidad
13. [ ] **Fase 13:** Optimización visual final
14. [ ] **Fase 14:** Publicaciónón

---

## 📚 Documentación del Proyecto

Para mayor información técnica, consultar la carpeta `docs/`:

* [`01-project-overview.md`](docs/01-project-overview.md): Visión general, objetivos y público objetivo.
* [`02-scope.md`](docs/02-scope.md): Alcance detallado (incluido vs. fuera de alcance).
* [`03-functional-requirements.md`](docs/03-functional-requirements.md): Especificación de Requisitos Funcionales (RF).
* [`04-non-functional-requirements.md`](docs/04-non-functional-requirements.md): Requisitos No Funcionales (RNF).
* [`05-numerical-methods.md`](docs/05-numerical-methods.md): Fórmulas, algoritmos, validaciones y tablas de los 6 métodos numéricos.
* [`06-roadmap.md`](docs/06-roadmap.md): Hoja de ruta completa de 14 fases de desarrollo.

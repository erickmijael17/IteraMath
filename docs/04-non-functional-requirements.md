# 04. Requisitos No Funcionales (Non-Functional Requirements)

Este documento especifica los Requisitos No Funcionales (RNF) para la plataforma **IteraMath**, detallando los atributos de calidad, restricciones técnicas y estándares de rendimiento necesarios.

---

## Índice de Requisitos No Funcionales

| ID | Categoría | Nombre del Requisito | Prioridad |
| :--- | :--- | :--- | :--- |
| **RNF-001** | Rendimiento | Tiempo de respuesta en cálculo numérico | Alta |
| **RNF-002** | Usabilidad / UX | Interfaz clara y experiencia educativa | Alta |
| **RNF-003** | Mantenibilidad | Arquitectura modular en TypeScript | Alta |
| **RNF-004** | Adaptabilidad | Design Responsive (Móvil, Tablet, Desktop) | Alta |
| **RNF-005** | Disponibilidad | Funcionamiento 100% Offline mediante PWA | Alta |
| **RNF-006** | Compatibilidad | Compatibilidad con navegadores web modernos | Alta |
| **RNF-007** | Calidad Matemática | Precisión numérica y manejo de valores flotantes | Alta |
| **RNF-008** | Accesibilidad | Accesibilidad Web básica (WCAG 2.1 AA) | Media |
| **RNF-009** | Seguridad | Privacidad y seguridad del procesamiento local | Alta |
| **RNF-010** | Arquitectura | Ausencia total de dependencias Backend | Alta |

---

## Especificación Detallada de Requisitos No Funcionales

### RNF-001: Tiempo de respuesta en cálculo numérico
* **ID:** `RNF-001`
* **Categoría:** Rendimiento
* **Descripción:** La ejecución de los algoritmos numéricos de hasta 500 iteraciones debe completarse en menos de 100 milisegundos en dispositivos de gama media.
* **Criterios de Aceptación:**
  1. El cálculo y renderizado de la tabla de iteraciones no debe congelar la interfaz de usuario ni superar los 100 ms de tiempo de cómputo.
  2. La actualización del gráfico con Plotly.js debe realizarse en un tiempo no mayor a 300 ms tras finalizar el cálculo.

---

### RNF-002: Interfaz clara y experiencia educativa (Usabilidad / UX)
* **ID:** `RNF-002`
* **Categoría:** Usabilidad / UX
* **Descripción:** La interfaz debe estar optimizada para el aprendizaje, con una jerarquía visual lógica, retroalimentación inmediata y presentación intuitiva de conceptos matemáticos.
* **Criterios de Aceptación:**
  1. Un usuario debe ser capaz de configurar y ejecutar un método numérico en menos de 3 clics desde la pantalla principal.
  2. Los errores de validación (ej. falta de cambio de signo en Bisección) deben mostrar explicaciones educativas orientativas y no simples códigos de error informáticos.

---

### RNF-003: Arquitectura modular en TypeScript (Mantenibilidad)
* **ID:** `RNF-003`
* **Categoría:** Mantenibilidad y Calidad de Código
* **Descripción:** El código fuente debe estar escrito en TypeScript estricto, respetando el principio de responsabilidad única (SRP) y una arquitectura limpia desacoplada.
* **Criterios de Aceptación:**
  1. Los motores algorítmicos numéricos deben estar totalmente desacoplados de la capa de presentación (DOM/UI) e interfaces gráficas.
  2. El código debe incluir tipado estricto (`noImplicitAny: true` en `tsconfig.json`) y documentación de funciones mediante JSDoc.

---

### RNF-004: Design Responsive (Adaptabilidad)
* **ID:** `RNF-004`
* **Categoría:** Adaptabilidad / Responsive Design
* **Descripción:** La aplicación debe adaptarse de forma fluida a pantallas de computadoras de escritorio, laptops, tablets y smartphones.
* **Criterios de Aceptación:**
  1. La disposición de paneles (formulario, gráfica, tabla) se reorganizará verticalmente en pantallas estrechas (ancho $< 768\text{px}$).
  2. Las tablas de iteraciones tendrán desplazamiento horizontal continuo (scroll) en dispositivos móviles sin deformar la maquetación.

---

### RNF-005: Funcionamiento 100% Offline mediante PWA (Disponibilidad)
* **ID:** `RNF-005`
* **Categoría:** Disponibilidad
* **Descripción:** La aplicación debe poder instalarse y ejecutarse completamente sin conexión a internet tras la primera descarga.
* **Criterios de Aceptación:**
  1. El Service Worker debe almacenar en caché todos los assets estáticos necesarios (HTML, CSS, JS, fuentes, imágenes y scripts de librerías).
  2. La aplicación debe ser funcional al 100% en modo avión o sin red.

---

### RNF-006: Compatibilidad con navegadores modernos (Compatibilidad)
* **ID:** `RNF-006`
* **Categoría:** Compatibilidad
* **Descripción:** IteraMath debe funcionar correctamente en las dos últimas versiones principales de los navegadores web modernos estándar.
* **Criterios de Aceptación:**
  1. Compatibilidad garantizada en Google Chrome, Mozilla Firefox, Microsoft Edge, Brave y Apple Safari.
  2. Uso de características ES6+ estandarizadas transpiladas adecuadamente vía Vite.

---

### RNF-007: Precisión numérica y manejo de valores flotantes (Calidad Matemática)
* **ID:** `RNF-007`
* **Categoría:** Calidad Matemática y Robustez
* **Descripción:** Los cálculos numéricos deben gestionar adecuadamente la precisión de punto flotante IEEE 754 de doble precisión y controlar anomalías numéricas.
* **Criterios de Aceptación:**
  1. El sistema debe detectar y manejar condiciones de indeterminación, como división por cero ($f'(x) = 0$ o $f(b) - f(a) = 0$), desbordamientos (`Infinity`) y resultados no numéricos (`NaN`).
  2. El formato de salida debe evitar imprecisiones por redondeo binario flotante habituales en JavaScript (ej. mostrando adecuadamente cifras significativas).

---

### RNF-008: Accesibilidad Web básica (Accesibilidad)
* **ID:** `RNF-008`
* **Categoría:** Accesibilidad
* **Descripción:** La interfaz debe seguir las pautas WCAG 2.1 nivel AA básicas para permitir la navegación y lectura accesible.
* **Criterios de Aceptación:**
  1. Ratio de contraste mínimo de 4.5:1 para texto normal respecto al fondo.
  2. Navegación completa mediante teclado (tecla Tab y Enter) en todos los controles interactivos del formulario.
  3. Etiquetas ARIA pertinentes en campos de entrada y botones principales.

---

### RNF-009: Privacidad y seguridad del procesamiento local (Seguridad)
* **ID:** `RNF-009`
* **Categoría:** Seguridad y Privacidad
* **Descripción:** La información procesada e historial de ejercicios del usuario permanecerá exclusivamente en el almacenamiento local del dispositivo.
* **Criterios de Aceptación:**
  1. No se realizarán rastreos, envío de telemetría ni transmisión de expresiones matemáticas a servidores de terceros.
  2. La evaluación de expresiones matemáticas con Math.js se realizará de forma segura en un entorno controlado (evitando `eval()` directo de cadenas no sanitizadas).

---

### RNF-010: Ausencia total de dependencias Backend (Arquitectura)
* **ID:** `RNF-010`
* **Categoría:** Arquitectura de Software
* **Descripción:** La aplicación debe ser una Single Page Application (SPA) 100% cliente-side instalable en servidores estáticos (GitHub Pages, Vercel, Netlify).
* **Criterios de Aceptación:**
  1. El artefacto final compilado consistirá únicamente en archivos estáticos HTML, CSS, JavaScript e imágenes.
  2. No se requerirá la ejecución de un entorno Node.js, Python, PHP o Java en el servidor para servir la aplicación.

# 03. Requisitos Funcionales (Functional Requirements)

Este documento especifica los requisitos funcionales (RF) del sistema **IteraMath**. Cada requisito se identifica con un código único `RF-XXX` y detalla su propósito, prioridad y criterios de aceptación.

---

## Índice de Requisitos Funcionales

| ID | Nombre del Requisito | Prioridad |
| :--- | :--- | :--- |
| **RF-001** | Ingreso y parseo de función matemática $f(x)$ | Alta |
| **RF-002** | Selección del método numérico de resolución | Alta |
| **RF-003** | Configuración de parámetros dinámicos por método | Alta |
| **RF-004** | Configuración de la tolerancia y máximo de iteraciones | Alta |
| **RF-005** | Selección del criterio de cálculo de error y parada | Alta |
| **RF-006** | Validación sintáctica y matemática de datos de entrada | Alta |
| **RF-007** | Ejecución algorítmica cliente-side sin dependencias externas | Alta |
| **RF-008** | Generación de la tabla completa de iteraciones | Alta |
| **RF-009** | Reporte de resumen de convergencia y resultado final | Alta |
| **RF-010** | Visualización gráfica interactiva de la función y solución | Alta |
| **RF-011** | Presentación pedagógica de la fórmula matemática utilizada | Media |
| **RF-012** | Generación automática de código equivalente en GNU Octave | Alta |
| **RF-013** | Almacenamiento local de ejercicios en el historial (IndexedDB) | Media |
| **RF-014** | Consulta y reejecución de ejercicios del historial | Media |
| **RF-015** | Exportación de resultados y tabla de iteraciones (CSV/JSON) | Baja |
| **RF-016** | Instalación como PWA y funcionamiento offline | Alta |

---

## Especificación Detallada de Requisitos

### RF-001: Ingreso y parseo de función matemática $f(x)$
* **ID:** `RF-001`
* **Nombre:** Ingreso y parseo de función matemática $f(x)$
* **Descripción:** El sistema debe permitir al usuario ingresar la expresión matemática de la función $f(x)$ (y $g(x)$ para el método de Punto Fijo) mediante un campo de texto interactivo, parseando y evaluando la expresión en el cliente mediante Math.js.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. El sistema debe aceptar funciones polinómicas, trigonométricas, exponenciales, logarítmicas y combinaciones estándar (ej. `x^3 - 2*x - 5`, `exp(-x) - x`).
  2. Debe notificar en tiempo real si la sintaxis ingresada es inválida o no reconducible a una función de la variable $x$.
  3. Para el método de Punto Fijo, debe habilitar un campo adicional para la función desglosada $g(x)$.

---

### RF-002: Selección del método numérico de resolución
* **ID:** `RF-002`
* **Nombre:** Selección del método numérico de resolución
* **Descripción:** El usuario debe poder seleccionar el método numérico con el cual desea resolver la función entre los 6 métodos iniciales disponibles.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. El sistema debe presentar una interfaz de selección para los métodos: Bisección, Regla Falsa, Punto Fijo, Newton-Raphson, Secante y Müller.
  2. Al cambiar de método, el formulario debe actualizar dinámicamente los campos de entrada requeridos para dicho método.

---

### RF-003: Configuración de parámetros dinámicos por método
* **ID:** `RF-003`
* **Nombre:** Configuración de parámetros dinámicos por método
* **Descripción:** El sistema debe solicitar y capturar los parámetros de entrada específicos para cada método seleccionado.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. **Bisección y Regla Falsa:** Debe solicitar límites del intervalo $a$ y $b$.
  2. **Punto Fijo y Newton-Raphson:** Debe solicitar punto inicial $x_0$.
  3. **Secante:** Debe solicitar puntos iniciales $x_0$ y $x_1$.
  4. **Müller:** Debe solicitar puntos iniciales $x_0$, $x_1$ y $x_2$.

---

### RF-004: Configuración de la tolerancia y máximo de iteraciones
* **ID:** `RF-004`
* **Nombre:** Configuración de la tolerancia y máximo de iteraciones
* **Descripción:** El sistema debe permitir establecer el valor de la tolerancia deseada ($\epsilon$) y el límite máximo de iteraciones ($N_{\max}$).
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. El usuario debe poder ingresar la tolerancia en formato decimal (ej. `0.0001`) o en notación científica (ej. `1e-6`).
  2. El máximo de iteraciones $N_{\max}$ debe ser un entero positivo con valor por defecto (ej. 100).

---

### RF-005: Selección del criterio de cálculo de error y parada
* **ID:** `RF-005`
* **Nombre:** Selección del criterio de cálculo de error y parada
* **Descripción:** El sistema debe permitir seleccionar qué tipo de error se utilizará como condición de parada algorítmica.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. El usuario podrá elegir entre:
     * Error Absoluto: $|x_{k+1} - x_k|$
     * Error Relativo: $\left|\frac{x_{k+1} - x_k}{x_{k+1}}\right|$
     * Error Relativo Porcentual: $\left|\frac{x_{k+1} - x_k}{x_{k+1}}\right| \times 100\%$
     * Evaluado en la función: $|f(x_k)|$
  2. El algoritmo seleccionado debe detener la ejecución cuando el error calculado sea menor o igual a la tolerancia establecida, o al alcanzar $N_{\max}$.

---

### RF-006: Validación sintáctica y matemática de datos de entrada
* **ID:** `RF-006`
* **Nombre:** Validación sintáctica y matemática de datos de entrada
* **Descripción:** El sistema debe validar todas las entradas antes de iniciar la ejecución algorítmica para evitar errores en tiempo de ejecución o bucles infinitos.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. Para métodos cerrados (Bisección y Regla Falsa), debe verificar que $f(a) \cdot f(b) < 0$ y advertir si no hay cambio de signo en el intervalo.
  2. Para Secante, debe verificar que $x_0 \neq x_1$.
  3. Para Müller, debe verificar que los tres puntos iniciales $x_0, x_1, x_2$ sean distintos entre sí.
  4. Si alguna validación falla, debe mostrar un mensaje claro de error sin colapsar la aplicación.

---

### RF-007: Ejecución algorítmica cliente-side sin dependencias externas
* **ID:** `RF-007`
* **Nombre:** Ejecución algorítmica cliente-side sin dependencias externas
* **Descripción:** Todos los métodos numéricos deben ser calculados en el navegador mediante algoritmos propios desarrollados en TypeScript.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. No se utilizarán librerías externas que entreguen la raíz directamente o que ejecuten internamente el método numérico.
  2. La ejecución debe ser síncrona/asíncrona en el hilo principal o web worker del cliente sin peticiones HTTP a servidores externos.

---

### RF-008: Generación de la tabla completa de iteraciones
* **ID:** `RF-008`
* **Nombre:** Generación de la tabla completa de iteraciones
* **Descripción:** El sistema debe mostrar una tabla ordenada por número de iteración ($k = 1, 2, \dots$) detallando todos los valores intermedios.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. La tabla debe incluir columnas correspondientes a las variables intermedias del método (ej. para Bisección: $k, a, b, c, f(a), f(b), f(c), \text{Error}$).
  2. Debe permitir configurar el número de decimales visibles en la tabla (ej. 4, 6, 8 o notación científica).
  3. Debe resaltar la fila correspondiente a la solución final encontrada.

---

### RF-009: Reporte de resumen de convergencia y resultado final
* **ID:** `RF-009`
* **Nombre:** Reporte de resumen de convergencia y resultado final
* **Descripción:** Al finalizar el proceso numérico, el sistema debe presentar una tarjeta resumen del estado y los resultados obtenidos.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. Debe mostrar la raíz aproximada $x_{sol}$, el valor de $f(x_{sol})$, el número total de iteraciones consumidas y el error final alcanzado.
  2. Debe indicar explícitamente el estado de convergencia (ej. "Convergencia alcanzada", "Máximo de iteraciones alcanzado", "Divergencia / División por cero").

---

### RF-010: Visualización gráfica interactiva de la función y solución
* **ID:** `RF-010`
* **Nombre:** Visualización gráfica interactiva de la función y solución
* **Descripción:** El sistema debe graficar la función $f(x)$ utilizando Plotly.js e indicar los elementos del procedimiento iterativo.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. La gráfica debe trazar la curva de $f(x)$ en un dominio adecuado alrededor de los puntos iniciales o raíces.
  2. Debe superponer la línea del eje X ($y=0$), la ubicación de la raíz encontrada y los puntos/intervalos iniciales.
  3. Debe permitir interactividad estándar: zoom, desplazamiento (pan) y visualización de coordenadas al pasar el cursor (tooltip).

---

### RF-011: Presentación pedagógica de la fórmula matemática utilizada
* **ID:** `RF-011`
* **Nombre:** Presentación pedagógica de la fórmula matemática utilizada
* **Descripción:** El sistema debe mostrar la fórmula matemática estándar del método seleccionado utilizando representación LaTeX/KaTeX o MathJax.
* **Prioridad:** Media
* **Criterios de Aceptación:**
  1. Al seleccionar un método, debe mostrarse de forma clara la ecuación de iteración (ej. para Newton-Raphson: $x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}$).
  2. Debe incluir una breve explicación pedagógica de la lógica del método.

---

### RF-012: Generación automática de código equivalente en GNU Octave
* **ID:** `RF-012`
* **Nombre:** Generación automática de código equivalente en GNU Octave
* **Descripción:** El sistema debe generar un script completo e independiente en lenguaje GNU Octave / MATLAB que resuelva la misma función con los mismos parámetros.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. El código generado debe ser un script sintácticamente válido para GNU Octave.
  2. Debe incluir comentarios educativos, la definición de la función, las condiciones iniciales y el bucle iterativo.
  3. Debe incluir un botón de "Copiar al portapapeles".

---

### RF-013: Almacenamiento local de ejercicios en el historial (IndexedDB)
* **ID:** `RF-013`
* **Nombre:** Almacenamiento local de ejercicios en el historial (IndexedDB)
* **Descripción:** El sistema debe guardar automáticamente en el almacenamiento IndexedDB del navegador los ejercicios resueltos.
* **Prioridad:** Media
* **Criterios de Aceptación:**
  1. Cada registro del historial debe incluir: fecha/hora, método, función $f(x)$, parámetros de entrada, raíz obtenida e iteraciones.
  2. Los datos persistirán aunque se cierre o recargue el navegador.

---

### RF-014: Consulta y reejecución de ejercicios del historial
* **ID:** `RF-014`
* **Nombre:** Consulta y reejecución de ejercicios del historial
* **Descripción:** El usuario debe tener una sección de historial para inspeccionar ejercicios anteriores o volver a cargarlos en el formulario.
* **Prioridad:** Media
* **Criterios de Aceptación:**
  1. Debe listar los ejercicios guardados ordenados cronológicamente.
  2. Permitirá cargar los parámetros de un ejercicio pasado con un clic para volver a ejecutarlo o modificarlo.
  3. Permitirá eliminar ejercicios individuales o limpiar todo el historial.

---

### RF-015: Exportación de resultados y tabla de iteraciones (CSV/JSON)
* **ID:** `RF-015`
* **Nombre:** Exportación de resultados y tabla de iteraciones (CSV/JSON)
* **Descripción:** El sistema debe ofrecer la opción de descargar la tabla de iteraciones en formato CSV o JSON para su análisis posterior.
* **Prioridad:** Baja
* **Criterios de Aceptación:**
  1. El usuario podrá hacer clic en "Exportar CSV" o "Exportar JSON" y el navegador generará la descarga directa del archivo con la tabla procesada.

---

### RF-016: Instalación como PWA y funcionamiento offline
* **ID:** `RF-016`
* **Nombre:** Instalación como PWA y funcionamiento offline
* **Descripción:** La aplicación debe estar estructurada como una Progressive Web App (PWA) con un Service Worker registrado.
* **Prioridad:** Alta
* **Criterios de Aceptación:**
  1. Debe incluir `manifest.webmanifest` con iconos, nombre y colores configurados.
  2. Tras la primera carga con conexión, la aplicación debe ser capaz de abrirse y resolver ejercicios completamente offline.

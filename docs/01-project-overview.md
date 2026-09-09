# 01. Visión General del Proyecto (Project Overview)

## 1. Nombre del Proyecto
**IteraMath** — Plataforma Web Educativa e Interactiva para Métodos Numéricos.

---

## 2. Problema que Busca Resolver
En la enseñanza y aprendizaje de la materia de Métodos Numéricos en ingeniería y ciencias aplicadas, los estudiantes enfrentan dificultades recurrentes:

* **Comprensión del proceso iterativo:** Es complejo visualizar cómo las aproximaciones sucesivas convergen hacia la raíz de una función no lineal.
* **Errores manuales frecuentes:** El cálculo manual en tabla propicia errores aritméticos o de redondeo acumulativos que oscurecen la comprensión algorítmica.
* **Brecha entre teoría y código:** Existe una desconexión entre la teoría matemática, la representación gráfica visual y la implementación computacional en lenguajes como GNU Octave o MATLAB.
* **Herramientas opacas:** La mayoría de calculadoras online avanzadas entregan directamente el resultado final sin desglosar el procedimiento ni permitir personalizar los criterios de parada o la derivación simbólica.

---

## 3. Objetivo General
Desarrollar **IteraMath**, una aplicación web cliente-side interactiva y de carácter educativo, diseñada para resolver, analizar y visualizar métodos numéricos de búsqueda de raíces en ecuaciones no lineales, proporcionando tablas de iteración desglosadas, control fino sobre criterios de error, gráficas interactivas, generación automática de código en GNU Octave y funcionamiento totalmente offline.

---

## 4. Objetivos Específicos
1. **Proporcionar visualización interactiva:** Integrar un motor gráfico dinámico (Plotly.js) para graficar funciones $f(x)$ y resaltar visualmente la convergencia de la raíz y los intervalos/puntos iterativos.
2. **Implementar algoritmos numéricos propios:** Desarrollar manualmente la lógica algorítmica cliente-side de los métodos iniciales (Bisección, Regla Falsa, Punto Fijo, Newton-Raphson, Secante y Müller) sin depender de librerías de "caja negra" para la resolución numérica.
3. **Ofrecer desglose detallado por iteración:** Generar tablas dinámicas con todas las variables intermedias, valores evaluados y cálculo de error (absoluto, relativo, porcentual o de función) en cada iteración.
4. **Facilitar el aprendizaje con GNU Octave:** Traducir automáticamente los parámetros ingresados y la ejecución del método en un script listo para ser copiado y ejecutado en GNU Octave.
5. **Garantizar autonomía y trabajo offline:** Implementar almacenamiento local con IndexedDB para el historial de ejercicios y soporte Progressive Web App (PWA) para garantizar acceso continuo sin depender de servidores o conexión a internet.

---

## 5. Público Objetivo
* **Estudiantes universitarios:** De carreras de Ingeniería, Matemáticas, Física y Ciencias Computacionales que cursan la asignatura de Métodos Numéricos o Análisis Numérico.
* **Docentes y profesores:** Que requieren una herramienta didáctica para ilustrar conceptos en clase, generar ejercicios resueltos y comparar métodos de solución.
* **Autodidactas y entusiastas:** Desarrolladores y profesionales que desean repasar conceptos de cálculo numérico de forma visual e interactiva.

---

## 6. Propuesta de Valor
* **100% Transparente y Educativo:** A diferencia de calculadoras tradicionales, IteraMath muestra cada paso intermedio, la fórmula exacta aplicada y la porción de código Octave equivalente.
* **Ejecución 100% Client-Side:** Cero latencia de red, privacidad garantizada de los datos y disponibilidad total offline.
* **Algoritmos Propios:** Respeto total al método pedagógico sin delegar la resolución numérica a librerías de terceros.
* **Trazabilidad Completa:** Desde el ingreso de la expresión sintáctica hasta la representación gráfica y el registro histórico en el dispositivo del usuario.

---

## 7. Descripción General de Funcionamiento
1. **Selección del Método:** El usuario elige entre Bisección, Regla Falsa, Punto Fijo, Newton-Raphson, Secante o Müller.
2. **Entrada de Expresión y Parámetros:** El usuario ingresa la función $f(x)$ (y $g(x)$ si aplica), junto con los valores iniciales ($a, b, x_0, x_1, x_2$), tolerancia $\epsilon$, máximo de iteraciones $N_{\max}$ y el criterio de parada/error deseado.
3. **Validación:** El sistema evalúa sintácticamente la expresión matemática (vía Math.js) y verifica condiciones previas (ej. cambio de signo en métodos cerrados).
4. **Ejecución del Algoritmo:** El motor interno de IteraMath ejecuta iterativamente la fórmula del método hasta satisfacer la condición de parada o alcanzar $N_{\max}$.
5. **Renderizado de Resultados:**
   * Resumen del resultado (raíz aproximada, número de iteraciones, error final, estado de convergencia).
   * Tabla interactiva completa de iteraciones.
   * Gráfica dinámica de $f(x)$ marcando puntos e intervalo de solución.
   * Explicación de la fórmula aplicada.
   * Script equivalente en GNU Octave listo para copiar.
6. **Persistencia:** El ejercicio finalizado se guarda en el historial local (IndexedDB) para su posterior consulta o reejecución.

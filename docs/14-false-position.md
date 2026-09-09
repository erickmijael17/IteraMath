# 14. Método de Regla Falsa (Fase 7A)

Este documento detalla la implementación arquitectónica y matemática del Método de Regla Falsa (False Position) en IteraMath.

## 1. Definición Matemática
El método de regla falsa es un algoritmo cerrado de búsqueda de raíces que, a diferencia de la Bisección (que divide el intervalo por la mitad), une los puntos $(a, f(a))$ y $(b, f(b))$ mediante una recta y calcula la intersección de dicha recta con el eje $x$. 

* **Fórmula de la iteración:** $w_k = b_k - \frac{f(b_k)(b_k-a_k)}{f(b_k)-f(a_k)}$
* **Condición de inicio:** $f(a) \cdot f(b) < 0$
* **Actualización:** Si $f(a) \cdot f(w) < 0$, entonces $b = w$. En caso contrario, $a = w$.

## 2. Estructura del Algoritmo
El algoritmo está encapsulado en la función pura `falsePosition(input: FalsePositionInput)` dentro de `src/methods/falsePosition.ts`. Funciona de manera idéntica a la bisección en arquitectura, sin conocer del DOM ni del lienzo gráfico.

### Tipos Utilizados
* `FalsePositionInput`: Configuración de entrada (misma firma de bisección, exige $a$ y $b$).
* `FalsePositionIteration`: Historial iterativo que almacena $w$ en lugar del punto medio $m$.
* `FalsePositionResult`: Resumen final (exactamente igual a `BisectionResult`).

## 3. Criterios de Parada y Manejo de Errores
Se mantienen los 4 criterios base: **Absoluto, Relativo, Porcentual y Residuo**.
* Para $k=0$, el error relativo, absoluto y porcentual es `null`. El residuo puede evaluarse desde el inicio.
* **División por cero protegida:** El denominador $f(b) - f(a)$ es comprobado antes de la división. Si resultara ser exactamente 0, se arrojaría la excepción `DIVISION_BY_ZERO`.
* **Raíz exacta inmediata:** Al igual que en la bisección, si se evalúa $f(w) = 0$ la convergencia es inmediata sin calcular errores relativos que puedan dar `NaN`.

## 4. Pruebas Implementadas
Se crearon **13 casos de prueba en `falsePosition.test.ts`**:
1. Convergencia normal (ej: $x^3 - x - 1$).
2. Raíz exacta atrapada de forma lineal.
3. Raíces capturadas de inicio en $a$ o en $b$.
4. Disparos controlados de `INVALID_BRACKET` y `INVALID_INTERVAL`.
5. Parada de emergencia por `MAX_ITERATIONS`.
6. Pruebas dedicadas a los cuatro criterios de error matemáticos individuales.
7. Expresiones inservibles derivadas desde el math core.

## 5. Tabla y Gráfica
La interfaz unifica la lectura de resultados a través de la función general `renderResults()` en `main.ts`. Identifica si el punto bajo prueba debe denominarse $m$ (bisección) o $w$ (regla falsa) y adapta dinámicamente las cabeceras de la tabla.

Para la capa de **Plotly**, se generalizó el script visual transformándose en `bracketGraph.ts`, de manera que este lee inteligentemente el resultado del método cerrado para plotear los límites $[a,b]$ iniciales y colocar las iteraciones como puntos difuminados hasta colisionar con la estrella de la aproximación final. Todo el muestreo permanece idéntico.

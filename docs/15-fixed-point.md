# 15. Método de Punto Fijo (Fase 7B)

Este documento detalla la implementación del Método de Punto Fijo en IteraMath.

## 1. Definición Matemática
El método de punto fijo transforma la ecuación original $f(x) = 0$ en la forma $x = g(x)$.
La aproximación sucesiva se calcula evaluando:
$$x_{k+1} = g(x_k)$$

A diferencia de Bisección y Regla Falsa (que son métodos cerrados y requieren un intervalo $[a, b]$ donde haya un cambio de signo), el Punto Fijo es un **método abierto**. Requiere únicamente un punto inicial $x_0$ y la función generatriz $g(x)$.

## 2. Estructura del Algoritmo
La lógica principal reside en `src/methods/fixedPoint.ts`.

### Tipos Utilizados
* `FixedPointInput`: Recibe `expression` ($f(x)$), `iterationExpression` ($g(x)$), y un valor inicial `x0`.
* `FixedPointIteration`: Registra $k$, la iteración actual ($x_k$), la siguiente ($x_{k+1}$), el valor de $f(x_{k+1})$ y el error calculado.
* `FixedPointResult`: Devuelve la raíz, el estado de convergencia y las iteraciones.

### Tratamiento de Errores y Excepciones
* El método evalúa $f(x)$ en cada iteración para calcular el residuo. El cálculo real se hace con $g(x)$.
* Si $f(x_{k+1}) = 0$, se considera que ha encontrado la raíz exacta y la ejecución termina exitosamente de inmediato.
* Si $g(x_k)$ produce un resultado no finito (`NaN`, `Infinity`), el método arroja `NON_FINITE_RESULT`. Esto previene ciclos infinitos silenciosos al divergir numéricamente.
* Se soporta la detención regular por `MAX_ITERATIONS` como un caso divergente no fatal (estado `converged: false`).

### Convención Numérica
A diferencia de los métodos cerrados, el Punto Fijo permite calcular el error desde $k=0$ porque hay una estimación anterior ($x_0$) y una estimación nueva ($x_1$). 
La tabla en la UI refleja este flujo:
| $k$ | $x_k$ | $x_{k+1}$ | $f(x_{k+1})$ | Error |

## 3. Pruebas Unitarias
El archivo `fixedPoint.test.ts` implementa **11 pruebas vitales**, validando:
1. Convergencia exitosa.
2. Identificación inmediata de raíz exacta en la iteración $0$.
3. Detención por límite máximo de iteraciones (caso divergente).
4. El cálculo matemático exacto de errores relativos, absolutos, porcentuales y residuales.
5. Invalidez de las expresiones ingresadas (`f(x)` o `g(x)` mal escritas).
6. Captura correcta de valores que se salen del dominio matemático en la iteración (`NON_FINITE_RESULT`).

## 4. Visualización Gráfica (Diagrama de Cobweb)
La representación de métodos abiertos difiere significativamente. Para esto se elaboró `src/graph/fixedPointGraph.ts`:
* Representa la recta $y = x$.
* Dibuja la curva $y = g(x)$.
* Construye un **Diagrama de Telaraña (Cobweb)** tomando directamente el arreglo de iteraciones desde $x_0$ y trazando las diagonales y ortogonales sin tener que recalcular matemáticamente la función en Plotly.
* Esto tiene un altísimo valor educativo porque visualiza instantáneamente si la función converge en "espiral", en "escalera" o si directamente diverge.

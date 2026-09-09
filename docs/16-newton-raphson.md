# 16. Método de Newton-Raphson (Fase 7C)

Este documento detalla la implementación del Método de Newton-Raphson en IteraMath.

## 1. Definición Matemática
El método de Newton-Raphson es un método abierto que utiliza la derivada de una función para encontrar su raíz.
A partir de un valor inicial $x_0$, la aproximación sucesiva se calcula evaluando:
$$x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}$$

Requiere únicamente la función $f(x)$ y el valor inicial $x_0$. La derivada $f'(x)$ es calculada automáticamente por el motor de derivación simbólica subyacente (`mathjs`).

## 2. Motor de Derivación Simbólica (`src/math/derivative.ts`)
Para evitar que el usuario deba derivar manualmente y para no caer en el uso de diferencias finitas (que introducen error de aproximación), se implementó derivación simbólica.
* La API `createDerivative(expression)` compila la función y extrae simbólicamente la derivada.
* Retorna un objeto `Evaluator` y la representación en `string` (para mostrar visualmente qué ecuación derivó el sistema).
* Si falla porque la expresión no tiene sintaxis válida, emite un error controlado de tipo `INVALID_EXPRESSION`.

## 3. Estructura del Algoritmo (`src/methods/newtonRaphson.ts`)
### Tipos Utilizados
* `NewtonRaphsonInput`: `expression`, `x0`, tolerancias. (La derivada no es una entrada explícita del usuario).
* `NewtonRaphsonIteration`: $k$, $x_k$, $f(x_k)$, $f'(x_k)$, $x_{k+1}$, $f(x_{k+1})$ y el error calculado.
* `NewtonRaphsonResult`: Información de convergencia más el extra `derivativeExpression` para inyección de vista.

### Tratamiento de la División y Raíz Cero
* Se evalúa `f(x_k)` y `f'(x_k)`.
* Si `f(x_k) === 0`, detecta la raíz exacta de inmediato en esa iteración.
* Si `f'(x_k) === 0`, frena para evitar `Infinity` al dividir y arroja un error numérico controlado específico: `ZERO_DERIVATIVE`.

### Tabla Visual
Como se pidió, la tabla en la interfaz prioriza las columnas que representan el cálculo académico manual:
| $k$ | $x_k$ | $f(x_k)$ | $f'(x_k)$ | $x_{k+1}$ | Error |

## 4. Visualización Gráfica (`src/graph/newtonGraph.ts`)
Representación geométrica clásica del método.
* El algoritmo toma el arreglo de iteraciones.
* Se dibujan los puntos $(x_k, f(x_k))$.
* Se dibuja una recta tangente que nace de $(x_k, f(x_k))$, con la pendiente matemática $f'(x_k)$, atravesando el eje de las abscisas exactamente en el punto $x_{k+1}$.
* Por diseño y para prevenir sobrecarga visual, solo se dibujan las rectas tangentes de las iteraciones iniciales (primeras 3) y últimas (las 2 previas a la raíz) en caso de que hubiese demasiadas iteraciones.

## 5. Pruebas Unitarias
El archivo `newtonRaphson.test.ts` implementa **12 casos críticos**, entre ellos:
1. Derivación simbólica implícita de una polinómica: $f(x) = x^3 - x - 1$.
2. Prevención contra derivada nula ($ZERO\_DERIVATIVE$).
3. Cálculo inmediato de raíz en primer iteración.
4. Correcto descarte de funciones donde se cae fuera del dominio iterativo iterativamente ($f(x) = \sqrt{x-2}$).
5. Errores variados y exactos.

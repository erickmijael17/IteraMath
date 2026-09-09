# 17. Método de Secante (Fase 7D)

Este documento detalla la implementación del Método de Secante en IteraMath.

## 1. Definición Matemática
El método de la Secante es un método numérico abierto que evita el uso de la derivada analítica (requerida por Newton-Raphson) aproximando la pendiente de la función mediante una recta secante trazada entre dos puntos de iteración consecutivos.

La fórmula de iteración es:
$$x_{k+1} = x_k - \frac{f(x_k)(x_k - x_{k-1})}{f(x_k) - f(x_{k-1})}$$

A diferencia de los métodos cerrados (Bisección y Regla Falsa), **no exige que los valores iniciales formen un intervalo que encierre a la raíz** (no requiere cambio de signo $f(x_0) \cdot f(x_1) < 0$).

## 2. Diferencias clave con Newton-Raphson
* **Derivada vs Secante**: Mientras Newton-Raphson utiliza la recta tangente exacta evaluando simbólicamente $f'(x_k)$, Secante utiliza la pendiente de la recta secante que une $(x_{k-1}, f(x_{k-1}))$ con $(x_k, f(x_k))$.
* **Valores iniciales**: Newton-Raphson necesita solo $x_0$. Secante requiere obligatoriamente $x_0$ y $x_1$.

## 3. Estructura del Algoritmo (`src/methods/secant.ts`)
### Manejo de Estados y Entradas
* `SecantInput`: Espera $x_0$, $x_1$, $f(x)$ y parámetros de detención.
* `SecantIteration`: Cada registro almacena: $k$, $x_{k-1}$ (`xPrevious`), $x_k$ (`xCurrent`), $f(x_{k-1})$, $f(x_k)$, $x_{k+1}$ (`xNext`) y el error.

### Reglas de Excepción
* **Denominador Cero**: Si $f(x_k) - f(x_{k-1}) = 0$, trazar la recta resulta en una división por cero (recta paralela al eje x). Para evitar la divergencia abrupta a `Infinity` o `NaN`, el algoritmo detiene la ejecución arrojando un error `ZERO_SECANT_DENOMINATOR`.

### Condiciones Iniciales Extra
Se valida la condición atípica donde el usuario tenga el "golpe de suerte" de ingresar una raíz directamente:
* Si $f(x_0) = 0$, finaliza inmediatamente con $x_0$.
* Si $f(x_1) = 0$, finaliza inmediatamente con $x_1$.

## 4. Visualización Geométrica (`src/graph/secantGraph.ts`)
El motor de renderizado muestra:
* La curva de $f(x)$.
* Los puntos evaluados sobre la curva $(x_k, f(x_k))$.
* Para mostrar la diferencia metodológica con Newton, **se trazan rectas secantes** que pasan explícitamente por los dos puntos iterativos anteriores y se proyectan cortando el eje x.
* Se limitan dinámicamente las rectas a graficar para no abrumar visualmente la curva.

## 5. Pruebas Unitarias (`src/methods/secant.test.ts`)
Para asegurar la fiabilidad matemática se agregaron **15 casos de prueba exhaustivos**, evaluando:
1. Precisión con el ejemplo base: $x^3 - x - 1$.
2. Invalidez o convergencia directa en $x_0$ o $x_1$.
3. Manejo de denominadores nulos sin colapsar el entorno.
4. Identidad matemática de tolerancias (porcentuales, residuales, relativas, absolutas).
5. Casos que, geométricamente, obligan al método a extrapolar fuera de la zona interpolada y causan fallos de dominio.
6. Convergencias *sin cambio de signo* (ej. función $(x-2)^2 - 1$ con valores iniciales a la derecha de la raíz positiva).

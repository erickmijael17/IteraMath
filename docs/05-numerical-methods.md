# 05. Métodos Numéricos Iniciales (Numerical Methods Specification)

Este documento especifica en detalle los seis (6) métodos numéricos iniciales contemplados en **IteraMath** para la búsqueda de raíces en ecuaciones no lineales ($f(x) = 0$).

Para cada método se documenta su propósito, fórmula matemática, datos de entrada, validaciones previas, algoritmo paso a paso, estructura de la tabla de iteraciones, condiciones de parada y posibles errores numéricos.

---

## 1. Método de Bisección

### 1.1. Propósito
El método de Bisección es un método cerrado que encuentra una raíz real de la ecuación $f(x) = 0$ dividiendo repetidamente a la mitad un intervalo $[a, b]$ donde la función es continua y cambia de signo ($f(a) \cdot f(b) < 0$).

### 1.2. Fórmula Matemática
$$\bar{c}_k = \frac{a_k + b_k}{2}$$

### 1.3. Entradas Requeridas
* Expresión de la función $f(x)$
* Límite inferior del intervalo $a$
* Límite superior del intervalo $b$
* Tolerancia error ($\epsilon$)
* Máximo de iteraciones ($N_{\max}$)
* Criterio de cálculo de error ($E_a, E_r, E_p, |f(c)|$)

### 1.4. Validaciones Previas
1. $a < b$.
2. Continuidad de $f(x)$ en $[a, b]$.
3. Teorema de Bolzano: $f(a) \cdot f(b) < 0$. Si $f(a) \cdot f(b) > 0$, el intervalo es inválido (no se garantiza una cantidad impar de raíces).

### 1.5. Proceso Algorítmico Paso a Paso
1. Inicializar $k = 1$, $a_1 = a$, $b_1 = b$.
2. Calcular el punto medio $c_k = \frac{a_k + b_k}{2}$.
3. Evaluar $f(a_k)$ y $f(c_k)$.
4. Calcular el error correspondiente según el criterio seleccionado. Para $k=1$, el error relativo se evalúa considerando aproximación previa o se omite.
5. Verificar condición de parada: si $\text{Error} \le \epsilon$ o $|f(c_k)| \le \epsilon$ o $k \ge N_{\max}$, detener y retornar $c_k$.
6. Si $f(a_k) \cdot f(c_k) < 0$, definir nuevo intervalo: $a_{k+1} = a_k$, $b_{k+1} = c_k$.
7. Si $f(a_k) \cdot f(c_k) > 0$, definir nuevo intervalo: $a_{k+1} = c_k$, $b_{k+1} = b_k$.
8. Si $f(c_k) = 0$, $c_k$ es la raíz exacta; detener execution.
9. Incrementar $k = k + 1$ y repetir desde el Paso 2.

### 1.6. Estructura de la Tabla de Iteraciones
* $k$: Número de iteración.
* $a$: Límite inferior del intervalo.
* $b$: Límite superior del intervalo.
* $c$: Punto medio ($x_{r}$).
* $f(a)$: Evaluación de $f(a)$.
* $f(b)$: Evaluación de $f(b)$.
* $f(c)$: Evaluación de $f(c)$.
* $\text{Error}$: Error calculado según el criterio.

### 1.7. Condiciones de Convergencia / Parada
* $\text{Error} \le \epsilon$
* $|f(c)| \le \epsilon$
* $k = N_{\max}$

### 1.8. Posibles Errores o Excepciones
* $f(a) \cdot f(b) \ge 0$ en el intervalo inicial.
* Continuidad no cumplida en el intervalo (ej. asíntotas en $1/x$).
* Límite $N_{\max}$ alcanzado sin convergencia si la tolerancia es demasiado estricta.

---

## 2. Método de la Regla Falsa (Falsa Posición)

### 2.1. Propósito
El método de la Regla Falsa es un método cerrado similar a Bisección, pero en lugar de dividir el intervalo a la mitad, une los puntos $(a, f(a))$ y $(b, f(b))$ mediante una línea recta (secante) e intersecta dicha recta con el eje X para obtener la aproximación.

### 2.2. Fórmula Matemática
$$c_k = b_k - \frac{f(b_k) \cdot (b_k - a_k)}{f(b_k) - f(a_k)}$$

### 2.3. Entradas Requeridas
* Expresión de la función $f(x)$
* Límite inferior $a$
* Límite superior $b$
* Tolerancia ($\epsilon$)
* Máximo de iteraciones ($N_{\max}$)
* Criterio de cálculo de error ($E_a, E_r, E_p, |f(c)|$)

### 2.4. Validaciones Previas
1. $a < b$.
2. Teorema de Bolzano: $f(a) \cdot f(b) < 0$.
3. $f(b) \neq f(a)$ para evitar división por cero.

### 2.5. Proceso Algorítmico Paso a Paso
1. Inicializar $k = 1$, $a_1 = a$, $b_1 = b$.
2. Evaluar $f(a_k)$ y $f(b_k)$.
3. Calcular la aproximación $c_k = b_k - \frac{f(b_k)(b_k - a_k)}{f(b_k) - f(a_k)}$.
4. Evaluar $f(c_k)$.
5. Calcular el error según el criterio seleccionado.
6. Verificar condiciones de parada ($\text{Error} \le \epsilon$ o $k \ge N_{\max}$).
7. Si $f(a_k) \cdot f(c_k) < 0$, actualizar $a_{k+1} = a_k$, $b_{k+1} = c_k$.
8. Si $f(a_k) \cdot f(c_k) > 0$, actualizar $a_{k+1} = c_k$, $b_{k+1} = b_k$.
9. Incrementar $k = k + 1$ y repetir desde el Paso 3.

### 2.6. Estructura de la Tabla de Iteraciones
* $k$: Número de iteración.
* $a$: Límite inferior.
* $b$: Límite superior.
* $c$: Punto de la secante ($x_r$).
* $f(a)$: Valor $f(a)$.
* $f(b)$: Valor $f(b)$.
* $f(c)$: Valor $f(c)$.
* $\text{Error}$: Error absoluto, relativo o de función.

### 2.7. Condiciones de Convergencia / Parada
* $\text{Error} \le \epsilon$ o $|f(c)| \le \epsilon$ o $k = N_{\max}$.

### 2.8. Posibles Errores o Excepciones
* Estancamiento de un extremo del intervalo (convergencia lenta unilaterial en funciones con convexidad pronunciada).
* División por cero si $f(b_k) = f(a_k)$.

---

## 3. Método del Punto Fijo

### 3.1. Propósito
El método del Punto Fijo es un método abierto que transforma la ecuación no lineal $f(x) = 0$ en la forma equivalente $x = g(x)$, comenzando desde un valor inicial $x_0$ y generando la secuencia iterativa $x_{k+1} = g(x_k)$.

### 3.2. Fórmula Matemática
$$x_{k+1} = g(x_k)$$

### 3.3. Entradas Requeridas
* Función original $f(x)$ (para verificación del error de función $|f(x_k)|$)
* Función despejada $g(x)$
* Punto inicial $x_0$
* Tolerancia ($\epsilon$)
* Máximo de iteraciones ($N_{\max}$)
* Criterio de cálculo de error ($E_a, E_r, E_p, |f(x_k)|$)

### 3.4. Validaciones Previas
1. Sintaxis correcta de $f(x)$ y $g(x)$.
2. Condición teórica de convergencia: $|g'(x)| < 1$ en el entorno de la raíz (el sistema emitirá una advertencia si $|g'(x_0)| \ge 1$).

### 3.5. Proceso Algorítmico Paso a Paso
1. Establecer $k = 0$, aproximación actual $x_k = x_0$.
2. Calcular la siguiente aproximación: $x_{k+1} = g(x_k)$.
3. Evaluar $f(x_{k+1})$.
4. Calcular el error entre $x_{k+1}$ y $x_k$.
5. Verificar parada: si $\text{Error} \le \epsilon$ o $k+1 \ge N_{\max}$, finalizar.
6. Actualizar $x_k = x_{k+1}$, incrementar $k = k + 1$ y volver al Paso 2.

### 3.6. Estructura de la Tabla de Iteraciones
* $k$: Iteración ($0, 1, 2, \dots$).
* $x_k$: Aproximación actual.
* $g(x_k)$: Resultado de evaluar $g(x_k)$ ($x_{k+1}$).
* $f(x_k)$: Resultado de evaluar la función original $f(x_k)$.
* $\text{Error}$: Error relativo/absoluto entre $x_{k+1}$ y $x_k$.

### 3.7. Condiciones de Convergencia / Parada
* Convergencia cuando $|g'(x)| < 1$.
* Detención por $\text{Error} \le \epsilon$ o $k = N_{\max}$.

### 3.8. Posibles Errores o Excepciones
* Divergencia infinita si $|g'(x)| > 1$ (el valor de $x_k$ tiende a $\pm\infty$).
* Valores no definidos en $g(x)$ (ej. raíces cuadradas de números negativos o logaritmo de cero).

---

## 4. Método de Newton-Raphson

### 4.1. Propósito
Es un método abierto altamente eficiente de orden de convergencia cuadrático que utiliza la recta tangente a la curva $f(x)$ en el punto $(x_k, f(x_k))$ para encontrar la siguiente aproximación.

### 4.2. Fórmula Matemática
$$x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}$$

### 4.3. Entradas Requeridas
* Expresión de la función $f(x)$
* Punto inicial $x_0$
* Tolerancia ($\epsilon$)
* Máximo de iteraciones ($N_{\max}$)
* Criterio de cálculo de error ($E_a, E_r, E_p, |f(x_k)|$)
* *Nota:* La derivada $f'(x)$ es calculada simbólicamente por el sistema mediante Math.js, permitiendo al usuario modificarla si lo desea.

### 4.4. Validaciones Previas
1. Sintaxis de $f(x)$.
2. Verificación de que la derivada $f'(x_0) \neq 0$.

### 4.5. Proceso Algorítmico Paso a Paso
1. Establecer $k = 0$, $x_k = x_0$.
2. Obtener la derivada $f'(x)$.
3. Evaluar $f(x_k)$ y $f'(x_k)$.
4. Si $f'(x_k) = 0$, detener la ejecución debido a tangente horizontal (división por cero).
5. Calcular la siguiente aproximación: $x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}$.
6. Calcular el error entre $x_{k+1}$ y $x_k$.
7. Verificar parada ($\text{Error} \le \epsilon$ o $k+1 \ge N_{\max}$).
8. Asignar $x_k = x_{k+1}$, $k = k + 1$ y repetir desde el Paso 3.

### 4.6. Estructura de la Tabla de Iteraciones
* $k$: Iteración.
* $x_k$: Aproximación actual.
* $f(x_k)$: Valor de la función.
* $f'(x_k)$: Valor de la derivada.
* $x_{k+1}$: Siguiente aproximación.
* $\text{Error}$: Error relativo, absoluto o de función.

### 4.7. Condiciones de Convergencia / Parada
* Se detiene si $\text{Error} \le \epsilon$, $|f(x_k)| \le \epsilon$ o $k = N_{\max}$.

### 4.8. Posibles Errores o Excepciones
* Tangente horizontal: $f'(x_k) = 0$ (imposibilidad de dividir).
* Oscilación en ciclos infinitos entre dos puntos (ej. en puntos de inflexión).
* Divergencia si el punto inicial $x_0$ está demasiado alejado de la raíz.

---

## 5. Método de la Secante

### 5.1. Propósito
Es un método abierto derivado de Newton-Raphson que aproxima la derivada $f'(x)$ mediante una diferencia finita utilizando dos puntos iniciales $x_0$ y $x_1$, evitando la necesidad de derivar analíticamente la función.

### 5.2. Fórmula Matemática
$$x_{k+1} = x_k - \frac{f(x_k) \cdot (x_k - x_{k-1})}{f(x_k) - f(x_{k-1})}$$

### 5.3. Entradas Requeridas
* Expresión de la función $f(x)$
* Primer punto inicial $x_0$
* Segundo punto inicial $x_1$
* Tolerancia ($\epsilon$)
* Máximo de iteraciones ($N_{\max}$)
* Criterio de cálculo de error ($E_a, E_r, E_p, |f(x_k)|$)

### 5.4. Validaciones Previas
1. Sintaxis de $f(x)$.
2. $x_0 \neq x_1$.
3. $f(x_0) \neq f(x_1)$ para evitar división por cero inicial.

### 5.5. Proceso Algorítmico Paso a Paso
1. Establecer $k = 1$, aproximaciones $x_{k-1} = x_0$, $x_k = x_1$.
2. Evaluar $f(x_{k-1})$ y $f(x_k)$.
3. Si $f(x_k) - f(x_{k-1}) = 0$, detener por división por cero.
4. Calcular $x_{k+1} = x_k - \frac{f(x_k)(x_k - x_{k-1})}{f(x_k) - f(x_{k-1})}$.
5. Evaluar el error entre $x_{k+1}$ y $x_k$.
6. Verificar condiciones de parada ($\text{Error} \le \epsilon$ o $k \ge N_{\max}$).
7. Actualizar los puntos: $x_{k-1} = x_k$, $x_k = x_{k+1}$.
8. Incrementar $k = k + 1$ y repetir desde el Paso 2.

### 5.6. Estructura de la Tabla de Iteraciones
* $k$: Número de iteración.
* $x_{k-1}$: Punto anterior.
* $x_k$: Punto actual.
* $f(x_{k-1})$: Evaluación en punto anterior.
* $f(x_k)$: Evaluación en punto actual.
* $x_{k+1}$: Nueva aproximación calculada.
* $\text{Error}$: Error del paso actual.

### 5.7. Condiciones de Convergencia / Parada
* Parada cuando $\text{Error} \le \epsilon$ o $|f(x_{k+1})| \le \epsilon$ o $k = N_{\max}$.

### 5.8. Posibles Errores o Excepciones
* División por cero cuando $f(x_k) = f(x_{k-1})$.
* Divergencia si los puntos iniciales no están lo suficientemente cercanos a la raíz.

---

## 6. Método de Müller

### 6.1. Propósito
El método de Müller es una extensión del método de la Secante que construye una parábola cuadrática a través de tres puntos iniciales $(x_0, f(x_0))$, $(x_1, f(x_1))$ y $(x_2, f(x_2))$, determinando la intersección del polinomio de segundo grado con el eje X. Permite encontrar raíces complejas además de reales.

### 6.2. Fórmula Matemática
Dados tres puntos $x_0, x_1, x_2$ y sus valores $f_0, f_1, f_2$:

1. Diferencias divididas:
   * $h_0 = x_1 - x_0$, $h_1 = x_2 - x_1$
   * $\delta_0 = \frac{f_1 - f_0}{h_0}$, $\delta_1 = \frac{f_2 - f_1}{h_1}$
2. Coeficientes de la parábola $P(x) = a(x - x_2)^2 + b(x - x_2) + c$:
   * $a = \frac{\delta_1 - \delta_0}{h_1 + h_0}$
   * $b = a \cdot h_1 + \delta_1$
   * $c = f_2 = f(x_2)$
3. Raíz del polinomio cuadrático (eligiendo el signo en el denominador para maximizar el valor absoluto):
   $$x_3 = x_2 - \frac{2c}{b \pm \sqrt{b^2 - 4ac}}$$
   donde el signo $\pm$ coincide con el signo de $b$ (es decir, $\text{signo}(b) \cdot \sqrt{b^2 - 4ac}$).

### 6.3. Entradas Requeridas
* Expresión de la función $f(x)$
* Tres puntos iniciales $x_0, x_1, x_2$
* Tolerancia ($\epsilon$)
* Máximo de iteraciones ($N_{\max}$)
* Criterio de cálculo de error ($E_a, E_r, E_p, |f(x_3)|$)

### 6.4. Validaciones Previas
1. Sintaxis de $f(x)$.
2. Puntos $x_0, x_1, x_2$ mutuamente distintos ($x_0 \neq x_1$, $x_1 \neq x_2$, $x_0 \neq x_2$).

### 6.5. Proceso Algorítmico Paso a Paso
1. Inicializar $k = 1$, con puntos $x_0, x_1, x_2$.
2. Calcular $h_0 = x_1 - x_0$, $h_1 = x_2 - x_1$.
3. Calcular $\delta_0 = \frac{f(x_1) - f(x_0)}{h_0}$, $\delta_1 = \frac{f(x_2) - f(x_1)}{h_1}$.
4. Calcular coeficientes $a = \frac{\delta_1 - \delta_0}{h_1 + h_0}$, $b = a \cdot h_1 + \delta_1$, $c = f(x_2)$.
5. Calcular el discriminante $D = \sqrt{b^2 - 4ac}$ (puede ser complejo si $b^2 - 4ac < 0$).
6. Determinar el denominador: si $|b + D| > |b - D|$, denominador $= b + D$, en caso contrario denominador $= b - D$.
7. Si el denominador es 0, detener por error de división por cero.
8. Calcular el nuevo punto $x_3 = x_2 - \frac{2c}{\text{denominador}}$.
9. Calcular el error respecto a $x_2$.
10. Verificar parada ($\text{Error} \le \epsilon$ o $k \ge N_{\max}$).
11. Reasignar puntos para la siguiente iteración: $x_0 = x_1$, $x_1 = x_2$, $x_2 = x_3$.
12. Incrementar $k = k + 1$ y repetir desde el Paso 2.

### 6.6. Estructura de la Tabla de Iteraciones
* $k$: Iteración.
* $x_0, x_1, x_2$: Puntos de la parábola actual.
* $x_3$: Nueva aproximación de la raíz (puede ser número real o complejo $a + bi$).
* $f(x_3)$: Evaluación de la función en $x_3$.
* Coeficientes $a, b, c$: (Opcional en vista detallada).
* $\text{Error}$: Error respecto al paso previo.

### 6.7. Condiciones de Convergencia / Parada
* Parada cuando $\text{Error} \le \epsilon$, $|f(x_3)| \le \epsilon$ o $k = N_{\max}$.

### 6.8. Posibles Errores o Excepciones
* Denominador igual a cero ($b = 0$ y $b^2 - 4ac = 0$).
* Tres puntos iniciales colineales con función constante ($f_0 = f_1 = f_2$).
* Formato de números complejos si el usuario no espera raíces imaginarias.

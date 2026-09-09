# 12. Método de Bisección (Fase 5)

Este documento detalla la implementación arquitectónica y matemática del Método de Bisección en IteraMath. Este método sirve como plantilla base para los demás métodos iterativos.

## 1. Definición Matemática
El método de bisección es un algoritmo de búsqueda de raíces que divide repetidamente un intervalo a la mitad y luego selecciona el subintervalo en el que la función cambia de signo, garantizando la convergencia si la función es continua.

* **Fórmula de la iteración:** $m_k = \frac{a_k + b_k}{2}$
* **Condición de inicio:** $f(a) \cdot f(b) < 0$
* **Actualización:** Si $f(a) \cdot f(m) < 0$, entonces $b = m$. En caso contrario, $a = m$.

## 2. Estructura del Algoritmo
El algoritmo está encapsulado en la función pura `bisection(input: BisectionInput)` dentro de `src/methods/bisection.ts`. No posee conocimientos sobre el DOM ni formatea resultados. Todo se devuelve en un objeto de tipo `BisectionResult`.

### Tipos Utilizados
* `BisectionInput`: Configuración de entrada (expresión, $a$, $b$, tolerancia, máx iteraciones, criterio de parada).
* `BisectionIteration`: Historial de una iteración individual ($k, a, b, m, f(a), f(b), f(m)$, error).
* `BisectionResult`: Resumen final que incluye la raíz, lista de iteraciones, error final, residuo, y motivo de parada.
* `StopReason`: Union type que define por qué terminó el algoritmo (`"TOLERANCE_REACHED"`, `"EXACT_ROOT"`, `"MAX_ITERATIONS"`).

## 3. Criterios de Parada y Evaluación de Errores
El método utiliza los criterios comunes de `src/math`:
1. **Absoluto:** $|m_k - m_{k-1}|$
2. **Relativo:** $\left| \frac{m_k - m_{k-1}}{m_k} \right|$
3. **Porcentual:** $\left| \frac{m_k - m_{k-1}}{m_k} \right| \times 100\%$
4. **Residuo:** $|f(m_k)|$

**Nota importante sobre $k=0$:** En la primera iteración ($k=0$), al no existir un $m_{-1}$, los errores de tipo absoluto, relativo y porcentual se evalúan como `null`. El criterio de Residuo, al depender solo de $m_k$, sí se calcula desde la iteración $k=0$.

**Raíz exacta en el punto medio:** Si al calcular $f(m)$ se obtiene exactamente `0`, el algoritmo se detiene inmediatamente marcando `EXACT_ROOT`. Para evitar divisiones por cero, no se intenta evaluar el error relativo en este caso particular.

## 4. Manejo de Errores
Si el intervalo proveído no cumple la condición del Teorema de Bolzano ($f(a) \cdot f(b) \ge 0$), se emite una excepción de tipo `MathError` con código `INVALID_BRACKET`. Si los límites son ilógicos ($a \ge b$), emite `INVALID_INTERVAL`. La interfaz de usuario es responsable de traducir estos códigos a mensajes educativos.

## 5. Pruebas Implementadas
Se ha creado una extensa batería de 12 pruebas unitarias (`bisection.test.ts`) cubriendo:
* Resolución de raíces exactas tempranas (tanto en $a, b$, como en el punto medio).
* Resolución aproximada de funciones polinómicas (ej. $x^3 - x - 1$).
* Protección frente a intervalos inválidos y límites superpuestos.
* Validación del cálculo exacto del error en $k=1$ para los cuatro criterios.
* Parada forzada por máximo de iteraciones.
* Expresiones no válidas derivadas del motor matemático común.

## 6. Estructura de la Tabla (UI)
La tabla mostrada al estudiante mantiene 8 columnas: `k, a, b, m, f(a), f(b), f(m), Error`.
Internamente los valores de la tabla son de precisión doble flotante, y es únicamente en `main.ts` donde se aplica `.toFixed(6)` o `.toExponential(6)` para facilitar la visualización.

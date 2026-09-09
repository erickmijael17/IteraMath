# 11. Motor Matemático Común (Fase 4)

Este documento describe la arquitectura y responsabilidades del núcleo matemático de **IteraMath**, implementado de forma independiente a la interfaz gráfica.

## 1. Principios de Diseño

1. **Aislamiento Total:** El código en `src/math/` no contiene referencias al DOM (`HTMLElement`, `document`, etc.). Se nutre de objetos puros y retorna primitivos.
2. **Precisión Numérica en el Núcleo:** Los cálculos se realizan con precisión de doble formato (IEEE-754) de JavaScript. Cualquier redondeo o formateo queda delegado exclusivamente a la capa de presentación (UI).
3. **Manejo Estricto de Errores:** No se lanzan errores genéricos. Todos los fallos computacionales (división por cero, iteraciones excedidas, dominio inválido) generan instancias de `MathError` con un `MathErrorCode` definido para ser interpretados por la UI.

## 2. Dependencias

Se ha integrado **Math.js** (`mathjs`) como dependencia central para el parseo, compilación y evaluación de funciones. Sus beneficios incluyen:
* Análisis sintáctico seguro de expresiones de usuario (evitando `eval`).
* Soporte nativo de funciones matemáticas (trigonométricas, exponenciales, logarítmicas).
* Preparación para derivación simbólica futura (requerida por Newton-Raphson).

**Vitest** se utiliza como entorno ligero de pruebas unitarias.

## 3. Módulos Implementados

### 3.1. Parseo de Expresiones (`expression.ts`)
Encargado de procesar la entrada en formato texto (ej. `x^2 - 4`) y generar una función evaluadora (`Evaluator`).
* Compila la expresión una única vez usando Math.js para maximizar rendimiento durante bucles iterativos largos.
* Filtra resultados no finitos (`NaN`, `Infinity`).
* Rechaza números complejos (ej. los producidos por `sqrt(-1)` de mathjs en configuraciones por defecto) lanzando el código `OUT_OF_DOMAIN`, asegurando que la evaluación estándar asume el plano real.

### 3.2. Criterios de Error (`error.ts`)
Implementa las fórmulas oficiales para la detención de los métodos iterativos:
* **Error Absoluto:** $|x_k - x_{k-1}|$
* **Error Relativo:** $|\frac{x_k - x_{k-1}}{x_k}|$
* **Error Porcentual:** $|\frac{x_k - x_{k-1}}{x_k}| \times 100\%$
* **Residuo:** $|f(x_k)|$ (Reutilizando el evaluador de expresiones).

> **Aviso de Excepción:** Si se solicita calcular el Error Relativo o Porcentual y la aproximación actual ($x_k$) es exactamente cero, la función lanza el error controlado `DIVISION_BY_ZERO`, previniendo que el algoritmo devuelva silenciamente `Infinity`.

### 3.3. Validaciones Globales (`validation.ts`)
Herramientas reutilizables para garantizar la sanidad de los parámetros antes y durante los algoritmos:
* **Tolerancia:** Debe ser finita y estrictamente mayor a 0.
* **Máximo de Iteraciones:** Debe ser un entero positivo, sin límites restrictivos arbitrarios.
* **Tolerancia Alcanzada:** Evaluación booleana segura (`hasReachedTolerance`) que ignora falsos positivos numéricos (NaN).
* **Verificación Finita:** Exige que los resultados intermedios residan dentro del límite computacional.

### 3.4. Errores Controlados (`errors.ts`)
Estructura de códigos estándar para enrutar los problemas al usuario:
* `INVALID_EXPRESSION`: Problemas de sintaxis o función vacía.
* `NON_FINITE_RESULT`: Resultados `NaN` o $\pm\infty$.
* `DIVISION_BY_ZERO`: Detectado durante errores relativos o cálculos de pendientes.
* `INVALID_TOLERANCE`: Parámetros fuera de norma.
* `INVALID_MAX_ITERATIONS`: Límites configurados de forma no realista.
* `OUT_OF_DOMAIN`: Resultado de evaluación fuera de los números reales esperados (ej. raíces imaginarias no anticipadas).

## 4. Estructura de Integración Futura

Para la Fase 5 y posteriores, todo algoritmo numérico deberá seguir este patrón:

```typescript
// Ejemplo conceptual
export function solveMethod(config: MethodConfig): MethodResult {
    // 1. Validaciones previas
    validateTolerance(config.tolerance);
    validateMaxIterations(config.maxIterations);

    // 2. Compilar expresión
    const evaluator = createExpression(config.fx);

    // 3. Ejecución del bucle iterativo
    // ...
    //   evaluator.evaluate(x)
    //   calculateApproximationError(...)
    //   hasReachedTolerance(...)
    // ...

    // 4. Retorno puro de datos numéricos
}
```

La separación descrita garantiza un testing estable y escalabilidad para la PWA.

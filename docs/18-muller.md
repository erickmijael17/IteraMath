# 18. Método de Müller (Fase 7E)

Este documento detalla la implementación del Método de Müller en IteraMath, la cual consolida y cierra la primera iteración técnica de todos los métodos de búsqueda de raíces planteados para la aplicación.

## 1. Definición Matemática
El método de Müller es una generalización del método de la secante. En lugar de proyectar una recta a través de dos puntos, proyecta una **parábola** a través de **tres puntos** de evaluación $(x_0, x_1, x_2)$, calculando así los coeficientes $(a, b, c)$ de la interpolación cuadrática.

Al resolver la cuadrática para encontrar su intercepción con el eje X ($x_3$), el método es capaz de hallar **raíces complejas conjugadas** inclusive si las entradas provienen de un dominio estrictamente real. 

## 2. Soporte a Números Complejos
Mientras que los métodos anteriores (Bisección, Newton, etc.) manejan excepciones y desbordan con error al salir del dominio iterativo real (`OUT_OF_DOMAIN` para raíces de negativos, por ejemplo), Müller se estructuró con un subsistema completo para operar en $\mathbb{C}$.
* Se diseñó la estructura `ComplexValue { re, im }` serializable y asilada del core interno de `mathjs`.
* Se implementaron formateadores de vista limpia en UI (mostrando `2` o `-i` en vez de sintaxis JSON pesada o `0 + 1i`).
* Se construyó el evaluador `createComplexExpression(expression)` que inyecta valores hipercomplejos de forma controlada a `math.compile()`.

## 3. Comportamiento en Casos Degenerados
* Si el denominador $E$ de la fórmula cuadrática tiene magnitud cero, el proceso aborta bajo `ZERO_MULLER_DENOMINATOR`.
* Si se proporcionan puntos colineales y el denominador del sistema para construir los coeficientes resulta en $0$, el sistema responde proactivamente con `DEGENERATE_MULLER_POINTS`.
* Se maximiza el control del error de arrastre ("Cancellation Error") eligiendo deliberadamente el valor $E \in \{b+D, b-D\}$ que maximice su módulo y arroje la menor penalidad computacional.

## 4. Visualización Gráfica (`src/graph/mullerGraph.ts`)
* Las curvas del espacio real $\mathbb{R}^2$ solo grafican los valores $x_{next}$ que contengan estrictamente $\text{Im} \approx 0$.
* Cuando el método de Müller localiza una raíz en el plano complejo $\mathbb{C}$, la UI de forma predictiva renderiza la curva paramétrica real, **apaga** el ploteo del punto intercepto real (para no generar un punto flotando) y estampa una advertencia visual superpuesta:
> "La raíz pertenece al plano complejo. (a + bi)".

## 5. Pruebas Unitarias
El archivo de pruebas abarca los **10 principales flujos de fallo y éxito**. Destacan las pruebas de:
1. $x^3 - 13x - 12$ convergiendo al espacio real.
2. $x^2 + 1 = 0$ convergiendo a la solución compleja $i$.
3. Manejo natural de tolerancias relativas, porcentuales y evaluación del módulo $r = \sqrt{a^2 + b^2}$.

# 13. Gráficas con Plotly.js (Fase 6)

Este documento detalla el mecanismo de visualización implementado para la representación gráfica matemática en **IteraMath**.

## 1. Arquitectura de Integración

Se ha estructurado la capa de gráficas de manera totalmente independiente del motor numérico, siguiendo el flujo direccional:

`BisectionResult` (Datos Puros) -> `main.ts` (Coordinador UI) -> `graph/` -> `Plotly`

El motor de Bisección no conoce la existencia de Plotly, preservando la capacidad de ejecutar los algoritmos en entornos de servidor, Node, o Web Workers en el futuro.

### Módulos Creados
* `functionSampler.ts`: Encargado de muestrear $f(x)$ generando los puntos necesarios para el lienzo de renderizado.
* `bisectionGraph.ts`: Mapeo explícito de los resultados algorítmicos hacia objetos de trazo (Traces) nativos de Plotly.

## 2. Dependencias
Se ha instalado `plotly.js-dist-min` para asegurar compatibilidad en entornos ESM/Vite sin problemas de dependencias nativas de Node, y sus tipos `@types/plotly.js` para desarrollo estricto.

## 3. Muestreo de Funciones
Para dibujar la curva fluida de la función $f(x)$:
1. Se determina el intervalo principal, por defecto derivado de $[a, b]$ inicial.
2. Para proveer contexto espacial, se suma un **margen de 25%** a cada lado de la función. $x_{min} = a - 0.25(b-a)$ y $x_{max} = b + 0.25(b-a)$.
3. Se seleccionan **300 muestras** dentro de este nuevo rango, las cuales proveen suficiente fluidez de curva y garantizan el rendimiento UI (sin retardos en dispositivos móviles).

### Tratamiento de Discontinuidades
Si un punto $x$ se evalúa como infinito, no numérico (`NaN`), o fuera de dominio continuo, la capa de muestreo devuelve un valor `null`. Plotly interpreta adecuadamente los `null` interrumpiendo el trazo de la línea (rompiendo visualmente la curva) en lugar de unir puntos matemáticamente distantes de forma artificial.

## 4. Trazas (Traces) Representadas
Al ejecutarse una función como Bisección, Plotly superpone múltiples capas visuales:
1. **$f(x)$ (Curva principal):** Trazado en azul.
2. **Intervalo Inicial $[a,b]$:** Marcadores cuadrados, color naranja oscuro. Permiten visualizar la suposición del usuario.
3. **Aproximaciones ($m_k$):** Puntos grises transparentes. Muestran cada punto medio analizado durante el algoritmo.
4. **Raíz aproximada:** Estrella verde de gran tamaño ubicada en $(root, f(root))$, derivada estrictamente del campo `.root` del `BisectionResult`.

## 5. Diseño y Responsividad
La configuración inyectada en Plotly elimina el fondo (transparente) y adapta dinámicamente la ventana gráfica al ancho del contenedor flex. Las opciones de lasso selection fueron deshabilitadas. La gráfica se renderiza en un contenedor interno (`#plotly-canvas`) para evitar el reemplazo destructivo de cabeceras en el DOM.

## 6. Manejo de Errores
Si las evaluaciones arrojan excepciones de matemática insalvable antes de renderizar (ej: fuera de dominio), el sistema no destruye la interfaz sino que escribe sobre el lienzo un mensaje interno de error (`"No fue posible representar completamente..."`). El resultado de la tabla seguirá disponible y preciso.

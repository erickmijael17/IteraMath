# 07. Interfaz y Experiencia de Usuario (UI/UX)

Este documento especifica la estructura visual, la disposición de los elementos (layouts) y el comportamiento de la interfaz de IteraMath, priorizando una experiencia académica, clara y moderna.

## 1. Navegación Principal

La navegación será minimalista, alojada en una barra superior (Header) fijada en la parte superior.

* **Logotipo / Marca:** "IteraMath" (Funciona como enlace a "Resolver").
* **Enlaces:** Resolver, Historial, Teoría.
* *(Opcional)* Botón de alternancia Tema Claro / Oscuro.

## 2. Layout Principal: Pantalla "Resolver"

La pantalla principal se adaptará según el tamaño del dispositivo.

### 2.1. Comportamiento en Escritorio (Desktop)
Se utilizará un **diseño de panel dividido** (Split Screen). 

* **Panel Izquierdo (Formulario - 35% ancho):** Se mantiene visible para permitir la edición rápida de parámetros.
* **Panel Derecho (Resultados - 65% ancho):** Muestra los resultados. Utilizará pestañas (Tabs) para no sobrecargar visualmente la pantalla.

**Wireframe Conceptual (Escritorio):**

```text
+-----------------------------------------------------------------------------+
| [ IteraMath ]                 Resolver      Historial      Teoría           |
+-----------------------------------------------------------------------------+
|  Selecciona un método         |  [ Resumen ] [ Gráfica ] [ Tabla ] [ Código]|
|  [ Newton-Raphson       |v]   |                                             |
|                               |  [Estado: Convergió] [Iteraciones: 5]       |
|  Función f(x):                |  Raíz aproximada:                           |
|  [ x^2 - 4                ]   |  1.99999998                                 |
|  (Ayuda: x^2, sin(x)...)      |  Error final: 1.2e-8                        |
|                               |  Residuo f(x): 0.00000                      |
|  Punto Inicial (x0):          |                                             |
|  [ 3                      ]   |  [ Gráfica o contenido de la pestaña... ]   |
|                               |                                             |
|  Criterio de Error:           |                                             |
|  [ Error Relativo       |v]   |                                             |
|                               |                                             |
|  Tolerancia:                  |                                             |
|  [ 1e-6                   ]   |                                             |
|                               |                                             |
|  Max Iteraciones:             |                                             |
|  [ 100                    ]   |                                             |
|                               |                                             |
|  [       RESOLVER         ]   |                                             |
|  [       Limpiar          ]   |                                             |
+-----------------------------------------------------------------------------+
```

### 2.2. Comportamiento en Móvil (Mobile)
Se cambia a una **disposición vertical**. El usuario primero ve el formulario. Al pulsar "Resolver", el scroll se desplaza hacia la sección de resultados o los resultados aparecen inmediatamente debajo.

**Flujo de visualización vertical:**
1. Navegación superior (hamburguesa o texto simple)
2. Formulario de resolución
3. Tarjeta de Resultado Final y Estado
4. Gráfica de la función
5. Tabla de iteraciones (con desplazamiento horizontal - *scroll-x*)
6. Fórmula y Procedimiento
7. Código Octave

## 3. Comportamiento Dinámico del Formulario

El formulario adaptará sus campos obligatorios dependiendo del método seleccionado. Todos los métodos comparten: **Función f(x), Criterio de Error, Tolerancia, Max Iteraciones**.

* **Bisección / Regla Falsa:**
  * Mostrar: Límite Inferior `a`, Límite Superior `b`.
* **Punto Fijo:**
  * Mostrar: Función `g(x)`, Punto Inicial `x0`.
* **Newton-Raphson:**
  * Mostrar: Punto Inicial `x0`.
* **Secante:**
  * Mostrar: Punto Inicial `x0`, Punto Inicial `x1`.
* **Müller:**
  * Mostrar: Puntos Iniciales `x0`, `x1`, `x2`.

Cerca de la entrada de funciones, habrá un bloque colapsable o tooltip indicando la sintaxis matemática soportada (ej. `x^2 + 3*x - 5`, `sin(x)`, `exp(-x)`).

## 4. Estructura de las Secciones de Resultado

### 4.1. Tarjeta de Resultado (Resumen)
Debe ser lo primero que vea el usuario al resolver.
* Muestra el método utilizado y la función.
* La raíz aproximada (con fuente destacada).
* El error final alcanzado y número de iteraciones.
* Un "Badge" (insignia) indicando el estado visual.

### 4.2. Pestaña: Gráfica
* Contenedor de Plotly.js.
* Mostrará la curva real.
* Si el método de Müller arroja una raíz compleja (`a + bi`), se debe **ocultar la raíz en la gráfica cartesiana** y mostrar un banner de advertencia: *"La raíz obtenida pertenece al plano complejo y no puede representarse en el eje real."*

### 4.3. Pestaña: Tabla de Iteraciones
* Elemento central del aprendizaje.
* Columnas dinámicas según el método (ej. Bisección: $k, a, b, m, f(a), f(m), \text{Error}$).
* **Primera iteración ($k=1$ o $k=0$):** Si no hay valor previo, mostrar `—` en la columna de Error.
* **Raíces Complejas:** Formato legible `a + bi` dentro de las celdas de la tabla para Müller.
* Scroll horizontal forzado (`overflow-x: auto`) para asegurar la visualización en pantallas pequeñas sin romper el layout.

### 4.4. Pestaña: Código GNU Octave
* Un bloque `<pre><code>` con un fondo oscuro o distintivo.
* Un botón flotante "Copiar" en la esquina superior derecha del bloque.

## 5. Pantallas Adicionales

### 5.1. Historial
* Una lista o cuadrícula de tarjetas de ejercicios guardados.
* Cada tarjeta muestra: Método, Función, Raíz, Fecha.
* Botones de acción en cada tarjeta: **[ Ver / Cargar ] [ Eliminar ]**.

### 5.2. Teoría
* Pantalla simple estructurada por secciones (una por método).
* Cada sección incluye: Definición, Fórmula (en formato matemático legible), Requisitos, Ventajas/Limitaciones y Criterio de Convergencia.

## 6. Manejo de Estados Visuales (Alertas y Errores)

IteraMath debe comunicarse claramente mediante estados visuales estandarizados:
* **Convergencia Exitosa:** Color verde, ícono de check.
* **Máximo de Iteraciones Alcanzado:** Color naranja/advertencia. Informa que se alcanzó el límite sin satisfacer la tolerancia.
* **No convergió / Divergencia:** Color rojo.
* **Intervalo Inválido (Ej. Bisección sin cambio de signo):** Bloqueo antes de resolver, alerta color rojo en el formulario.
* **División por cero / Derivada cero:** Color rojo. El algoritmo se detiene y muestra el mensaje.
* **Fallo en Derivación Simbólica:** Color naranja. Si Math.js falla al derivar en Newton-Raphson, se informa explícitamente: *"Fallo en la derivación simbólica. La función no pudo ser procesada analíticamente."*
* **Raíz Compleja (Müller):** Color azul o violeta (información). Se muestra `a + bi` y advertencia en la gráfica.

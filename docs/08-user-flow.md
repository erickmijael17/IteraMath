# 08. Flujo de Usuario (User Flow)

Este documento detalla el recorrido que realiza el usuario al interactuar con IteraMath, desde el ingreso a la plataforma hasta la revisión del historial. El objetivo es mantener el ciclo de uso de forma lógica y secuencial: **Ingresar función → Configurar método → Resolver → Comprender el procedimiento.**

---

## 1. Flujo Principal (Camino Feliz / Happy Path)

1. **Inicio de la Aplicación:** El usuario aterriza en la pantalla principal ("Resolver"). Visualiza el formulario vacío y un área de resultados en blanco o con un mensaje de bienvenida.
2. **Selección de Método:** En el primer campo desplegable, selecciona el método deseado (Ej. "Newton-Raphson").
   * *Acción interna:* El formulario se actualiza dinámicamente para mostrar los campos requeridos para Newton-Raphson (sólo $x_0$).
3. **Ingreso de Función y Parámetros:**
   * Ingresa la función en notación matemática (ayudándose de la guía sintáctica cercana).
   * Ingresa el punto inicial (ej. $x_0 = 2$).
   * Configura la Tolerancia, Max Iteraciones y selecciona el Criterio de Error.
4. **Validación:** El usuario hace clic en "Resolver".
   * *Acción interna:* El sistema evalúa si la sintaxis es válida y si los parámetros cumplen las reglas del método.
5. **Ejecución y Generación de Resultados:**
   * *Acción interna:* El algoritmo se ejecuta en milisegundos.
   * *Acción interna:* Se guarda el ejercicio en el historial local (IndexedDB).
6. **Visualización de Resultados:** El panel derecho (escritorio) o la sección inferior (móvil) se actualiza:
   * Aparece la tarjeta de estado: "Convergencia Exitosa".
   * Se muestra la raíz encontrada y el error final.
7. **Exploración del Procedimiento (Pestañas):**
   * El usuario navega a la pestaña **Gráfica** para ver la curva y la raíz sobre el eje X.
   * Navega a la pestaña **Tabla** para auditar cada iteración paso a paso.
   * Navega a la pestaña **Código** para copiar el script equivalente en Octave.

---

## 2. Flujos Alternativos y Excepciones

### 2.1. Flujo de Error: Sintaxis Matemática Inválida
* **Paso:** Al hacer clic en "Resolver".
* **Resultado:** El motor de validación falla.
* **Respuesta UI:** La ejecución se detiene. El campo de la función se marca en rojo. Se muestra un mensaje inferior indicando "Expresión matemática no válida". No se genera nueva tabla ni historial.

### 2.2. Flujo de Error: Condiciones del Método no cumplidas
* **Paso:** Al hacer clic en "Resolver" (Ej. Bisección con $f(a) \cdot f(b) > 0$).
* **Resultado:** La validación matemática inicial falla.
* **Respuesta UI:** La ejecución se detiene antes de iterar. Se muestra un mensaje de alerta: *"No se garantiza una raíz en este intervalo. $f(a)$ y $f(b)$ deben tener signos opuestos."*

### 2.3. Flujo de Excepción: Máximo de iteraciones alcanzado
* **Paso:** Durante la ejecución algorítmica.
* **Resultado:** El bucle llega a $N_{\max}$ sin que el error caiga por debajo de la tolerancia.
* **Respuesta UI:** Se muestran los resultados hasta la iteración $N_{\max}$. La tarjeta de resumen tiene un badge amarillo indicando "Máximo de iteraciones alcanzado".

### 2.4. Flujo de Excepción: División por Cero / Divergencia
* **Paso:** Durante la ejecución (Ej. Secante donde $f(x_k) = f(x_{k-1})$).
* **Resultado:** El cálculo falla en la iteración $k$.
* **Respuesta UI:** El bucle se detiene tempranamente. Se muestra la tabla hasta el paso $k$. La tarjeta de resumen tiene un badge rojo indicando "División por cero detectada".

### 2.5. Flujo Específico: Falla de Derivada Simbólica (Newton-Raphson)
* **Paso:** Al intentar ejecutar Newton-Raphson, Math.js procesa $f(x)$.
* **Resultado:** La derivación falla por complejidad matemática o limitaciones de la librería.
* **Respuesta UI:** Se detiene el método. Aparece un mensaje naranja claro: *"Fallo en la derivación simbólica. La función no pudo ser procesada analíticamente."* (No se cambia silenciosamente a derivación numérica).

### 2.6. Flujo Específico: Raíces Complejas (Método de Müller)
* **Paso:** Durante la ejecución de Müller, el discriminante se vuelve negativo.
* **Resultado:** Las aproximaciones subsiguientes toman la forma $a + bi$.
* **Respuesta UI:** 
  * La tabla de iteraciones muestra los números complejos correctamente.
  * La tarjeta de resultado final muestra la raíz como número complejo.
  * La pestaña **Gráfica** dibuja la función real, pero oculta la representación de la raíz sobre el eje y añade una alerta indicando que la solución reside en el plano complejo.

---

## 3. Flujo de Navegación Secundaria

### 3.1. Revisión de Historial
1. El usuario hace clic en "Historial" en la barra de navegación superior.
2. Visualiza el listado de ejercicios previos.
3. **Acción Ver/Repetir:** Al hacer clic en un ejercicio, los datos se cargan automáticamente en el formulario de la pantalla "Resolver" y se ejecuta de inmediato mostrando los resultados.
4. **Acción Eliminar:** El usuario borra un elemento específico o limpia todo el historial.

### 3.2. Consulta de Teoría
1. El usuario hace clic en "Teoría" en la navegación.
2. Accede a un manual interactivo o formato acordeón donde puede repasar las fórmulas y limitaciones de cada método numérico soportado.

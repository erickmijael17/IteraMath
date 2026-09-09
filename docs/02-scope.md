# 02. Alcance del Proyecto (Project Scope)

Este documento define las fronteras operativas y funcionales de **IteraMath** para su primera versión (Fase 1 e implementación inicial), especificando detalladamente los componentes incluidos e identificando aquellos que quedan fuera del alcance inicial para considerar en versiones futuras.

---

## 1. Alcance Incluido Inicialmente (In-Scope)

La versión inicial de IteraMath se centra en la solución interactiva y educativa de **Ecuaciones No Lineales (Búsqueda de Raíces)** con las siguientes características:

### 1.1. Métodos Numéricos de Raíces
Implementación manual y transparente de seis (6) métodos numéricos fundamentales:
1. **Método de Bisección** (Cerrado)
2. **Método de la Regla Falsa / Falsa Posición** (Cerrado)
3. **Método del Punto Fijo** (Abierto)
4. **Método de Newton-Raphson** (Abierto, con derivada simbólica/evaluada)
5. **Método de la Secante** (Abierto)
6. **Método de Müller** (Abierto / Cuadrático, soporta/detecta raíces complejas)

### 1.2. Entrada de Funciones y Expresiones
* Parseo y evaluación sintáctica matemática cliente-side utilizando Math.js.
* Soporte para expresiones matemáticas estándar (ej. `x^3 - 2*x - 5`, `exp(-x) - x`, `cos(x) - x`).
* Soporte para funciones trigonométricas, exponenciales, logarítmicas y polinómicas.
* Para Punto Fijo: ingreso de $f(x)$ y $g(x)$.
* Para Newton-Raphson: ingreso de $f(x)$ con cálculo automático de $f'(x)$ (con opción de edición manual).

### 1.3. Parámetros Dinámicos y Criterios de Error
* Configuración de valores iniciales según el método:
  * Intervalos $[a, b]$ para métodos cerrados.
  * Punto inicial $x_0$ para Punto Fijo y Newton-Raphson.
  * Puntos iniciales $x_0, x_1$ para Secante.
  * Puntos iniciales $x_0, x_1, x_2$ para Müller.
* Configuración de **Tolerancia** ($\epsilon$) en notación decimal o científica (ej. $10^{-6}$).
* Configuración de **Máximo de Iteraciones** ($N_{\max}$).
* Selección flexible de **Criterio de Error / Parada**:
  1. Error Absoluto ($E_a = |x_{k+1} - x_k|$)
  2. Error Relativo ($E_r = \left|\frac{x_{k+1} - x_k}{x_{k+1}}\right|$)
  3. Error Relativo Porcentual ($E_p = \left|\frac{x_{k+1} - x_k}{x_{k+1}}\right| \times 100\%$)
  4. Error evaluado en la función ($|f(x_k)|$)

### 1.4. Tablas y Visualización de Procedimiento
* Tabla interactiva completa con todas las iteraciones realizadas.
* Columnas ajustadas dinámicamente según el método (ej. $k, a, b, x_r, f(a), f(b), f(x_r), \text{Error}$).
* Resaltado visual de la iteración final donde se alcanzó la convergencia o se detuvo el algoritmo.

### 1.5. Visualización Gráfica Interactiva
* Renderizado gráfico de $f(x)$ mediante Plotly.js en el cliente.
* Marcas visuales de los puntos iniciales, intervalo de búsqueda y raíz aproximada obtenida.
* Zoom, pan e inspección interactiva de coordenadas sobre la curva.

### 1.6. Resumen de Resultados y Diagnóstico
* Presentación clara de la raíz aproximada obtenida.
* Evaluación de $f(x_{final})$.
* Número total de iteraciones consumidas.
* Diagnóstico del estado de convergencia (Convergencia Exitosa, Divergencia Detectada, Límite de Iteraciones Alcanzado, Error Matemático/División por cero).

### 1.7. Generador de Código GNU Octave
* Generación de un script ejecutable en GNU Octave equivalente al método y parámetros configurados.
* Opción de copiar al portapapeles con un solo clic.

### 1.8. Historial Local y Persistencia
* Almacenamiento local de ejercicios resueltos utilizando IndexedDB.
* Vista de historial para consultar, recargar o eliminar ejercicios pasados sin requerir conexión.

### 1.9. PWA y Modo Offline
* Service Worker para almacenamiento en caché de assets estáticos (HTML, CSS, JS, imágenes).
* Web App Manifest para permitir la instalación de IteraMath en la pantalla de inicio del dispositivo.
* Funcionamiento 100% offline.

---

## 2. Fuera del Alcance Inicial (Out-of-Scope)

Las siguientes características **NO forman parte de la primera versión**, aunque se conservan como posibles expansiones futuras:

### 2.1. Funcionalidades de Red y Cuentas
* Autenticación de usuarios (Login / Register / OAuth).
* Gestión de perfiles de usuario o roles (Estudiante / Docente).
* Almacenamiento en base de datos remota en la nube.
* Sincronización automática del historial entre múltiples dispositivos.
* Colaboración multiusuario en tiempo real o salas compartidas.

### 2.2. Backend y Servicios Externos
* Servidores de aplicación (Node.js/Express, Django, Laravel, Spring Boot, etc.).
* APIs externas o servicios SaaS para resolución de operaciones matemáticas o gráficos.

### 2.3. Aplicaciones Nativas
* Aplicaciones nativas compiladas para iOS (App Store) o Android (Google Play Store) escritas en Swift/Kotlin/React Native (se utilizará PWA para cobertura multiplataforma).

### 2.4. Otros Temas de Métodos Numéricos
* Solución de sistemas de ecuaciones lineales (Gauss, Gauss-Jordan, Jacobi, Gauss-Seidel).
* Solución de sistemas de ecuaciones no lineales (Newton-Raphson multivariable).
* Interpolación y ajuste de curvas (Lagrange, Newton, Mínimos Cuadrados).
* Integración y diferenciación numérica (Trapecio, Simpson).
* Ecuaciones diferenciales ordinarias (Euler, Runge-Kutta).

---

## 3. Matriz de Alcance Resumida

| Característica / Módulo | Incluido en Fase Inicial | Reservado para Futuras Versiones |
| :--- | :---: | :---: |
| 6 Métodos de Raíces ($f(x)=0$) | **SÍ** | — |
| Interpretador de Funciones Client-Side | **SÍ** | — |
| Algoritmos Propios de Búsqueda | **SÍ** | — |
| Tablas Interactivas de Iteración | **SÍ** | — |
| Gráficas Dinámicas con Plotly.js | **SÍ** | — |
| Código equivalente GNU Octave | **SÍ** | — |
| Persistencia Local con IndexedDB | **SÍ** | — |
| Soporte Offline PWA | **SÍ** | — |
| Login / Usuarios / Registro | — | **SÍ** |
| Backend / Base de Datos Remota | — | **SÍ** |
| Métodos de Sistemas / Integración / EDOs | — | **SÍ** |

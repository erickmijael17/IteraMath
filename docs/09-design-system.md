# 09. Sistema de Diseño (Design System)

Este documento establece la propuesta inicial de identidad visual y lineamientos de diseño para **IteraMath**. El objetivo es lograr una interfaz simple, académica y moderna que favorezca la concentración y la legibilidad de datos matemáticos.

*(Nota: En esta fase conceptual no se vincula a ningún framework CSS específico como Tailwind o Bootstrap, dejando la implementación abierta a la siguiente fase).*

---

## 1. Paleta de Colores

Se define una paleta que transmite seriedad y foco analítico, previendo la compatibilidad con un futuro "Modo Oscuro".

* **Colores Principales (Brand):**
  * **Primario:** Azul Índigo `#4F46E5` (Utilizado para botones principales, enlaces, bordes activos).
  * **Secundario:** Azul Claro `#E0E7FF` (Para fondos sutiles, hover states).
* **Colores Neutrales (Fondos y Textos):**
  * **Fondo Base (Modo Claro):** Gris muy claro `#F9FAFB` o Blanco `#FFFFFF`.
  * **Texto Principal:** Gris Oscuro `#111827` (Alta legibilidad para fórmulas).
  * **Texto Secundario (Muted):** Gris Medio `#6B7280` (Para labels, placeholders).
  * **Bordes y Divisores:** Gris Suave `#E5E7EB`.
* **Colores Semánticos (Estados):**
  * **Éxito (Convergencia):** Verde Esmeralda `#10B981` (Fondo suave: `#D1FAE5`).
  * **Error (Divergencia / Validación):** Rojo Carmesí `#EF4444` (Fondo suave: `#FEE2E2`).
  * **Advertencia (Complejos / Max Iteraciones):** Naranja/Ambar `#F59E0B` (Fondo suave: `#FEF3C7`).
  * **Información:** Azul Cian `#0EA5E9` (Fondo suave: `#E0F2FE`).

---

## 2. Tipografía

La prioridad es la legibilidad de números y funciones.

* **Fuente Principal (UI):** Familia *Sans-Serif* moderna (ej. `Inter`, `Roboto`, o `system-ui`).
  * Pesos: Regular (400) para texto base, SemiBold (600) para encabezados, Bold (700) para resultados destacados.
* **Fuente Monoespaciada (Tablas, Fórmulas en texto, Código):** Familia *Monospace* (ej. `Fira Code`, `JetBrains Mono`, `Consolas`).
  * Es crucial el uso de fuentes monoespaciadas en la tabla de iteraciones para que los puntos decimales y el formato de los números flotantes se alineen correctamente.

---

## 3. Escalas y Espaciados

Se utilizará una escala basada en múltiplos de 4px para mantener ritmo vertical y horizontal.

* **Espaciado interior (Padding) en tarjetas:** `16px` o `24px`.
* **Espaciado entre secciones (Margin):** `24px` o `32px`.
* **Espaciado en celdas de tabla:** `8px` vertical, `12px` horizontal.

---

## 4. Elementos de la Interfaz (UI Components)

### 4.1. Radios (Border Radius) y Sombras
* **Bordes redondeados:** Suaves, `6px` o `8px` para tarjetas, botones e inputs.
* **Sombras (Box Shadows):** Ligeras para dar profundidad a las tarjetas del panel derecho. 
  * Sombra estándar: `0 1px 3px rgba(0,0,0,0.1)`.

### 4.2. Formularios (Inputs y Selects)
* **Estado Normal:** Borde sólido `#E5E7EB`, fondo blanco.
* **Estado Focus:** Borde se ilumina con el color Primario (`#4F46E5`), añadiendo un ligero anillo (ring) del mismo color.
* **Estado Error:** Borde se torna Rojo (`#EF4444`), mensaje pequeño en rojo debajo del input.

### 4.3. Botones
* **Botón Primario (Resolver):** Fondo Azul Índigo (`#4F46E5`), texto blanco, peso SemiBold. Hover: oscurece ligeramente el fondo.
* **Botón Secundario (Limpiar):** Fondo transparente o gris muy claro, texto Gris Oscuro, borde sutil. Hover: oscurece el fondo gris.

### 4.4. Tablas
* **Cabecera (thead):** Fondo gris claro `#F3F4F6`, texto en negrita y color Gris Oscuro.
* **Filas (tbody):** Alternancia de color sutil (Zebra striping) para no perderse en tablas con muchas iteraciones. Borde inferior en cada fila.
* **Alineación:** Números alineados a la derecha o por coma decimal, textos centrados.

### 4.5. Badges (Insignias)
Píldoras pequeñas con bordes redondeados (`full radius`) para marcar estados:
* *Ejemplo:* `[ ✓ Convergió ]` (Fondo `#D1FAE5`, Texto `#065F46`).
* *Ejemplo:* `[ ! Max Iteraciones ]` (Fondo `#FEF3C7`, Texto `#92400E`).

### 4.6. Tarjetas (Cards)
Contenedores con fondo blanco, borde de `1px` gris claro y sombra suave. Servirán para agrupar las secciones de resultados:
* Tarjeta de Resumen (Destaca la raíz principal con tamaño de fuente grande).
* Tarjeta para el Gráfico.
* Tarjeta para la Tabla (con scroll horizontal interno).
* Tarjeta de Código.

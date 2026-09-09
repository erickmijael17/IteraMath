# 10. Arquitectura Frontend (Fase 3)

Este documento detalla la estructura base del frontend implementada en la Fase 3, estableciendo las reglas arquitectónicas para IteraMath.

---

## 1. Decisiones Tecnológicas Aplicadas

* **Vanilla TypeScript:** Se utiliza TypeScript estricto sin frameworks reactivos (sin React, Vue o Angular) para mantener el proyecto ligero, directo y enfocado en el valor educativo del código numérico.
* **Vite:** Utilizado como entorno de desarrollo rápido (HMR) y empaquetador (bundler).
* **CSS Puro:** Implementado usando *CSS Custom Properties* (Variables) organizadas por responsabilidades (variables, layout, components) en lugar de dependencias externas como Tailwind o Bootstrap.

---

## 2. Estructura de Directorios

La estructura base creada (y proyectada para fases futuras) es la siguiente:

```text
src/
├── main.ts               (Punto de entrada, inicialización global)
├── types/
│   └── numerical.ts      (Interfaces y Tipos globales, ej. NumericalMethod)
├── ui/
│   ├── methodForm.ts     (Lógica de renderizado dinámico y eventos del formulario)
│   └── tabs.ts           (Lógica para conmutación de pestañas)
└── styles/
    ├── variables.css     (Tokens de diseño: colores, espaciados, tipografías)
    ├── base.css          (Reset y tipografía global)
    ├── layout.css        (Estructura principal: Header, Split Panel)
    ├── components.css    (Botones, Inputs, Tabs, Tablas, Badges)
    └── responsive.css    (Reglas para adaptabilidad en móviles)
```

*(Carpetas como `math/`, `graph/`, `octave/`, `storage/` se irán creando conforme se desarrollen en fases posteriores).*

---

## 3. Flujo Básico de Eventos

1. **Inicialización:** Al cargar `main.ts`, se importan los estilos y se inicializan los módulos UI (`setupTabs` y `setupMethodForm`).
2. **Selección de Método:** Al cambiar el `<select id="method-selector">`, el módulo `methodForm.ts` inyecta en el DOM dinámicamente los campos requeridos (`a`, `b`, `x0`, `gx`, etc.).
3. **Validación:** El formulario utiliza la validación nativa de HTML5 (`required`, `type="number"`).
4. **Ejecución (Placeholder):** Al enviar el formulario válido (evento `submit`), se previene la recarga de página y se llama a `onResolve`.
5. **Cambio de Estado UI:** `onResolve` oculta el *Empty State* y muestra el *Contenedor de Resultados* indicando un mensaje temporal hasta que se integre el motor matemático.

---

## 4. Reglas Arquitectónicas para Futuras Fases

1. **Separación de Responsabilidades (SoC):** La lógica de cálculo matemático (`src/math/`) NUNCA debe acceder ni modificar el DOM (document.getElementById). Todo motor matemático debe recibir parámetros de entrada puros y retornar objetos de resultado puros.
2. **Sin clases innecesarias:** Favorecer el uso de funciones puras exportadas y módulos sobre programación orientada a objetos (clases) cuando no haya un estado complejo que encapsular.
3. **Tipado Estricto:** Evitar el uso de `any`. Las entradas del formulario deben convertirse explícitamente a `number` o `string` y enviarse a los algoritmos usando interfaces bien definidas (basadas en `MethodConfig`).
4. **Modularidad CSS:** Mantener el encapsulamiento visual respetando los archivos de estilos definidos. Los componentes nuevos deben agregarse a `components.css`.

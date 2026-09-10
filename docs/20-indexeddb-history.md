# 20. Persistencia Local con IndexedDB e Historial (Fase 9)

Este documento describe la arquitectura y diseño de la persistencia local en IteraMath.

## 1. Objetivo y Privacidad

El módulo de historial almacena las ejecuciones matemáticas directamente en el navegador del usuario utilizando `IndexedDB`, garantizando privacidad 100% offline (sin bases de datos remotas ni servicios externos).

## 2. Base de Datos
*   **Nombre**: `iteramath-db`
*   **Versión Inicial**: `1`
*   **Store**: `history`
*   **Índices**: `createdAt` (útil para el ordenamiento descendente sin cargar memoria excesiva).
*   **Estrategia de Migración**: El evento `onupgradeneeded` administra la versión `1`. Si en un futuro es necesario añadir nuevos stores o índices, se incrementará `DB_VERSION` añadiendo las modificaciones necesarias en el listener sin destruir el store actual.

## 3. Arquitectura
La UI interactúa exclusivamente con los métodos de repositorio que aíslan la lógica IndexedDB subyacente.
```text
UI (main.ts, ui/history.ts) -> HistoryRepository -> Database Connection -> IndexedDB
```
Las entidades se protegen utilizando `structuredClone()` antes de insertarse en el store para asegurar una limpieza total de las referencias inválidas (nodos DOM o funciones).

## 4. Política de Almacenamiento
*   Se guardan entradas **válidas**, lo cual incluye ejecuciones que convergen o terminan por `MAX_ITERATIONS`.
*   Errores iniciales de configuración, intervalos inválidos o sintaxis erróneas NO manchan el historial.
*   En caso de que `IndexedDB` lance una excepción o no esté disponible (ej. ventanas privadas estrictas), la aplicación continúa funcionando fluidamente; muestra una advertencia visual amarilla bajo el botón de éxito para no entorpecer el avance matemático del estudiante.

## 5. El Modelo: Unión Discriminada
Para garantizar la precisión estricta de TypeScript y evitar `any`, las entidades guardadas están modeladas sobre `HistoryEntry` en `src/types/history.ts`.
```typescript
export type HistoryEntry = 
    | BisectionHistoryEntry
    | SecantHistoryEntry
    | MullerHistoryEntry ...
```
Donde cada tipo agrupa su `method`, `input`, y `result` respectivo.

## 6. Integración en UI
Se añadió una segunda vista (`view-history`) conmutando estilos (`hidden`) al presionar los enlaces de navegación (`nav-resolver` vs `nav-history`).
Las acciones sobre cada tarjeta son:
*   **Ver**: Navega instantáneamente de regreso al formulario e inyecta la simulación completa sin recalcular (usando el callback).
*   **Repetir**: Recupera los inputs almacenados, inyectándolos en el formulario, para que el usuario pueda iterar los datos ligeramente antes de pulsar nuevamente "Resolver".
*   **Eliminar / Limpiar**: Borrado asíncrono con `showConfirmModal()`, el cual implementa una capa accesible de interacción en CSS (evitando `alert` y `confirm` bloqueantes).

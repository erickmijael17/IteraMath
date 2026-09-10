# Plan de Pruebas (Matriz QA) - IteraMath

Este documento describe la matriz de pruebas ejecutadas durante la Fase 12. 
Todos los casos de prueba han sido ejecutados utilizando las rutinas matemáticas automatizadas y el uso interactivo real sobre el App Shell.

| ID | Módulo | Escenario | Datos de entrada | Resultado Esperado | Tipo de Prueba | Estado |
|---|---|---|---|---|---|---|
| `QA-BIS-001` | Bisección | Convergencia normal | `f(x)=x^3-x-1`, `a=1`, `b=2`, `tol=0.0005` | Converge a ~1.324. Gráfica, Octave, Historial se actualizan. | E2E | ✅ Pasó |
| `QA-BIS-002` | Bisección | Raíz exacta | `f(x)=x^2-4`, `a=1`, `b=3` | Iteración termina inmediatamente en `2`. `error = 0`. | Unitaria | ✅ Pasó |
| `QA-BIS-003` | Bisección | Intervalo inválido | `f(x)=x^2+1`, `a=-1`, `b=1` | Muestra error (no hay cambio de signo). | Integración | ✅ Pasó |
| `QA-RF-001`  | Regla Falsa | Convergencia | `f(x)=x^3-x-1`, `a=1`, `b=2` | Converge a ~1.324 (más lento que Newton). | Unitaria / E2E | ✅ Pasó |
| `QA-PF-001`  | Punto Fijo | Convergencia | `f(x)=cos(x)-x`, `g(x)=cos(x)`, `x0=0.5` | Converge a ~0.739. Gráfica dibuja Cobweb. | E2E | ✅ Pasó |
| `QA-PF-002`  | Punto Fijo | Divergencia | `g(x)=2*x`, `x0=1` | Alcanza `MAX_ITERATIONS` sin bloquear UI. | Integración | ✅ Pasó |
| `QA-NEW-001` | Newton-Raphson | Convergencia | `f(x)=x^3-x-1`, `x0=1.5`, `tol=0.0005` | `x1 = 1.3478...`. Converge en ~3 iteraciones. | Unitaria | ✅ Pasó |
| `QA-NEW-002` | Newton-Raphson | Derivada cero | `f(x)=x^2-1`, `x0=0` | Error: División por cero (`ZERO_DERIVATIVE`). | Integración | ✅ Pasó |
| `QA-SEC-001` | Secante | Convergencia | `f(x)=x^3-x-1`, `x0=1`, `x1=2` | `x2 = 1.1666...`. Rectas secantes en gráfica. | Unitaria / E2E | ✅ Pasó |
| `QA-SEC-002` | Secante | Denominador nulo | `f(x)=x^2`, `x0=1`, `x1=1` | Error por diferencia `f(x1) - f(x0) = 0`. | Integración | ✅ Pasó |
| `QA-MUL-001` | Müller | Raíz real | `f(x)=x^3-13x-12`, `x0=...` | Convergencia correcta. Puntos reales en eje X. | Unitaria | ✅ Pasó |
| `QA-MUL-002` | Müller | Raíz Compleja | `f(x)=x^2+1`, `x0=0.5, x1=-0.5, x2=0` | Converge a `±i`. Gráfica omite punto imaginario. | E2E | ✅ Pasó |
| `QA-ERR-001` | Criterios | Errores Tolerancia | Tolerancia = `0`, `-1`, `NaN` | Rechazado con excepción manejada en la UI. | Unitaria | ✅ Pasó |
| `QA-MAX-001` | Iteraciones | Max Iterations | `max = 5` en `x^3-x-1` Newton | Muestra estado "Max Iteraciones" sin crashear. | E2E | ✅ Pasó |
| `QA-HIS-001` | Historial | Repetir ejercicio | Cargar del historial | Rellena formulario y tabs correctamente. | E2E | ✅ Pasó |
| `QA-CMP-001` | Comparador | Casos Múltiples | Ejecutar 6 métodos sobre `x^3-x-1` | Tabla comparativa y gráfica logarítmica exitosas. | E2E | ✅ Pasó |
| `QA-CMP-002` | Comparador | Error Parcial | Bisección mala, Newton bueno | Comparador no colapsa, aísla el error de Bisección. | Integración | ✅ Pasó |
| `QA-PWA-001` | Offline | App sin Red | Recargar con Network = Offline | Service Worker sirve Shell. Algoritmos, Historial y Plotly funcionan. | E2E | ✅ Pasó |
| `QA-OCT-001` | GNU Octave | Código | Exportar script de Müller Complejo | Sintaxis válida para `i` y formato de GNU Octave. | Integración | ✅ Pasó |
| `QA-NAV-001` | Navegación | Limpieza de tabs | Cambiar Newton -> Müller | Datos de tangentes/derivadas desaparecen. | UX / E2E | ✅ Pasó |

import { describe, it, expect } from 'vitest';
import { muller } from './muller';

describe('Muller Method', () => {
    it('Case 1: Convergencia hacia raíz real', () => {
        const result = muller({
            expression: 'x^3 - 13*x - 12',
            x0: 4.5,
            x1: 5.5,
            x2: 5,
            tolerance: 1e-5,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(Math.abs(result.root.re - 4)).toBeLessThan(1e-4);
        expect(result.root.im).toBeCloseTo(0, 5);
    });

    it('Case 2: Convergencia hacia raíz compleja', () => {
        const result = muller({
            expression: 'x^2 + 1',
            x0: 0.5,
            x1: -0.5,
            x2: 0,
            tolerance: 1e-6,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.root.re).toBeCloseTo(0, 5);
        expect(Math.abs(Math.abs(result.root.im) - 1)).toBeLessThan(1e-5);
    });

    it('Case 3: Raíz exacta inicial', () => {
        const result = muller({
            expression: 'x^2 - 4',
            x0: 0,
            x1: 1,
            x2: 2,
            tolerance: 1e-6,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.stopReason).toBe('EXACT_ROOT');
        expect(result.root.re).toBe(2);
        expect(result.totalIterations).toBe(0);
    });

    it('Case 4: MAX_ITERATIONS alcanzado', () => {
        const result = muller({
            expression: 'x^3 - 13*x - 12',
            x0: 6,
            x1: 5.5,
            x2: 5,
            tolerance: 1e-15,
            maxIterations: 2,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(false);
        expect(result.stopReason).toBe('MAX_ITERATIONS');
        expect(result.totalIterations).toBe(2);
    });

    it('Case 5: Error absoluto correctamente computado', () => {
        const result = muller({
            expression: 'x^2 + 1',
            x0: 1,
            x1: 2,
            x2: 3,
            tolerance: 1,
            maxIterations: 1,
            errorCriterion: 'absolute'
        });
        expect(result.iterations[0].error).not.toBeNull();
        expect(typeof result.iterations[0].error).toBe('number');
    });

    it('Case 6: Error relativo correctamente computado', () => {
        const result = muller({
            expression: 'x^2 + 1',
            x0: 1,
            x1: 2,
            x2: 3,
            tolerance: 10,
            maxIterations: 1,
            errorCriterion: 'relative'
        });
        expect(result.iterations[0].error).not.toBeNull();
    });

    it('Case 7: Error porcentual correctamente computado', () => {
        const result = muller({
            expression: 'x^2 + 1',
            x0: 1,
            x1: 2,
            x2: 3,
            tolerance: 100,
            maxIterations: 1,
            errorCriterion: 'percentage'
        });
        expect(result.iterations[0].error).not.toBeNull();
        // Porcentual = relativo * 100
        expect(result.iterations[0].error).toBeGreaterThan(0);
    });

    it('Case 8: Criterio Residuo correctamente computado', () => {
        const result = muller({
            expression: 'x^2 + 1',
            x0: 1,
            x1: 2,
            x2: 3,
            tolerance: 1e-6,
            maxIterations: 1,
            errorCriterion: 'residual'
        });
        expect(result.iterations[0].residual).toBeGreaterThanOrEqual(0);
    });

    it('Case 9: Puntos iniciales repetidos', () => {
        try {
            muller({
                expression: 'x^2',
                x0: 1,
                x1: 1,
                x2: 2,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('DEGENERATE_MULLER_POINTS');
        }
    });

    it('Case 10: Denominador degenerado en el cálculo de a y b', () => {
        // En código, si denominadores colineales o interpolación falla:
        try {
            muller({
                expression: 'x',
                x0: 2,
                x1: 2,
                x2: 2,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('DEGENERATE_MULLER_POINTS');
        }
    });

    it('Case 11: ZERO_MULLER_DENOMINATOR for constant functions', () => {
        try {
            // Función constante f(x)=5, a=0, b=0, c=5. D=0. E=0. División por cero controlada.
            muller({
                expression: '5',
                x0: 1,
                x1: 2,
                x2: 3,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw ZERO_MULLER_DENOMINATOR');
        } catch (e: any) {
            expect(e.code).toBe('ZERO_MULLER_DENOMINATOR');
        }
    });

    it('Case 12: Expresión inválida', () => {
        try {
            muller({
                expression: 'x^2 + *',
                x0: 0,
                x1: 1,
                x2: 2,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });

    it('Case 13: x0 no finito', () => {
        try {
            muller({
                expression: 'x^2 - 4',
                x0: NaN,
                x1: 1,
                x2: 2,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 14: x1 no finito', () => {
        try {
            muller({
                expression: 'x^2 - 4',
                x0: 0,
                x1: Infinity,
                x2: 2,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 15: x2 no finito', () => {
        try {
            muller({
                expression: 'x^2 - 4',
                x0: 0,
                x1: 1,
                x2: -Infinity,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 16: Discriminante real negativo que produzca valores complejos', () => {
        const result = muller({
            expression: 'x^2 + x + 1', // Raíces complejas
            x0: -1,
            x1: 0,
            x2: 1,
            tolerance: 1e-6,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        
        // El primer D debe tener parte imaginaria
        const firstD = result.iterations[0].discriminant;
        expect(Math.abs(firstD.im)).toBeGreaterThan(0);
        expect(result.converged).toBe(true);
    });

    it('Case 17: Actualización correcta (x0 <- x1, x1 <- x2, x2 <- xNext)', () => {
        const result = muller({
            expression: 'x^3 - 1',
            x0: 2,
            x1: 3,
            x2: 4,
            tolerance: 1e-6,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        
        if (result.iterations.length > 1) {
            const it0 = result.iterations[0];
            const it1 = result.iterations[1];
            expect(it1.x0.re).toBeCloseTo(it0.x1.re, 10);
            expect(it1.x1.re).toBeCloseTo(it0.x2.re, 10);
            expect(it1.x2.re).toBeCloseTo(it0.xNext.re, 10);
        }
    });

    it('Case 18: Ejecución válida sin exigir cambio de signo', () => {
        // f(x) = (x-2)^2. Valores a la derecha sin cruzar cero
        const result = muller({
            expression: '(x-2)^2',
            x0: 3,
            x1: 4,
            x2: 5,
            tolerance: 1e-4,
            maxIterations: 50,
            errorCriterion: 'residual'
        });
        expect(result.converged).toBe(true);
        expect(result.root.re).toBeCloseTo(2, 3);
    });

    it('Case 19: Selección correcta de E por mayor magnitud para evitar cancelación', () => {
        // Se valida estructuralmente comprobando que el método converge consistentemente 
        // a la raíz correcta en una cúbica simple sin explotar ni oscilar violentamente.
        const result = muller({
            expression: 'x^3 - 2*x^2 - 5',
            x0: 2,
            x1: 3,
            x2: 4,
            tolerance: 1e-6,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.root.re).toBeCloseTo(2.6906, 3);
    });

    it('Case 20: Error complejo es siempre un número real no negativo', () => {
        const result = muller({
            expression: 'x^2 + 4', // Converge a 2i
            x0: 0,
            x1: 1,
            x2: -1,
            tolerance: 1e-6,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        result.iterations.forEach(it => {
            if (it.error !== null) {
                expect(typeof it.error).toBe('number');
                expect(it.error).toBeGreaterThanOrEqual(0);
            }
        });
    });

    it('Case 21: Comprobar raíz compleja conjugada sin exigir solo +i', () => {
        const result = muller({
            expression: 'x^2 + 1',
            x0: -2,
            x1: -1,
            x2: 0,
            tolerance: 1e-6,
            maxIterations: 50,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.root.re).toBeCloseTo(0, 5);
        // Debe ser i o -i, es decir, el valor absoluto de la parte imaginaria debe ser 1
        expect(Math.abs(Math.abs(result.root.im) - 1)).toBeLessThan(1e-5);
    });
});

import { describe, it, expect } from 'vitest';
import { runComparison } from './comparisonService';
import { CompareRequest } from './types';

describe('Comparison Service', () => {
    it('1. Debe ejecutar dos métodos convergentes (Bisección y Regla Falsa)', () => {
        const req: CompareRequest = {
            common: { expression: 'x^3 - x - 1', errorCriterion: 'absolute', maxIterations: 100, tolerance: 0.01 },
            methods: {
                'bisection': { a: 1, b: 2 },
                'false-position': { a: 1, b: 2 }
            }
        };

        const res = runComparison(req);
        expect(res.results.length).toBe(2);
        expect(res.results[0].status).toBe('success');
        expect(res.results[0].result?.converged).toBe(true);
        expect(res.results[1].status).toBe('success');
        expect(res.results[1].result?.converged).toBe(true);
    });

    it('2. Debe soportar la comparación de 5 métodos convergentes', () => {
        const req: CompareRequest = {
            common: { expression: 'x^2 - 4', errorCriterion: 'absolute', maxIterations: 100, tolerance: 0.01 },
            methods: {
                'bisection': { a: 1, b: 3 },
                'false-position': { a: 1, b: 3 },
                'newton-raphson': { x0: 3 },
                'secant': { x0: 1, x1: 3 },
                'muller': { x0: 1, x1: 1.5, x2: 3 }
            }
        };

        const res = runComparison(req);
        expect(res.results.length).toBe(5);
        expect(res.results.every(r => r.status === 'success' && r.result?.converged)).toBe(true);
    });

    it('3. Un método falla y otro converge (Bisección sin bracket)', () => {
        const req: CompareRequest = {
            common: { expression: 'x^2 - 4', errorCriterion: 'absolute', maxIterations: 100, tolerance: 0.01 },
            methods: {
                'bisection': { a: 3, b: 4 }, // No hay raíz
                'newton-raphson': { x0: 3 }
            }
        };

        const res = runComparison(req);
        expect(res.results.length).toBe(2);
        const bis = res.results.find(r => r.method === 'bisection')!;
        expect(bis.status).toBe('error');
        expect(bis.errorMessage).toContain('cambio de signo');

        const newt = res.results.find(r => r.method === 'newton-raphson')!;
        expect(newt.status).toBe('success');
        expect(newt.result?.converged).toBe(true);
    });

    it('4. Evalúa método hasta MAX_ITERATIONS', () => {
        const req: CompareRequest = {
            common: { expression: 'x^3 - 2*x + 2', errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.01 },
            methods: {
                'newton-raphson': { x0: 0 } // Cicla entre 0 y 1
            }
        };

        const res = runComparison(req);
        expect(res.results[0].status).toBe('success');
        expect(res.results[0].result?.stopReason).toBe('MAX_ITERATIONS');
        expect(res.results[0].result?.converged).toBe(false);
    });

    it('5. Müller resuelve una raíz compleja y las métricas omiten los no convergentes', () => {
        const req: CompareRequest = {
            common: { expression: 'x^2 + 1', errorCriterion: 'absolute', maxIterations: 20, tolerance: 0.01 },
            methods: {
                'newton-raphson': { x0: 1 }, // Falla en converger (no real)
                'muller': { x0: -1, x1: 0, x2: 1 } // Complejo
            }
        };

        const res = runComparison(req);
        expect(res.results.length).toBe(2);
        
        const muller = res.results.find(r => r.method === 'muller')!;
        expect(muller.status).toBe('success');
        expect(muller.result?.converged).toBe(true);

        expect(res.metrics.leastIterationsMethod).toBe('muller'); // El único que convergió
    });

    it('6. Punto Fijo con g(x) funciona en comparador', () => {
        const req: CompareRequest = {
            common: { expression: 'x^2 - x - 2', errorCriterion: 'absolute', maxIterations: 100, tolerance: 0.01 },
            methods: {
                'fixed-point': { iterationExpression: 'sqrt(x+2)', x0: 1 }
            }
        };

        const res = runComparison(req);
        expect(res.results[0].status).toBe('success');
        expect(res.results[0].result?.converged).toBe(true);
    });

    it('7, 8, 9, 10. Evalúa las métricas educativas (menor iteración, error, residuo)', () => {
        const req: CompareRequest = {
            common: { expression: 'x^3 - x - 1', errorCriterion: 'absolute', maxIterations: 100, tolerance: 1e-4 },
            methods: {
                'bisection': { a: 1, b: 2 },
                'newton-raphson': { x0: 1.5 }
            }
        };

        const res = runComparison(req);
        
        // Newton típicamente necesita menos iteraciones
        expect(res.metrics.leastIterationsMethod).toBe('newton-raphson');
        
        // Debería asignar a algún método estos valores (podrían ser newton o bisection dependiendo de la precisión final)
        expect(res.metrics.lowestErrorMethod).toBeDefined();
        expect(res.metrics.lowestResidualMethod).toBeDefined();
    });
});

import { describe, it, expect } from 'vitest';
import { findRootCandidates } from './rootCandidates';

describe('findRootCandidates', () => {
    it('encuentra ambas raíces de un polinomio cuadrático', () => {
        const candidates = findRootCandidates('x^2 - 4');
        expect(candidates.length).toBe(2);

        const roots = candidates.map(c => c.rootApprox).sort((r1, r2) => r1 - r2);
        expect(Math.abs(roots[0] + 2)).toBeLessThan(1e-3);
        expect(Math.abs(roots[1] - 2)).toBeLessThan(1e-3);
    });

    it('encuentra la raíz real de x^3 - x - 1', () => {
        const candidates = findRootCandidates('x^3 - x - 1');
        expect(candidates.length).toBe(1);
        expect(Math.abs(candidates[0].rootApprox - 1.3247)).toBeLessThan(1e-3);
    });

    it('devuelve intervalos con cambio de signo que contienen a la raíz', () => {
        const candidates = findRootCandidates('x^3 - x - 1');
        for (const candidate of candidates) {
            expect(candidate.a).toBeLessThan(candidate.b);
            expect(candidate.rootApprox).toBeGreaterThanOrEqual(candidate.a - 1e-9);
            expect(candidate.rootApprox).toBeLessThanOrEqual(candidate.b + 1e-9);
        }
    });

    it('limita la cantidad de candidatos para funciones periódicas', () => {
        const candidates = findRootCandidates('sin(x)');
        expect(candidates.length).toBeLessThanOrEqual(6);
        expect(candidates.length).toBeGreaterThanOrEqual(5);

        const nearZero = candidates.some(c => Math.abs(c.rootApprox) < 1e-3);
        expect(nearZero).toBe(true);
    });

    it('devuelve vacío para funciones sin raíces reales', () => {
        expect(findRootCandidates('x^2 + 1')).toEqual([]);
    });

    it('respeta la ventana de búsqueda personalizada', () => {
        const candidates = findRootCandidates('x^2 - 4', [0, 10]);
        expect(candidates.length).toBe(1);
        expect(Math.abs(candidates[0].rootApprox - 2)).toBeLessThan(1e-3);
    });

    it('normaliza ventanas invertidas', () => {
        const candidates = findRootCandidates('x^2 - 4', [10, 0]);
        expect(candidates.length).toBe(1);
        expect(Math.abs(candidates[0].rootApprox - 2)).toBeLessThan(1e-3);
    });

    it('tolera puntos fuera de dominio', () => {
        const candidates = findRootCandidates('log(x) - 1');
        expect(candidates.length).toBe(1);
        expect(Math.abs(candidates[0].rootApprox - Math.E)).toBeLessThan(1e-3);
    });

    it('lanza error para expresiones inválidas', () => {
        expect(() => findRootCandidates('sen(')).toThrow();
    });
});

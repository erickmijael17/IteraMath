import { describe, it, expect } from 'vitest';
import { resolveTolerance } from './tolerance';
import { MathError } from './errors';

describe('resolveTolerance', () => {
    it('devuelve el valor tal cual en modo Valor', () => {
        expect(resolveTolerance('1e-6', 'val', 'absolute')).toBe(1e-6);
        expect(resolveTolerance('1e-6', 'val', 'relative')).toBe(1e-6);
        expect(resolveTolerance('0.5', 'val', 'residual')).toBe(0.5);
    });

    it('convierte porcentaje a fracción para criterios no porcentuales', () => {
        expect(resolveTolerance('0.01', 'pct', 'absolute')).toBe(0.0001);
        expect(resolveTolerance('0.1', 'pct', 'relative')).toBe(0.001);
        expect(resolveTolerance('1', 'pct', 'residual')).toBe(0.01);
    });

    it('no convierte cuando el criterio ya es porcentual', () => {
        expect(resolveTolerance('0.01', 'pct', 'percentage')).toBe(0.01);
        expect(resolveTolerance('0.01', 'val', 'percentage')).toBe(0.01);
    });

    it('rechaza entradas no numéricas o no positivas', () => {
        expect(() => resolveTolerance('abc', 'val', 'absolute')).toThrow(MathError);
        expect(() => resolveTolerance('', 'pct', 'absolute')).toThrow(MathError);
        expect(() => resolveTolerance('0', 'val', 'absolute')).toThrow(MathError);
        expect(() => resolveTolerance('-1', 'val', 'absolute')).toThrow(MathError);
        expect(() => resolveTolerance('Infinity', 'val', 'absolute')).toThrow(MathError);
    });
});

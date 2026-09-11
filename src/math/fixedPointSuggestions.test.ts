import { describe, it, expect } from 'vitest';
import { suggestFixedPointFunctions } from './fixedPointSuggestions';

const compact = (expression: string): string => expression.replace(/\s+/g, '');

describe('suggestFixedPointFunctions', () => {
    it('genera el despeje de libro para x^3 - x - 2', () => {
        const suggestions = suggestFixedPointFunctions('x^3 - x - 2');

        const despeje = suggestions.find(s => s.originLabel === 'Despeje');
        expect(despeje).toBeDefined();
        expect(compact(despeje!.expression)).toBe('(x+2)^(1/3)');
        expect(despeje!.rootApprox).toBeCloseTo(1.5214, 3);
        expect(despeje!.slopeMagnitude).toBeCloseTo(0.144, 2);
    });

    it('incluye la forma de Newton para x^3 - x - 2', () => {
        const suggestions = suggestFixedPointFunctions('x^3 - x - 2');

        const newton = suggestions.find(s => s.originLabel === 'Newton');
        expect(newton).toBeDefined();
        expect(newton!.slopeMagnitude).toBeLessThan(1e-6);
    });

    it('descarta el despeje divergente de x^3 - x - 2', () => {
        const suggestions = suggestFixedPointFunctions('x^3 - x - 2');

        const expressions = suggestions.map(s => compact(s.expression));
        expect(expressions).not.toContain('(x^3-2)');
    });

    it('limita a tres sugerencias', () => {
        const suggestions = suggestFixedPointFunctions('x^3 - x - 2');
        expect(suggestions.length).toBe(3);
    });

    it('genera sqrt para x^2 - 2 con pendiente nula', () => {
        const suggestions = suggestFixedPointFunctions('x^2 - 2');

        const despeje = suggestions.find(s => s.originLabel === 'Despeje');
        expect(despeje).toBeDefined();
        expect(compact(despeje!.expression)).toBe('sqrt((2))');
        expect(despeje!.slopeMagnitude).toBe(0);
    });

    it('despeja exp(-x) - x como g(x) = exp(-x)', () => {
        const suggestions = suggestFixedPointFunctions('exp(-x) - x');

        const despeje = suggestions.find(s => s.originLabel === 'Despeje');
        expect(despeje).toBeDefined();
        expect(compact(despeje!.expression)).toBe('(exp(-x))');
        expect(despeje!.slopeMagnitude).toBeCloseTo(0.567, 2);
    });

    it('despeja cos(x) - x como g(x) = cos(x)', () => {
        const suggestions = suggestFixedPointFunctions('cos(x) - x');

        const despeje = suggestions.find(s => s.originLabel === 'Despeje');
        expect(despeje).toBeDefined();
        expect(compact(despeje!.expression)).toBe('(cos(x))');
        expect(despeje!.slopeMagnitude).toBeCloseTo(0.674, 2);
    });

    it('despeja con coeficiente: 2x - 6', () => {
        const suggestions = suggestFixedPointFunctions('2*x - 6');

        const despeje = suggestions.find(s => s.originLabel === 'Despeje');
        expect(despeje).toBeDefined();
        expect(compact(despeje!.expression)).toBe('(6/2)');
        expect(despeje!.slopeMagnitude).toBe(0);
    });

    it('devuelve vacío si no hay raíces reales', () => {
        expect(suggestFixedPointFunctions('x^2 + 1')).toEqual([]);
    });

    it('devuelve vacío si la expresión es inválida', () => {
        expect(suggestFixedPointFunctions('x^2 +')).toEqual([]);
    });

    it('no repite sugerencias cuando cuerda coincide con Newton', () => {
        const suggestions = suggestFixedPointFunctions('x - 3');

        const expressions = suggestions.map(s => s.expression);
        expect(new Set(expressions).size).toBe(expressions.length);
        expect(suggestions.length).toBe(2);
    });

    it('respeta la raíz indicada explícitamente', () => {
        const suggestions = suggestFixedPointFunctions('x^2 - 2', Math.SQRT2);

        expect(suggestions.length).toBeGreaterThan(0);
        suggestions.forEach(suggestion => {
            expect(suggestion.rootApprox).toBe(Math.SQRT2);
        });
    });
});

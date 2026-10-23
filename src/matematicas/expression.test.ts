import { describe, it, expect } from 'vitest';
import { createExpression } from './expression';


describe('Expression Parser', () => {
    it('evaluates a simple polynomial expression', () => {
        const expr = createExpression('x^2 - 4');
        expect(expr.evaluate(3)).toBe(5);
        expect(expr.evaluate(2)).toBe(0);
    });

    it('evaluates trigonometric functions', () => {
        const expr = createExpression('sin(x)');
        expect(expr.evaluate(0)).toBe(0);
        // Math.sin(Math.PI/2) is 1
        expect(expr.evaluate(Math.PI / 2)).toBeCloseTo(1);
    });

    it('evaluates exponential functions', () => {
        const expr = createExpression('exp(-x)');
        expect(expr.evaluate(0)).toBe(1);
    });

    it('throws error for empty expression', () => {
        try { createExpression('   '); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_EXPRESSION'); }
    });

    it('throws error for invalid syntax', () => {
        try { createExpression('x^2 +'); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_EXPRESSION'); }
    });

    it('throws OUT_OF_DOMAIN for complex results in real context', () => {
        const expr = createExpression('sqrt(x)');
        try { expr.evaluate(-1); expect.fail(); } catch (e: any) { expect(['NON_FINITE_RESULT', 'OUT_OF_DOMAIN'].includes(e.code)).toBe(true); }
    });
});

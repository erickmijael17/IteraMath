import { describe, it, expect } from 'vitest';
import { calculateApproximationError, calculateResidual } from './error';
import { createExpression } from './expression';
import { MathError } from './errors';

describe('Error Calculations', () => {
    it('calculates absolute error correctly', () => {
        expect(calculateApproximationError(1, 1.1, 'absolute')).toBeCloseTo(0.1);
        expect(calculateApproximationError(5, 3, 'absolute')).toBe(2);
    });

    it('calculates relative error correctly', () => {
        // (1.1 - 1) / 1.1 = 0.1 / 1.1 = 0.090909...
        expect(calculateApproximationError(1, 1.1, 'relative')).toBeCloseTo(0.090909);
    });

    it('calculates percentage error correctly', () => {
        expect(calculateApproximationError(1, 1.1, 'percentage')).toBeCloseTo(9.0909);
    });

    it('throws DIVISION_BY_ZERO when calculating relative error with current = 0', () => {
        expect(() => calculateApproximationError(1, 0, 'relative')).toThrow(MathError);
        try {
            calculateApproximationError(1, 0, 'relative');
        } catch (e: any) {
            expect(e.code).toBe('DIVISION_BY_ZERO');
        }
    });

    it('calculates residual correctly using the expression evaluator', () => {
        const expr = createExpression('x^2 - 4');
        expect(calculateApproximationError(0, 2, 'residual', expr)).toBe(0);
        expect(calculateApproximationError(0, 3, 'residual', expr)).toBe(5);
        expect(calculateResidual(expr, -2)).toBe(0);
    });

    it('throws when evaluating residual without an evaluator', () => {
        try { calculateApproximationError(0, 2, 'residual'); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_EXPRESSION'); }
    });
});

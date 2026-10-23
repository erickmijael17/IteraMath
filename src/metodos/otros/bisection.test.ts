import { describe, it, expect } from 'vitest';
import { bisection } from './bisection';


describe('Bisection Method', () => {
    it('Case 1: detects exact root rapidly (x^2 - 4)', () => {
        const result = bisection({
            expression: 'x^2 - 4',
            a: 1,
            b: 3,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.root).toBe(2);
        expect(result.stopReason).toBe('EXACT_ROOT');
        expect(result.converged).toBe(true);
        // [1, 3] -> m=2, f(2)=0. Solved in 1 iteration (k=0)
        expect(result.totalIterations).toBe(1);
    });

    it('Case 2: approximates root successfully (x^3 - x - 1)', () => {
        const result = bisection({
            expression: 'x^3 - x - 1',
            a: 1,
            b: 2,
            tolerance: 0.0005,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.stopReason).toBe('TOLERANCE_REACHED');
        expect(result.root).toBeCloseTo(1.3247, 3);
        expect(result.finalError).toBeLessThanOrEqual(0.0005);
    });

    it('Case 3: throws INVALID_BRACKET for interval without sign change', () => {
        try {
            bisection({
                expression: 'x^2 + 1',
                a: -1,
                b: 1,
                tolerance: 1e-6,
                maxIterations: 100,
                errorCriterion: 'absolute'
            });
            expect.fail('Should have thrown MathError');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_BRACKET');
        }
    });

    it('Case 4: detects exact root at limit a', () => {
        const result = bisection({
            expression: 'x - 1',
            a: 1,
            b: 5,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.root).toBe(1);
        expect(result.totalIterations).toBe(0);
        expect(result.stopReason).toBe('EXACT_ROOT');
    });

    it('Case 5: detects exact root at limit b', () => {
        const result = bisection({
            expression: 'x - 1',
            a: -5,
            b: 1,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.root).toBe(1);
        expect(result.totalIterations).toBe(0);
        expect(result.stopReason).toBe('EXACT_ROOT');
    });

    it('Case 6: stops at max iterations', () => {
        const result = bisection({
            expression: 'x^3 - x - 1',
            a: 1,
            b: 2,
            tolerance: 1e-15,
            maxIterations: 1, // Only 1 iter
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(false);
        expect(result.stopReason).toBe('MAX_ITERATIONS');
        expect(result.totalIterations).toBe(1);
        expect(result.iterations.length).toBe(1);
    });

    it('Case 7: evaluates absolute error correctly', () => {
        const result = bisection({
            expression: 'x^2 - 4',
            a: 0,
            b: 3,
            tolerance: 0.1,
            maxIterations: 10,
            errorCriterion: 'absolute'
        });
        // k=0 -> m=1.5
        // k=1 -> a=1.5, b=3 -> m=2.25 -> err = |2.25 - 1.5| = 0.75
        expect(result.iterations[1].error).toBeCloseTo(0.75);
    });

    it('Case 8: evaluates relative error correctly', () => {
        const result = bisection({
            expression: 'x^2 - 4',
            a: 0,
            b: 3,
            tolerance: 0.1,
            maxIterations: 10,
            errorCriterion: 'relative'
        });
        // k=0 -> m=1.5
        // k=1 -> a=1.5, b=3 -> m=2.25 -> err = |2.25 - 1.5| / 2.25 = 0.333...
        expect(result.iterations[1].error).toBeCloseTo(1/3);
    });

    it('Case 9: evaluates percentage error correctly', () => {
        const result = bisection({
            expression: 'x^2 - 4',
            a: 0,
            b: 3,
            tolerance: 5, // stop when < 5%
            maxIterations: 10,
            errorCriterion: 'percentage'
        });
        expect(result.iterations[1].error).toBeCloseTo(33.333);
    });

    it('Case 10: evaluates residual correctly', () => {
        const result = bisection({
            expression: 'x^2 - 4',
            a: 0,
            b: 3,
            tolerance: 1,
            maxIterations: 10,
            errorCriterion: 'residual'
        });
        // k=0 -> m=1.5 -> residual = |1.5^2 - 4| = |-1.75| = 1.75
        expect(result.iterations[0].error).toBeCloseTo(1.75);
    });

    it('Case 11: throws INVALID_INTERVAL when a >= b', () => {
        try {
            bisection({
                expression: 'x^2 - 4',
                a: 3,
                b: 1,
                tolerance: 1e-6,
                maxIterations: 100,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_INTERVAL');
        }
    });

    it('Case 12: preserves math engine error typing for invalid expressions', () => {
        try {
            bisection({
                expression: 'x^2 + ',
                a: 1,
                b: 3,
                tolerance: 1e-6,
                maxIterations: 100,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });
});

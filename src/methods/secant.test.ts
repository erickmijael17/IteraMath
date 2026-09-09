import { describe, it, expect } from 'vitest';
import { secant } from './secant';

describe('Secant Method', () => {
    it('Case 1: approximates root successfully (x^3 - x - 1)', () => {
        const result = secant({
            expression: 'x^3 - x - 1',
            x0: 1,
            x1: 2,
            tolerance: 0.0005,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.stopReason).toBe('TOLERANCE_REACHED');
        expect(result.root).toBeCloseTo(1.324717, 5);
        expect(result.finalError).toBeLessThanOrEqual(0.0005);
        
        // Comprobar la primera iteración según el ejemplo manual
        const iter0 = result.iterations[0];
        expect(iter0.xPrevious).toBe(1);
        expect(iter0.xCurrent).toBe(2);
        expect(iter0.fPrevious).toBe(-1);
        expect(iter0.fCurrent).toBe(5);
        expect(iter0.xNext).toBeCloseTo(1.1666666, 6);
    });

    it('Case 2: detects exact root rapidly if x0 is root', () => {
        const result = secant({
            expression: 'x^2 - 4',
            x0: 2,
            x1: 3,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.root).toBe(2);
        expect(result.stopReason).toBe('EXACT_ROOT');
        expect(result.converged).toBe(true);
        expect(result.totalIterations).toBe(0);
    });

    it('Case 3: detects exact root rapidly if x1 is root', () => {
        const result = secant({
            expression: 'x^2 - 4',
            x0: 3,
            x1: 2,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.root).toBe(2);
        expect(result.stopReason).toBe('EXACT_ROOT');
        expect(result.converged).toBe(true);
        expect(result.totalIterations).toBe(0);
    });

    it('Case 4: detects exact root during iteration', () => {
        const result = secant({
            expression: 'x^2 - 4',
            x0: 4, // f(4) = 12
            x1: 2.5, // f(2.5) = 2.25
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        // f(xNext) will eventually be exactly 0 or close enough.
        // If exact, it stops early.
        expect(result.converged).toBe(true);
        expect(Math.abs(result.root - 2)).toBeLessThan(1e-6);
    });

    it('Case 5: throws ZERO_SECANT_DENOMINATOR when f(x0) == f(x1)', () => {
        try {
            secant({
                expression: 'x^2',
                x0: -2, // f(-2) = 4
                x1: 2,  // f(2) = 4
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('ZERO_SECANT_DENOMINATOR');
        }
    });

    it('Case 6: stops at max iterations', () => {
        const result = secant({
            expression: 'x^3 - x - 1',
            x0: 1,
            x1: 2,
            tolerance: 1e-15,
            maxIterations: 2,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(false);
        expect(result.stopReason).toBe('MAX_ITERATIONS');
        expect(result.totalIterations).toBe(2);
    });

    it('Case 7: evaluates absolute error correctly from k=0', () => {
        const result = secant({
            expression: 'x^2 - 4',
            x0: 0,
            x1: 3,
            tolerance: 0.1,
            maxIterations: 1,
            errorCriterion: 'absolute'
        });
        // f(0)=-4, f(3)=5
        // x2 = 3 - 5(3-0)/(5 - -4) = 3 - 15/9 = 3 - 1.666 = 1.333
        // Error abs = |1.333 - 3| = 1.666
        expect(result.iterations[0].error).toBeCloseTo(1.6666, 3);
    });

    it('Case 8: evaluates relative error correctly from k=0', () => {
        const result = secant({
            expression: 'x^2 - 4',
            x0: 0,
            x1: 3,
            tolerance: 0.1,
            maxIterations: 1,
            errorCriterion: 'relative'
        });
        // Error rel = 1.666 / 1.333 = 1.25
        expect(result.iterations[0].error).toBeCloseTo(1.25, 2);
    });

    it('Case 9: evaluates percentage error correctly from k=0', () => {
        const result = secant({
            expression: 'x^2 - 4',
            x0: 0,
            x1: 3,
            tolerance: 10,
            maxIterations: 1,
            errorCriterion: 'percentage'
        });
        // Error pct = 125
        expect(result.iterations[0].error).toBeCloseTo(125, 1);
    });

    it('Case 10: evaluates residual correctly', () => {
        const result = secant({
            expression: 'x^2 - 4',
            x0: 0,
            x1: 3,
            tolerance: 1,
            maxIterations: 1,
            errorCriterion: 'residual'
        });
        // x2 = 1.333
        // f(x2) = (1.333)^2 - 4 = 1.777 - 4 = -2.222
        // residual = |-2.222| = 2.222
        expect(result.iterations[0].error).toBeCloseTo(2.222, 2);
        expect(result.iterations[0].residual).toBeCloseTo(2.222, 2);
    });

    it('Case 11: throws for invalid function', () => {
        try {
            secant({
                expression: 'x^2 + ',
                x0: 1,
                x1: 2,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });

    it('Case 12: validates x0 finiteness', () => {
        try {
            secant({
                expression: 'x^2 - 4',
                x0: NaN,
                x1: 2,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 13: validates x1 finiteness', () => {
        try {
            secant({
                expression: 'x^2 - 4',
                x0: 1,
                x1: Infinity,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 14: catches iteration out of domain', () => {
        try {
            secant({
                expression: 'sqrt(x)',
                x0: 1,
                x1: 2, // secant extrapolates to negative
                // f(1)=1, f(2)=1.414
                // x2 = 2 - 1.414*(1)/0.414 = 2 - 3.41 = -1.41
                // sqrt(-1.41) -> OUT_OF_DOMAIN
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('OUT_OF_DOMAIN');
        }
    });

    it('Case 15: can execute without sign change', () => {
        // secant doesn't strictly need sign change like bracket methods
        const result = secant({
            expression: '(x-2)^2 - 1', // roots at 1, 3
            x0: 4, // f(4) = 3
            x1: 5, // f(5) = 8
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.root).toBeCloseTo(3, 4);
    });

});

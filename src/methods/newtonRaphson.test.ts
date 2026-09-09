import { describe, it, expect } from 'vitest';
import { newtonRaphson } from './newtonRaphson';

describe('Newton-Raphson Method', () => {
    it('Case 1: approximates root successfully (x^3 - x - 1)', () => {
        const result = newtonRaphson({
            expression: 'x^3 - x - 1',
            x0: 1.5,
            tolerance: 0.0005,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.stopReason).toBe('TOLERANCE_REACHED');
        expect(result.root).toBeCloseTo(1.3247, 4);
        expect(result.finalError).toBeLessThanOrEqual(0.0005);
        expect(result.derivativeExpression).toBeDefined();
        
        // Comprobar la primera iteración según el ejemplo manual
        const iter0 = result.iterations[0];
        expect(iter0.xCurrent).toBe(1.5);
        expect(iter0.fx).toBeCloseTo(0.875, 4);
        expect(iter0.dfx).toBeCloseTo(5.75, 4);
        expect(iter0.xNext).toBeCloseTo(1.347826, 5);
    });

    it('Case 2: detects exact root rapidly if x0 is root', () => {
        const result = newtonRaphson({
            expression: 'x^2 - 4',
            x0: 2,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.root).toBe(2);
        expect(result.stopReason).toBe('EXACT_ROOT');
        expect(result.converged).toBe(true);
        expect(result.totalIterations).toBe(0);
    });

    it('Case 3: detects exact root during iteration', () => {
        // x^2 - 4. iter: x_{k+1} = x - (x^2-4)/2x
        // if x0 = 4 -> x1 = 4 - 12/8 = 2.5
        // x2 = 2.5 - (6.25-4)/5 = 2.5 - 2.25/5 = 2.05
        // just let it converge fast
        const result = newtonRaphson({
            expression: 'x - 2',
            x0: 4,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        // deriv is 1
        // x1 = 4 - (4-2)/1 = 2 -> Exact root!
        expect(result.root).toBe(2);
        expect(result.stopReason).toBe('EXACT_ROOT');
        expect(result.converged).toBe(true);
        expect(result.totalIterations).toBe(1);
    });

    it('Case 4: throws ZERO_DERIVATIVE when f\'(x) = 0', () => {
        try {
            newtonRaphson({
                expression: 'x^2 - 4',
                x0: 0, // deriv is 2x -> 0
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('ZERO_DERIVATIVE');
        }
    });

    it('Case 5: stops at max iterations', () => {
        const result = newtonRaphson({
            expression: 'x^3 - x - 1',
            x0: 1.5,
            tolerance: 1e-15,
            maxIterations: 2,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(false);
        expect(result.stopReason).toBe('MAX_ITERATIONS');
        expect(result.totalIterations).toBe(2);
    });

    it('Case 6: evaluates absolute error correctly from k=0', () => {
        const result = newtonRaphson({
            expression: 'x^2 - 4',
            x0: 4,
            tolerance: 0.1,
            maxIterations: 1,
            errorCriterion: 'absolute'
        });
        // x1 = 2.5. Error = 1.5
        expect(result.iterations[0].error).toBeCloseTo(1.5, 4);
    });

    it('Case 7: evaluates relative error correctly from k=0', () => {
        const result = newtonRaphson({
            expression: 'x^2 - 4',
            x0: 4,
            tolerance: 0.1,
            maxIterations: 1,
            errorCriterion: 'relative'
        });
        // x1 = 2.5. Error rel = 1.5 / 2.5 = 0.6
        expect(result.iterations[0].error).toBeCloseTo(0.6, 4);
    });

    it('Case 8: evaluates percentage error correctly from k=0', () => {
        const result = newtonRaphson({
            expression: 'x^2 - 4',
            x0: 4,
            tolerance: 10,
            maxIterations: 1,
            errorCriterion: 'percentage'
        });
        // Error pct = 60
        expect(result.iterations[0].error).toBeCloseTo(60, 2);
    });

    it('Case 9: evaluates residual correctly', () => {
        const result = newtonRaphson({
            expression: 'x^2 - 4',
            x0: 4,
            tolerance: 1,
            maxIterations: 1,
            errorCriterion: 'residual'
        });
        // x1 = 2.5. f(2.5) = 2.25
        expect(result.iterations[0].error).toBeCloseTo(2.25, 4);
        expect(result.iterations[0].residual).toBeCloseTo(2.25, 4);
    });

    it('Case 10: throws for invalid function', () => {
        try {
            newtonRaphson({
                expression: 'x^2 + ',
                x0: 1,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });

    it('Case 11: validates x0 finiteness', () => {
        try {
            newtonRaphson({
                expression: 'x^2 - 4',
                x0: NaN,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 12: catches iteration out of domain', () => {
        try {
            newtonRaphson({
                expression: 'sqrt(x-2)',
                x0: 2.1,
                // f'(x) = 1/(2*sqrt(x-2))
                // at 2.1: f(2.1) = sqrt(0.1) = 0.316. f'(2.1) = 1/0.632 = 1.58
                // x1 = 2.1 - 0.316/1.58 = 2.1 - 0.2 = 1.9
                // f(1.9) = sqrt(-0.1) -> NaN
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('OUT_OF_DOMAIN');
        }
    });

});
